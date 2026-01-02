import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { BadRequestError, NotFoundError, RateLimitError } from '../utils/errors.js';
import { config } from '../config/index.js';
import * as visionService from '../services/vision.service.js';
import * as attractionService from '../services/attraction.service.js';
import * as visitService from '../services/visit.service.js';
import { prisma } from '../config/database.js';

// Validation schemas
const verifySchema = z.object({
  image: z.string().min(100, 'Invalid image data'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(1000).max(100000).default(50000),
});

const confirmSchema = z.object({
  attractionId: z.string().uuid(),
});

// Rate limits by subscription tier
const RATE_LIMITS = {
  free: 5,
  premium: 50,
};

/**
 * Check if user has exceeded daily verification limit
 */
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier || 'free';
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayScans = await prisma.dailyScan.count({
    where: {
      userId,
      scanDate: { gte: startOfDay },
    },
  });

  return {
    allowed: todayScans < limit,
    remaining: Math.max(0, limit - todayScans),
  };
}

/**
 * Record a verification scan
 */
async function recordScan(
  userId: string,
  result: visionService.VerificationResult,
  imagePreview?: string
): Promise<void> {
  await prisma.dailyScan.create({
    data: {
      userId,
      scanDate: new Date(),
      photoUrl: imagePreview?.substring(0, 500), // Store truncated preview
      result: JSON.stringify(result),
    },
  });
}

/**
 * Map attraction to summary for API response
 */
function mapAttractionToResponse(attraction: any) {
  return {
    id: attraction.id,
    name: attraction.name,
    city: attraction.location?.city || attraction.city?.name || '',
    country: attraction.location?.country || attraction.city?.country?.name || '',
    category: attraction.category,
    thumbnailUrl: attraction.thumbnailUrl,
  };
}

/**
 * POST /api/v1/verification/verify
 * Verify an attraction from an image
 */
export const verifyAttraction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = verifySchema.parse(req.body);

  // Check rate limit
  const rateLimit = await checkRateLimit(userId);
  if (!rateLimit.allowed) {
    throw new RateLimitError();
  }

  // Determine search mode based on location
  const hasLocation = data.latitude !== undefined && data.longitude !== undefined;
  let attractions: visionService.AttractionContext[];

  if (hasLocation) {
    // Camera mode: location-based search
    const nearbyAttractions = await attractionService.getNearbyAttractions(
      data.latitude!,
      data.longitude!,
      data.radiusMeters,
      undefined, // no category filter
      config.vision.maxAttractions,
      userId
    );

    attractions = nearbyAttractions.map(a => ({
      id: a.id,
      name: a.name,
      city: a.location?.city || '',
      country: a.location?.country || '',
      category: a.category,
      description: a.shortDescription,
      shortDescription: a.shortDescription,
      famousFor: null,
      highlights: [],
    }));

    if (attractions.length === 0) {
      return sendSuccess(res, {
        matched: false,
        confidence: 0,
        message: 'No attractions found within the specified area. Try expanding your search radius.',
        scansRemaining: rateLimit.remaining - 1,
      });
    }
  } else {
    // Upload mode: global search using two-pass approach
    const description = await visionService.getImageDescription(data.image);
    const keywords = visionService.extractKeywords(description);

    if (keywords.length === 0) {
      // Record scan and return
      await recordScan(userId, { matched: false, confidence: 0, attractionId: null, explanation: 'Could not identify location in image' });
      return sendSuccess(res, {
        matched: false,
        confidence: 0,
        message: 'Could not identify a tourist attraction in this image. Please try a clearer photo.',
        scansRemaining: rateLimit.remaining - 1,
      });
    }

    // Search database by keywords
    const searchQuery = keywords.slice(0, 5).join(' ');
    const searchResult = await attractionService.searchAttractions(
      { query: searchQuery, limit: config.vision.maxAttractions },
      userId
    );

    attractions = searchResult.items.map(a => ({
      id: a.id,
      name: a.name,
      city: a.location?.city || '',
      country: a.location?.country || '',
      category: a.category,
      description: a.shortDescription,
      shortDescription: a.shortDescription,
      famousFor: null,
      highlights: [],
    }));

    if (attractions.length === 0) {
      await recordScan(userId, { matched: false, confidence: 0, attractionId: null, explanation: 'No matching attractions found' });
      return sendSuccess(res, {
        matched: false,
        confidence: 0,
        message: 'No matching attractions found in our database.',
        scansRemaining: rateLimit.remaining - 1,
      });
    }
  }

  // Verify image against attractions using Claude Vision
  const result = await visionService.verifyAttractionImage(data.image, attractions);

  // Record the scan
  await recordScan(userId, result);

  const { confidenceThresholds } = config.vision;

  // High confidence - auto-create visit
  if (result.matched && result.confidence >= confidenceThresholds.autoMatch && result.attractionId) {
    try {
      const visitResult = await visitService.markVisited(userId, {
        attractionId: result.attractionId,
        notes: `Verified via AI vision (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
      });

      const attraction = await attractionService.getAttractionById(result.attractionId, userId);

      return sendCreated(res, {
        matched: true,
        confidence: result.confidence,
        explanation: result.explanation,
        attraction: mapAttractionToResponse(attraction),
        visit: {
          id: visitResult.visit.id,
          visitDate: visitResult.visit.visitDate,
        },
        scansRemaining: rateLimit.remaining - 1,
      });
    } catch (error: any) {
      // Handle duplicate visit
      if (error.code === 'CONFLICT') {
        const attraction = await attractionService.getAttractionById(result.attractionId, userId);
        return sendSuccess(res, {
          matched: true,
          confidence: result.confidence,
          explanation: result.explanation,
          attraction: mapAttractionToResponse(attraction),
          alreadyVisited: true,
          message: 'You have already visited this attraction!',
          scansRemaining: rateLimit.remaining - 1,
        });
      }
      throw error;
    }
  }

  // Medium confidence - suggest for confirmation
  if (result.confidence >= confidenceThresholds.suggest && result.attractionId) {
    const attraction = await attractionService.getAttractionById(result.attractionId, userId);
    return sendSuccess(res, {
      matched: false,
      confidence: result.confidence,
      requiresConfirmation: true,
      suggestion: mapAttractionToResponse(attraction),
      message: `Is this ${attraction.name}?`,
      explanation: result.explanation,
      scansRemaining: rateLimit.remaining - 1,
    });
  }

  // Low or no confidence
  return sendSuccess(res, {
    matched: false,
    confidence: result.confidence,
    message: 'No matching attraction found. Please try a different angle or clearer photo.',
    explanation: result.explanation,
    scansRemaining: rateLimit.remaining - 1,
  });
});

/**
 * POST /api/v1/verification/confirm
 * Confirm a suggested match and create visit
 */
export const confirmSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { attractionId } = confirmSchema.parse(req.body);

  // Verify attraction exists
  const attraction = await attractionService.getAttractionById(attractionId, userId);
  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  try {
    const visitResult = await visitService.markVisited(userId, {
      attractionId,
      notes: 'Verified via AI vision (user confirmed)',
    });

    return sendCreated(res, {
      matched: true,
      attraction: mapAttractionToResponse(attraction),
      visit: {
        id: visitResult.visit.id,
        visitDate: visitResult.visit.visitDate,
      },
    });
  } catch (error: any) {
    if (error.code === 'CONFLICT') {
      return sendSuccess(res, {
        matched: true,
        attraction: mapAttractionToResponse(attraction),
        alreadyVisited: true,
        message: 'You have already visited this attraction!',
      });
    }
    throw error;
  }
});

/**
 * GET /api/v1/verification/status
 * Get user's verification status (scans remaining, etc.)
 */
export const getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const rateLimit = await checkRateLimit(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = user?.subscriptionTier || 'free';
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;

  sendSuccess(res, {
    tier,
    dailyLimit: limit,
    scansRemaining: rateLimit.remaining,
    scansUsed: limit - rateLimit.remaining,
  });
});
