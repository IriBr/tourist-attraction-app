import vision from '@google-cloud/vision';
import { config } from '../config/index.js';
import { BadRequestError } from '../utils/errors.js';

// Types
export interface LandmarkResult {
  name: string;
  confidence: number;
  locations: { latitude: number; longitude: number }[];
}

export interface WebEntity {
  description: string;
  score: number;
}

export interface WebDetectionResult {
  landmarks: LandmarkResult[];
  webEntities: WebEntity[];
  bestGuessLabels: string[];
  description: string;
}

// Initialize client
let client: vision.ImageAnnotatorClient | null = null;

function getClient(): vision.ImageAnnotatorClient {
  if (!config.google.cloudVisionApiKey) {
    throw new BadRequestError('Google Cloud Vision API key not configured');
  }
  if (!client) {
    client = new vision.ImageAnnotatorClient({
      apiKey: config.google.cloudVisionApiKey,
    });
  }
  return client;
}

/**
 * Clean base64 image data (remove data URI prefix if present)
 */
function cleanBase64(imageBase64: string): string {
  if (imageBase64.startsWith('data:')) {
    return imageBase64.replace(/^data:image\/\w+;base64,/, '');
  }
  return imageBase64;
}

/**
 * Detect landmarks and web entities from an image using Google Cloud Vision
 */
export async function detectLandmark(imageBase64: string): Promise<WebDetectionResult> {
  const visionClient = getClient();
  const imageBuffer = Buffer.from(cleanBase64(imageBase64), 'base64');

  try {
    // Run both landmark detection and web detection in parallel
    const [landmarkResponse, webResponse] = await Promise.all([
      visionClient.landmarkDetection({ image: { content: imageBuffer } }),
      visionClient.webDetection({ image: { content: imageBuffer } }),
    ]);

    // Extract landmarks
    const landmarks: LandmarkResult[] = (landmarkResponse[0].landmarkAnnotations || []).map(
      (landmark) => ({
        name: landmark.description || '',
        confidence: landmark.score || 0,
        locations: (landmark.locations || [])
          .filter((loc) => loc.latLng?.latitude && loc.latLng?.longitude)
          .map((loc) => ({
            latitude: loc.latLng!.latitude!,
            longitude: loc.latLng!.longitude!,
          })),
      })
    );

    // Extract web entities
    const webDetection = webResponse[0].webDetection;
    const webEntities: WebEntity[] = (webDetection?.webEntities || [])
      .filter((entity) => entity.description && entity.score && entity.score > 0.5)
      .map((entity) => ({
        description: entity.description!,
        score: entity.score!,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Extract best guess labels
    const bestGuessLabels = (webDetection?.bestGuessLabels || [])
      .map((label) => label.label || '')
      .filter((label) => label.length > 0);

    // Build description from results
    let description = '';
    if (landmarks.length > 0) {
      description = `Landmark detected: ${landmarks[0].name} (${(landmarks[0].confidence * 100).toFixed(0)}% confidence)`;
    } else if (bestGuessLabels.length > 0) {
      description = `Best guess: ${bestGuessLabels[0]}`;
    } else if (webEntities.length > 0) {
      description = `Web match: ${webEntities[0].description}`;
    } else {
      description = 'No landmark or web match found';
    }

    const result: WebDetectionResult = {
      landmarks,
      webEntities,
      bestGuessLabels,
      description,
    };

    console.log('[GoogleVision] Detection result:', {
      landmarksFound: landmarks.length,
      topLandmark: landmarks[0]?.name || 'none',
      topLandmarkConfidence: landmarks[0]?.confidence || 0,
      webEntitiesFound: webEntities.length,
      topWebEntity: webEntities[0]?.description || 'none',
      bestGuess: bestGuessLabels[0] || 'none',
    });

    return result;
  } catch (error: any) {
    console.error('Google Cloud Vision API error:', error);

    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      throw new BadRequestError('Google Cloud Vision API access denied. Check API key permissions.');
    }

    if (error.code === 3 || error.message?.includes('INVALID_ARGUMENT')) {
      throw new BadRequestError('Invalid image format for Google Cloud Vision.');
    }

    throw new BadRequestError(
      error.message || 'Failed to process image with Google Cloud Vision'
    );
  }
}

/**
 * Get search keywords from detection result for database matching
 */
export function getSearchKeywords(result: WebDetectionResult): string[] {
  const keywords: string[] = [];

  // Add landmark names (highest priority)
  for (const landmark of result.landmarks) {
    if (landmark.name && landmark.confidence > 0.5) {
      keywords.push(landmark.name);
    }
  }

  // Add best guess labels
  for (const label of result.bestGuessLabels) {
    if (!keywords.includes(label)) {
      keywords.push(label);
    }
  }

  // Add top web entities
  for (const entity of result.webEntities.slice(0, 5)) {
    if (!keywords.includes(entity.description)) {
      keywords.push(entity.description);
    }
  }

  return keywords;
}
