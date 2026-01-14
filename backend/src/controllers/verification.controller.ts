import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config/index.js';
import * as visionService from '../services/vision.service.js';
import * as attractionService from '../services/attraction.service.js';
import * as visitService from '../services/visit.service.js';
import { subscriptionService } from '../services/subscription.service.js';
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

/**
 * Check if user has premium access for camera scanning
 */
async function checkPremiumAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  return subscriptionService.canUseFeature(userId, 'camera_scanning');
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
 * Verify an attraction from an image (Premium feature)
 */
export const verifyAttraction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = verifySchema.parse(req.body);

  // Check premium access - camera scanning is premium only
  const premiumAccess = await checkPremiumAccess(userId);
  if (!premiumAccess.allowed) {
    throw new ForbiddenError(premiumAccess.reason || 'Camera scanning requires Premium subscription');
  }

  // Location is required for camera scanning
  const hasLocation = data.latitude !== undefined && data.longitude !== undefined;

  if (!hasLocation) {
    return sendSuccess(res, {
      matched: false,
      confidence: 0,
      message: 'Location is required for camera scanning. Please enable location services.',
    });
  }

  // Step 1: Get all nearby attractions from the user's current area
  console.log('[Verification] Step 1: Getting nearby attractions...');
  const nearbyAttractions = await attractionService.getNearbyAttractions(
    data.latitude!,
    data.longitude!,
    data.radiusMeters, // User's radius (default 50km)
    undefined, // no category filter
    config.vision.maxAttractions, // Get up to maxAttractions (30)
    userId
  );

  if (nearbyAttractions.length === 0) {
    return sendSuccess(res, {
      matched: false,
      confidence: 0,
      message: 'No attractions found in your area. Try expanding your search radius.',
    });
  }

  // Convert to AttractionContext format
  const attractions: visionService.AttractionContext[] = nearbyAttractions.map(a => ({
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

  console.log('[Verification] Found', attractions.length, 'nearby attractions');

  // Step 2: Ask Claude to identify the attraction (without any list)
  console.log('[Verification] Step 2: Identifying attraction from image...');
  const identification = await visionService.identifyAttraction(data.image);

  // If Claude couldn't identify anything meaningful
  if (!identification.identified || identification.confidence < 0.3) {
    await recordScan(userId, {
      matched: false,
      confidence: identification.confidence,
      attractionId: null,
      explanation: identification.description || 'Could not identify attraction in image'
    });
    return sendSuccess(res, {
      matched: false,
      confidence: identification.confidence,
      message: 'Could not identify a tourist attraction in this image. Please try a clearer photo.',
      explanation: identification.description,
    });
  }

  console.log('[Verification] Claude identified:', {
    name: identification.name,
    city: identification.city,
    country: identification.country,
    confidence: identification.confidence,
  });

  // Step 3: Match Claude's identification with nearby attractions
  let result: visionService.VerificationResult;

  // Try to find a direct match by name among nearby attractions
  const identifiedNameLower = (identification.name || '').toLowerCase();
  const directMatch = attractions.find(a => {
    const attractionNameLower = a.name.toLowerCase();
    // Check if names match closely
    return attractionNameLower.includes(identifiedNameLower) ||
           identifiedNameLower.includes(attractionNameLower) ||
           // Handle common variations (remove spaces for comparison)
           attractionNameLower.replace(/\s+/g, '').includes(identifiedNameLower.replace(/\s+/g, '')) ||
           identifiedNameLower.replace(/\s+/g, '').includes(attractionNameLower.replace(/\s+/g, ''));
  });

  if (directMatch && identification.confidence >= 0.6) {
    // Direct match found with good confidence
    console.log('[Verification] Direct match found:', directMatch.name);
    result = {
      matched: true,
      confidence: identification.confidence,
      attractionId: directMatch.id,
      explanation: identification.description,
    };
  } else {
    // No direct match or low confidence - use Claude Vision to verify against nearby candidates
    console.log('[Verification] Step 3b: Verifying against', attractions.length, 'nearby candidates...');
    result = await visionService.verifyAttractionImage(data.image, attractions);
  }

  // Record the scan
  await recordScan(userId, result);

  const { confidenceThresholds } = config.vision;

  // High confidence - auto-create visit
  if (result.matched && result.confidence >= confidenceThresholds.autoMatch && result.attractionId) {
    try {
      const visitResult = await visitService.markVisited(userId, {
        attractionId: result.attractionId,
        notes: `Verified via AI vision (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
        isVerified: true, // Camera scan verified - counts for leaderboard
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
    });
  }

  // Low or no confidence
  return sendSuccess(res, {
    matched: false,
    confidence: result.confidence,
    message: 'No matching attraction found. Please try a different angle or clearer photo.',
    explanation: result.explanation,
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
      isVerified: true, // Camera scan verified - counts for leaderboard
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
 * Get user's verification status (premium access check)
 */
export const getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const status = await subscriptionService.getSubscriptionStatus(userId);

  sendSuccess(res, {
    tier: status.tier,
    isPremium: status.isPremium,
    canUseCameraScanning: status.features.canUseCameraScanning,
    message: status.features.canUseCameraScanning
      ? 'Camera scanning is available'
      : 'Upgrade to Premium to use camera scanning',
  });
});
