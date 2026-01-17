import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config/index.js';
import * as visionService from '../services/vision.service.js';
import * as openaiVisionService from '../services/openaiVision.service.js';
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

  // Step 1: Use OpenAI GPT-4 Vision to identify the landmark from the image
  console.log('[Verification] Step 1: Identifying landmark with OpenAI GPT-4 Vision...');
  const identification = await openaiVisionService.identifyAttraction(data.image);

  console.log('[Verification] OpenAI identification:', {
    identified: identification.identified,
    name: identification.name,
    alternativeNames: identification.alternativeNames,
    city: identification.city,
    country: identification.country,
    confidence: identification.confidence,
    hasVisualDescription: !!identification.visualDescription,
  });

  // Step 2: Get nearby attractions from user's location (always do this, even if not identified)
  console.log('[Verification] Step 2: Getting nearby attractions...');
  const nearbyAttractions = await attractionService.getNearbyAttractions(
    data.latitude!,
    data.longitude!,
    data.radiusMeters, // User's radius (default 50km)
    undefined, // no category filter
    config.vision.maxAttractions, // Get up to maxAttractions
    userId
  );

  if (nearbyAttractions.length === 0) {
    return sendSuccess(res, {
      matched: false,
      confidence: 0,
      message: 'No attractions found in your area. Try expanding your search radius.',
      explanation: identification.description,
    });
  }

  console.log('[Verification] Found', nearbyAttractions.length, 'nearby attractions');

  // Step 3: Match OpenAI's identification against nearby attractions
  // Build list of names to search for
  const searchNames = [
    identification.name,
    ...identification.alternativeNames,
  ].filter((name): name is string => name !== null && name.length > 0);

  if (searchNames.length > 0) {
    console.log('[Verification] Step 3: Trying name matching with:', searchNames);
  } else {
    console.log('[Verification] Step 3: No names identified by AI, skipping name matching, will try visual comparison');
  }

  // Find ALL potential matches, then pick the closest one
  interface PotentialMatch {
    attraction: typeof nearbyAttractions[0];
    matchedName: string;
    confidence: number;
  }
  const potentialMatches: PotentialMatch[] = [];

  for (const searchName of searchNames) {
    const searchNameLower = searchName.toLowerCase();

    for (const attraction of nearbyAttractions) {
      const attractionNameLower = attraction.name.toLowerCase();

      // Check for name match
      const searchWords = searchNameLower.split(/\s+/).filter(w => w.length > 2);
      const attractionWords = attractionNameLower.split(/\s+/).filter(w => w.length > 2);

      const isMatch =
        // Full name match
        attractionNameLower.includes(searchNameLower) ||
        searchNameLower.includes(attractionNameLower) ||
        // At least 2 significant words match
        (searchWords.length >= 2 && searchWords.filter(w => attractionNameLower.includes(w)).length >= 2) ||
        (attractionWords.length >= 2 && attractionWords.filter(w => searchNameLower.includes(w)).length >= 2);

      if (isMatch && !potentialMatches.some(m => m.attraction.id === attraction.id)) {
        potentialMatches.push({
          attraction,
          matchedName: searchName,
          confidence: identification.confidence,
        });
      }
    }
  }

  let result: visionService.VerificationResult = {
    matched: false,
    confidence: 0,
    attractionId: null,
    explanation: identification.description,
  };

  if (potentialMatches.length > 0) {
    // Sort by distance (nearbyAttractions is already sorted by distance)
    potentialMatches.sort((a, b) => {
      const aIndex = nearbyAttractions.findIndex(n => n.id === a.attraction.id);
      const bIndex = nearbyAttractions.findIndex(n => n.id === b.attraction.id);
      return aIndex - bIndex;
    });

    const bestMatch = potentialMatches[0];
    console.log('[Verification] Found', potentialMatches.length, 'potential matches');
    console.log('[Verification] All matches:', potentialMatches.map(m => ({
      name: m.attraction.name,
      matchedName: m.matchedName,
      distance: m.attraction.distance,
    })));
    console.log('[Verification] Selected closest match:', {
      matchedName: bestMatch.matchedName,
      attraction: bestMatch.attraction.name,
      distance: bestMatch.attraction.distance,
      confidence: bestMatch.confidence,
    });

    result = {
      matched: true,
      confidence: bestMatch.confidence,
      attractionId: bestMatch.attraction.id,
      explanation: `Matched "${bestMatch.matchedName}" to "${bestMatch.attraction.name}"`,
    };
  } else {
    // No name match found - try visual comparison fallback
    console.log('[Verification] No name match found. Trying visual comparison fallback...');

    const { imageComparison } = config.vision;

    if (imageComparison.enabled && identification.visualDescription) {
      // Get attractions with images for comparison
      const attractionsWithImages = nearbyAttractions
        .filter(a => a.images && a.images.length > 0)
        .slice(0, imageComparison.maxAttractionsToCompare);

      console.log('[Verification] Comparing with', attractionsWithImages.length, 'attractions that have images');

      interface ImageMatch {
        attraction: typeof nearbyAttractions[0];
        similarity: number;
        explanation: string;
      }
      const imageMatches: ImageMatch[] = [];

      // Compare user's photo with each attraction's first image
      for (const attraction of attractionsWithImages) {
        const attractionImageUrl = attraction.images![0]; // Safe: filtered above

        try {
          const comparison = await openaiVisionService.compareImages(
            data.image,
            identification.visualDescription,
            attractionImageUrl,
            attraction.name
          );

          if (comparison.similarity >= imageComparison.similarityThreshold) {
            imageMatches.push({
              attraction,
              similarity: comparison.similarity,
              explanation: comparison.explanation,
            });
          }
        } catch (err) {
          console.error('[Verification] Image comparison error for', attraction.name, err);
        }
      }

      if (imageMatches.length > 0) {
        // Sort by similarity (highest first)
        imageMatches.sort((a, b) => b.similarity - a.similarity);
        const bestImageMatch = imageMatches[0];

        console.log('[Verification] Found', imageMatches.length, 'visual matches');
        console.log('[Verification] Best visual match:', {
          attraction: bestImageMatch.attraction.name,
          similarity: bestImageMatch.similarity,
          explanation: bestImageMatch.explanation,
        });

        result = {
          matched: true,
          confidence: bestImageMatch.similarity,
          attractionId: bestImageMatch.attraction.id,
          explanation: `Visual match: ${bestImageMatch.explanation}`,
        };
      } else {
        result.explanation = `Identified as "${identification.name}" but no matching attraction found nearby (visual comparison also failed)`;
      }
    } else {
      result.explanation = `Identified as "${identification.name}" but no matching attraction found nearby`;
    }
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
