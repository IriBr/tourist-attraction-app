import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { BadRequestError } from '../utils/errors.js';

// Types
export interface AttractionContext {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  description: string;
  shortDescription: string;
  famousFor?: string | null;
  highlights: string[];
}

export interface VerificationResult {
  matched: boolean;
  confidence: number;
  attractionId: string | null;
  explanation: string;
}

interface ClaudeVerificationResponse {
  matched: boolean;
  attractionId: string | null;
  confidence: number;
  explanation: string;
}

// Initialize Anthropic client
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!config.anthropic.apiKey) {
    throw new BadRequestError('Anthropic API key not configured');
  }
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return anthropic;
}

/**
 * Build the prompt with attraction context for Claude Vision
 */
function buildVerificationPrompt(attractions: AttractionContext[]): string {
  const attractionList = attractions.map(a => `---
ID: ${a.id}
Name: ${a.name}
Location: ${a.city}, ${a.country}
Category: ${a.category}
Description: ${a.shortDescription}
${a.famousFor ? `Famous For: ${a.famousFor}` : ''}
${a.highlights.length > 0 ? `Key Features: ${a.highlights.join(', ')}` : ''}
---`).join('\n\n');

  return `You are an expert at identifying tourist attractions from photographs.
Your task is to analyze the provided image and determine if it matches any of the known attractions listed below.

INSTRUCTIONS:
1. Analyze the image for distinctive architectural features, landmarks, signage, natural formations, or other identifying characteristics.
2. Compare what you see against the provided attraction list.
3. Return a structured JSON response.

RESPONSE FORMAT (JSON only, no markdown code blocks):
{
  "matched": boolean,
  "attractionId": "uuid string or null if no match",
  "confidence": 0.0 to 1.0,
  "explanation": "Brief explanation of your reasoning"
}

CONFIDENCE GUIDELINES:
- 0.85-1.0: Clear match with multiple distinctive features visible (iconic landmark clearly recognizable)
- 0.6-0.84: Good match with at least one distinctive feature (likely the attraction but some uncertainty)
- 0.3-0.59: Possible match but uncertain (could be this attraction or similar)
- 0.0-0.29: No match or unrelated image

IMPORTANT:
- Only match if you are reasonably confident the image shows the specific attraction
- Consider architectural style, signage, surrounding environment, and distinctive features
- If the image is blurry, too dark, or doesn't show a recognizable place, set matched to false
- Be conservative - it's better to ask for confirmation than to incorrectly match

KNOWN ATTRACTIONS:

${attractionList}`;
}

/**
 * Parse Claude's response to extract verification result
 */
function parseClaudeResponse(responseText: string): VerificationResult {
  try {
    // Try to extract JSON from response
    let jsonStr = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr) as ClaudeVerificationResponse;

    return {
      matched: Boolean(parsed.matched),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      attractionId: parsed.attractionId || null,
      explanation: String(parsed.explanation || 'No explanation provided'),
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', responseText);
    return {
      matched: false,
      confidence: 0,
      attractionId: null,
      explanation: 'Failed to parse AI response',
    };
  }
}

/**
 * Verify an image against a list of attractions using Claude Vision
 */
export async function verifyAttractionImage(
  imageBase64: string,
  attractions: AttractionContext[]
): Promise<VerificationResult> {
  if (!imageBase64) {
    throw new BadRequestError('Image data is required');
  }

  if (attractions.length === 0) {
    return {
      matched: false,
      confidence: 0,
      attractionId: null,
      explanation: 'No attractions available to match against',
    };
  }

  const client = getAnthropicClient();
  const prompt = buildVerificationPrompt(attractions);

  // Determine media type from base64 header or default to jpeg
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  let cleanBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mediaType = match[1] as typeof mediaType;
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: cleanBase64,
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

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return parseClaudeResponse(textContent.text);
  } catch (error: any) {
    console.error('Claude Vision API error:', error);

    if (error.status === 429) {
      throw new BadRequestError('AI service rate limit exceeded. Please try again later.');
    }

    throw new BadRequestError(
      error.message || 'Failed to process image with AI service'
    );
  }
}

/**
 * Get a description of an image for global search (two-pass approach)
 */
export async function getImageDescription(imageBase64: string): Promise<string> {
  const client = getAnthropicClient();

  // Clean base64 data
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  let cleanBase64 = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mediaType = match[1] as typeof mediaType;
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
  }

  const prompt = `Describe this image in detail, focusing on:
1. Type of place (museum, landmark, monument, park, religious site, etc.)
2. Architectural style or natural features
3. Any visible text, signage, or labels
4. Location hints (language on signs, architectural style suggesting region/country)
5. Distinctive features that could identify this specific place

Keep your response under 150 words and focus on facts that would help identify the location.
If this doesn't appear to be a tourist attraction or notable place, say so.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: cleanBase64,
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

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.type === 'text' ? textContent.text : '';
  } catch (error: any) {
    console.error('Claude Vision description error:', error);
    return '';
  }
}

/**
 * Extract keywords from image description for database search
 */
export function extractKeywords(description: string): string[] {
  const lowerDesc = description.toLowerCase();

  // Categories to detect
  const categories = ['museum', 'park', 'landmark', 'beach', 'temple', 'church',
    'cathedral', 'palace', 'castle', 'tower', 'bridge', 'monument', 'statue',
    'garden', 'market', 'square', 'plaza', 'mosque', 'shrine', 'gallery'];

  // Extract mentioned categories
  const foundCategories = categories.filter(cat => lowerDesc.includes(cat));

  // Common location indicators (cities, countries)
  const locationPatterns = /\b(paris|london|rome|tokyo|new york|barcelona|dubai|cairo|sydney|beijing|venice|florence|madrid|amsterdam|berlin|vienna|prague|budapest|istanbul|bangkok|singapore|hong kong|seoul|mumbai|delhi|agra|marrakech|cape town|rio|machu picchu|petra|jerusalem|athens|santorini)\b/gi;
  const locations = description.match(locationPatterns) || [];

  // Extract proper nouns (likely place names)
  const properNouns = description.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
  const filteredNouns = properNouns.filter(noun =>
    noun.length > 3 &&
    !['The', 'This', 'That', 'These', 'There'].includes(noun)
  );

  // Combine and deduplicate
  const allKeywords = [...foundCategories, ...locations, ...filteredNouns];
  return [...new Set(allKeywords.map(k => k.toLowerCase()))];
}
