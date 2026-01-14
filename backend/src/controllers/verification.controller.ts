import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config/index.js';
import * as visionService from '../services/vision.service.js';
import * as googleVisionService from '../services/googleVision.service.js';
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

  // Step 1: Use Google Vision to identify the landmark from the image
  console.log('[Verification] Step 1: Identifying landmark with Google Vision...');
  const googleResult = await googleVisionService.detectLandmark(data.image);
  const searchKeywords = googleVisionService.getSearchKeywords(googleResult);

  // If Google Vision couldn't identify anything
  if (searchKeywords.length === 0) {
    await recordScan(userId, {
      matched: false,
      confidence: 0,
      attractionId: null,
      explanation: 'Google Vision could not identify any landmark in this image'
    });
    return sendSuccess(res, {
      matched: false,
      confidence: 0,
      message: 'Could not identify a tourist attraction in this image. Please try a clearer photo.',
      explanation: googleResult.description,
    });
  }

  console.log('[Verification] Google Vision identified:', {
    landmarks: googleResult.landmarks.map(l => l.name),
    bestGuess: googleResult.bestGuessLabels[0] || 'none',
    keywords: searchKeywords.slice(0, 5),
  });

  // Step 2: Get nearby attractions from user's location
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
      explanation: googleResult.description,
    });
  }

  console.log('[Verification] Found', nearbyAttractions.length, 'nearby attractions');

  // Step 3: Match Google Vision results against nearby attractions
  // Generic terms to ignore (too vague for matching)
  const genericTerms = new Set([
    'art', 'arts', 'the arts', 'visual arts', 'artist', 'creative arts',
    'building', 'architecture', 'structure', 'monument', 'landmark',
    'church', 'mosque', 'temple', 'museum', 'park', 'garden', 'square',
    'statue', 'tower', 'bridge', 'palace', 'castle', 'cathedral',
    'travel', 'tourism', 'tourist', 'attraction', 'destination',
    'city', 'town', 'place', 'location', 'site', 'area',
    'balloon', 'sky', 'cloud', 'tree', 'water', 'grass',
  ]);

  // Find ALL potential matches, then pick the closest one
  interface PotentialMatch {
    attraction: typeof nearbyAttractions[0];
    keyword: string;
    confidence: number;
  }
  const potentialMatches: PotentialMatch[] = [];

  for (const keyword of searchKeywords) {
    const keywordLower = keyword.toLowerCase();

    // Skip short keywords (< 5 chars) and generic terms
    if (keyword.length < 5 || genericTerms.has(keywordLower)) {
      console.log('[Verification] Skipping generic/short keyword:', keyword);
      continue;
    }

    for (const attraction of nearbyAttractions) {
      const attractionNameLower = attraction.name.toLowerCase();

      // Check for name match - require more substantial overlap
      const keywordWords = keywordLower.split(/\s+/);
      const attractionWords = attractionNameLower.split(/\s+/);

      // Check if keyword matches attraction name significantly
      const isMatch =
        // Full keyword in attraction name
        attractionNameLower.includes(keywordLower) ||
        // Full attraction name in keyword
        keywordLower.includes(attractionNameLower) ||
        // At least 2 words match (for multi-word names)
        (keywordWords.length >= 2 && keywordWords.filter(w => w.length > 3 && attractionNameLower.includes(w)).length >= 2) ||
        // At least 2 words from attraction name in keyword
        (attractionWords.length >= 2 && attractionWords.filter(w => w.length > 3 && keywordLower.includes(w)).length >= 2);

      if (isMatch) {
        // Determine confidence based on source
        let confidence = 0.7; // Default for web entity match

        // Higher confidence for landmark detection
        const landmarkMatch = googleResult.landmarks.find(
          l => l.name.toLowerCase().includes(keywordLower) || keywordLower.includes(l.name.toLowerCase())
        );
        if (landmarkMatch) {
          confidence = Math.max(confidence, landmarkMatch.confidence);
        }

        // Higher confidence for best guess match
        if (googleResult.bestGuessLabels.some(label =>
          label.toLowerCase().includes(keywordLower) || keywordLower.includes(label.toLowerCase())
        )) {
          confidence = Math.max(confidence, 0.8);
        }

        // Check if we already have this attraction in matches
        if (!potentialMatches.some(m => m.attraction.id === attraction.id)) {
          potentialMatches.push({ attraction, keyword, confidence });
        }
      }
    }
  }

  let result: visionService.VerificationResult = {
    matched: false,
    confidence: 0,
    attractionId: null,
    explanation: googleResult.description,
  };

  if (potentialMatches.length > 0) {
    // Sort by distance (nearbyAttractions is already sorted by distance, so use that order)
    // The attraction that appears first in nearbyAttractions is closest
    potentialMatches.sort((a, b) => {
      const aIndex = nearbyAttractions.findIndex(n => n.id === a.attraction.id);
      const bIndex = nearbyAttractions.findIndex(n => n.id === b.attraction.id);
      return aIndex - bIndex;
    });

    const bestMatch = potentialMatches[0];
    console.log('[Verification] Found', potentialMatches.length, 'potential matches');
    console.log('[Verification] All matches:', potentialMatches.map(m => ({
      name: m.attraction.name,
      keyword: m.keyword,
      distance: m.attraction.distance,
    })));
    console.log('[Verification] Selected closest match:', {
      keyword: bestMatch.keyword,
      attraction: bestMatch.attraction.name,
      distance: bestMatch.attraction.distance,
      confidence: bestMatch.confidence,
    });

    result = {
      matched: true,
      confidence: bestMatch.confidence,
      attractionId: bestMatch.attraction.id,
      explanation: `Matched "${bestMatch.keyword}" to "${bestMatch.attraction.name}" (closest match)`,
    };
  } else {
    // No match found
    const identifiedAs = googleResult.landmarks[0]?.name ||
                         googleResult.bestGuessLabels[0] ||
                         googleResult.webEntities[0]?.description ||
                         'unknown';
    result.explanation = `Identified as "${identifiedAs}" but no matching attraction found nearby`;
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
