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
  "description": "Brief description of what you see and why you identified it"
}

CONFIDENCE GUIDELINES:
- 0.85-1.0: You clearly recognize this specific landmark
- 0.6-0.84: Fairly confident about the identification
- 0.3-0.59: Uncertain, making a guess
- 0.0-0.29: Cannot identify

Be SPECIFIC with names - include location qualifiers if needed (e.g., "Mosque of Namazgah" not just "mosque").`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
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
    };

    console.log('[OpenAI Vision] Identification result:', {
      identified: result.identified,
      name: result.name,
      city: result.city,
      country: result.country,
      confidence: result.confidence,
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
    };
  }
}
