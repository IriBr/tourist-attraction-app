import OpenAI from 'openai';
import { config } from '../config/index.js';
import { BadRequestError } from '../utils/errors.js';

// Types
export interface IdentificationResult {
  identified: boolean;
  name: string | null;
  alternativeNames: string[];
  city: string | null;
  country: string | null;
  category: string | null;
  confidence: number;
  description: string;
  visualDescription: string; // Detailed visual description for fallback matching
}

export interface ImageComparisonResult {
  matches: boolean;
  similarity: number; // 0-1 score
  explanation: string;
}

// Initialize client
let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!config.openai.apiKey) {
    throw new BadRequestError('OpenAI API key not configured');
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openai;
}

/**
 * Clean base64 image data and format for OpenAI
 */
function formatImageForOpenAI(imageBase64: string): string {
  // If it already has a data URI prefix, return as is
  if (imageBase64.startsWith('data:')) {
    return imageBase64;
  }
  // Otherwise, add the prefix (assume JPEG)
  return `data:image/jpeg;base64,${imageBase64}`;
}

/**
 * Identify a tourist attraction from an image using GPT-4 Vision
 */
export async function identifyAttraction(imageBase64: string): Promise<IdentificationResult> {
  const client = getClient();
  const imageUrl = formatImageForOpenAI(imageBase64);

  const prompt = `You are an expert at identifying tourist attractions, landmarks, monuments, and points of interest worldwide.

Analyze this image and identify what tourist attraction or landmark is shown. Use your knowledge to identify:
- Famous buildings, monuments, towers, bridges
- Churches, mosques, temples, religious sites
- Museums, palaces, castles, historical sites
- Natural landmarks, parks, famous locations
- Statues, memorials, public squares

IMPORTANT: Search the web/your knowledge to identify the SPECIFIC name of this attraction, not just generic categories.

RESPONSE FORMAT (JSON only, no markdown):
{
  "identified": true/false,
  "name": "Specific name of the attraction or null",
  "alternativeNames": ["Other names this place is known by"],
  "city": "City where located or null",
  "country": "Country where located or null",
  "category": "museum|landmark|religious|park|beach|castle|palace|bridge|tower|monument|statue|square|garden|other",
  "confidence": 0.0 to 1.0,
  "description": "Brief description of what you see and why you identified it",
  "visualDescription": "Detailed visual description of the image: architectural style, colors, materials, distinctive features, shapes, surrounding environment, time of day, weather conditions. Be specific about visual elements that could help match this to another photo of the same place."
}

CONFIDENCE GUIDELINES:
- 0.85-1.0: You clearly recognize this specific landmark
- 0.6-0.84: Fairly confident about the identification
- 0.3-0.59: Uncertain, making a guess
- 0.0-0.29: Cannot identify

Be SPECIFIC with names - include location qualifiers if needed (e.g., "Mosque of Namazgah" not just "mosque").
The visualDescription should focus on VISUAL features that would be consistent across different photos of the same place.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[OpenAI Vision] Empty response from identifyAttraction. Choices:', JSON.stringify(response.choices, null, 2));
      throw new Error('No response from OpenAI');
    }

    // Parse response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    const result: IdentificationResult = {
      identified: Boolean(parsed.identified),
      name: parsed.name || null,
      alternativeNames: Array.isArray(parsed.alternativeNames) ? parsed.alternativeNames : [],
      city: parsed.city || null,
      country: parsed.country || null,
      category: parsed.category || null,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      description: String(parsed.description || ''),
      visualDescription: String(parsed.visualDescription || ''),
    };

    console.log('[OpenAI Vision] Identification result:', {
      identified: result.identified,
      name: result.name,
      city: result.city,
      country: result.country,
      confidence: result.confidence,
      description: result.description,
      visualDescription: result.visualDescription,
    });

    return result;
  } catch (error: any) {
    console.error('OpenAI Vision error:', error);

    if (error.status === 429) {
      throw new BadRequestError('OpenAI rate limit exceeded. Please try again later.');
    }

    if (error.code === 'invalid_api_key') {
      throw new BadRequestError('OpenAI API key is invalid.');
    }

    return {
      identified: false,
      name: null,
      alternativeNames: [],
      city: null,
      country: null,
      category: null,
      confidence: 0,
      description: 'Failed to process image',
      visualDescription: '',
    };
  }
}

/**
 * Compare a user's photo with an attraction's reference image
 * Returns a similarity score and whether they match
 */
export async function compareImages(
  userPhotoBase64: string,
  userPhotoDescription: string,
  attractionImageUrl: string,
  attractionName: string
): Promise<ImageComparisonResult> {
  const client = getClient();

  const prompt = `You are an expert at comparing photographs of tourist attractions and landmarks.

You are given:
1. A user's photo (the image below)
2. A description of the user's photo: "${userPhotoDescription}"
3. A reference image URL from a known attraction: "${attractionName}"

Your task: Determine if both images show the SAME place/attraction.

COMPARISON CRITERIA:
- Architectural features (building shape, style, materials)
- Distinctive elements (domes, towers, spires, columns, arches)
- Colors and textures
- Surrounding environment
- Signage or text visible
- Overall composition and layout

IMPORTANT:
- Photos may be taken from different angles or at different times
- Lighting conditions may vary (day/night, sunny/cloudy)
- One photo may show more or less of the attraction
- Focus on IDENTIFYING FEATURES that are consistent across photos

RESPONSE FORMAT (JSON only, no markdown):
{
  "matches": true/false,
  "similarity": 0.0 to 1.0,
  "explanation": "Brief explanation of why they match or don't match"
}

SIMILARITY GUIDELINES:
- 0.8-1.0: Clearly the same place, recognizable features match
- 0.6-0.79: Likely the same place, several features match
- 0.4-0.59: Possibly the same place, some features match
- 0.0-0.39: Different places or cannot determine`;

  try {
    const userImageUrl = formatImageForOpenAI(userPhotoBase64);

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: userImageUrl,
                detail: 'high',
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: attractionImageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    const result: ImageComparisonResult = {
      matches: Boolean(parsed.matches),
      similarity: Math.max(0, Math.min(1, Number(parsed.similarity) || 0)),
      explanation: String(parsed.explanation || ''),
    };

    console.log('[OpenAI Vision] Image comparison result:', {
      attractionName,
      matches: result.matches,
      similarity: result.similarity,
    });

    return result;
  } catch (error: any) {
    console.error('OpenAI Vision comparison error:', error);
    return {
      matches: false,
      similarity: 0,
      explanation: 'Failed to compare images',
    };
  }
}
