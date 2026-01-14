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

  return `You are an expert at identifying tourist attractions from photographs, with extensive knowledge of landmarks, monuments, religious sites, and points of interest worldwide.

Your task is to analyze the provided image and determine if it matches any of the known attractions listed below.

CRITICAL - USE YOUR OWN KNOWLEDGE:
The descriptions provided below may be incomplete or generic. You MUST use your own training knowledge to identify attractions:
- If you recognize a landmark by its NAME and LOCATION, match it even if the description is unhelpful
- Use your knowledge of what attractions look like - their architecture, style, distinctive features
- A mosque, church, monument, or landmark you recognize from your training should be matched with HIGH confidence
- Do NOT rely solely on the provided descriptions - they are supplementary information only
- Example: If you see "Mosque of Namazgah, Tirana, Albania" and you recognize the mosque in the photo from your knowledge, MATCH IT with high confidence

INSTRUCTIONS:
1. First, identify what you see in the image using YOUR OWN KNOWLEDGE
2. Then, check if any attraction in the list matches what you identified
3. Match based on: Name + Location + Your knowledge of what it looks like
4. Return a structured JSON response

HANDLING SPECIAL CONDITIONS:

NIGHTTIME/LOW LIGHT PHOTOS:
- Look for illuminated features (lighting patterns, lit windows, spotlights on monuments)
- Nighttime photos of famous landmarks often show distinctive lighting designs
- Consider reflections on water which may reveal landmark silhouettes
- Neon signs and city lights can help identify locations
- Even silhouettes against night sky can match iconic shapes (towers, domes, spires)

DIFFERENT ANGLES/PERSPECTIVES:
- Close-up shots: Focus on architectural details, materials, decorative elements
- Aerial/drone views: Match layouts, rooflines, surrounding patterns
- Unusual angles: Identify distinctive shapes visible from any direction
- Partial views: Even a portion of a famous landmark can be identifiable
- Ground-level looking up: Match tower heights, structural elements

WEATHER/ENVIRONMENTAL CONDITIONS:
- Foggy/misty: Landmark silhouettes may still be recognizable
- Rainy: Reflections and wet surfaces don't change the landmark identity
- Crowded: The attraction is still valid even with tourists in frame

RESPONSE FORMAT (JSON only, no markdown code blocks):
{
  "matched": boolean,
  "attractionId": "uuid string or null if no match",
  "confidence": 0.0 to 1.0,
  "explanation": "Brief explanation of your reasoning"
}

CONFIDENCE GUIDELINES:
- 0.85-1.0: Clear match - you recognize this landmark from your knowledge or the photo clearly shows it
- 0.6-0.84: Good match - recognizable but partial view, unusual angle, or nighttime
- 0.3-0.59: Possible match - some features match but uncertainty remains
- 0.0-0.29: No match or unrelated image

IMPORTANT:
- USE YOUR KNOWLEDGE - don't just match text descriptions
- If you know what "Mosque of Namazgah" or "Pyramid of Tirana" looks like, USE THAT KNOWLEDGE
- Generic descriptions like "Visit X in Y" should NOT prevent a match if you recognize the landmark
- Photos from unusual angles are VALID - tourists take creative shots
- Match based on what YOU KNOW about the attraction, not just what we tell you

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

    const result = parseClaudeResponse(textContent.text);

    // Log the result for debugging
    console.log('[Vision] Claude response:', {
      matched: result.matched,
      confidence: result.confidence,
      attractionId: result.attractionId,
      explanation: result.explanation,
      candidateCount: attractions.length,
    });

    return result;
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

  const prompt = `Describe this image in detail, focusing on identifying the tourist attraction:

1. Type of place (museum, landmark, monument, park, religious site, tower, bridge, etc.)
2. Architectural style or natural features
3. Any visible text, signage, or labels
4. Location hints (language on signs, architectural style suggesting region/country)
5. Distinctive features that could identify this specific place
6. Iconic shapes, silhouettes, or structural elements

SPECIAL CONDITIONS:
- If NIGHTTIME: Describe lighting patterns, illuminated features, silhouettes against the sky
- If UNUSUAL ANGLE: Describe what's visible from this perspective
- If PARTIAL VIEW: Focus on the identifiable portion visible

Keep your response under 150 words and focus on facts that would help identify the location.
Name the attraction if you recognize it.
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
 * Identify an attraction from an image using Claude's knowledge
 * This is Step 1 of the two-step identification approach
 */
export async function identifyAttraction(imageBase64: string): Promise<IdentificationResult> {
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

  const prompt = `You are an expert at identifying tourist attractions, landmarks, monuments, and points of interest worldwide.

Analyze this image and identify what tourist attraction or landmark is shown. Use your training knowledge to identify:
- Famous buildings, monuments, towers, bridges
- Churches, mosques, temples, religious sites
- Museums, palaces, castles, historical sites
- Natural landmarks, parks, famous locations
- Statues, memorials, public squares

RESPONSE FORMAT (JSON only, no markdown code blocks):
{
  "identified": boolean,
  "name": "Official name of the attraction or null",
  "alternativeNames": ["Other names this place is known by"],
  "city": "City where it's located or null",
  "country": "Country where it's located or null",
  "category": "museum|landmark|religious|park|beach|castle|palace|bridge|tower|monument|statue|square|garden|other",
  "confidence": 0.0 to 1.0,
  "description": "Brief description of what you see and why you identified it as this attraction"
}

IMPORTANT:
- Use your TRAINING KNOWLEDGE to identify the attraction
- If you recognize a famous landmark, identify it with HIGH confidence
- Look for architectural style, distinctive features, signage
- Consider the location hints (language on signs, architectural style)
- If you're not sure what it is, set identified to false
- Be specific with the name - include "of [City]" if that's part of the official name

CONFIDENCE GUIDELINES:
- 0.85-1.0: You clearly recognize this landmark from your training
- 0.6-0.84: You're fairly confident but might be uncertain about exact name
- 0.3-0.59: You have a guess but not sure
- 0.0-0.29: Cannot identify or not a tourist attraction`;

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

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse response
    let jsonStr = textContent.text.trim();
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

    console.log('[Vision] Identification result:', {
      identified: result.identified,
      name: result.name,
      city: result.city,
      country: result.country,
      confidence: result.confidence,
    });

    return result;
  } catch (error: any) {
    console.error('Claude Vision identification error:', error);
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
