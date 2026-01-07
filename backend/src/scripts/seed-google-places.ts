import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY environment variable is required');
  console.error('   Run: GOOGLE_PLACES_API_KEY=your_key npm run db:seed-google');
  process.exit(1);
}

// Types to exclude (bars, restaurants, etc.)
const EXCLUDED_TYPES = new Set([
  'bar',
  'restaurant',
  'night_club',
  'liquor_store',
  'cafe',
  'bakery',
  'meal_delivery',
  'meal_takeaway',
  'food',
]);

// Map Google place types to our categories
function mapGoogleTypeToCategory(types: string[]): AttractionCategory | null {
  // First check if it's an excluded type
  for (const type of types) {
    if (EXCLUDED_TYPES.has(type)) {
      return null; // Signal to skip this place
    }
  }

  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum',
    'art_gallery': 'museum',
    'park': 'park',
    'national_park': 'nature',
    'amusement_park': 'entertainment',
    'tourist_attraction': 'landmark',
    'point_of_interest': 'landmark',
    'church': 'religious',
    'hindu_temple': 'religious',
    'mosque': 'religious',
    'synagogue': 'religious',
    'place_of_worship': 'religious',
    'natural_feature': 'nature',
    'beach': 'beach',
    'zoo': 'nature',
    'aquarium': 'nature',
    'campground': 'nature',
    'rv_park': 'nature',
    'shopping_mall': 'shopping',
    'stadium': 'entertainment',
    'movie_theater': 'entertainment',
    'bowling_alley': 'entertainment',
    'casino': 'entertainment',
    'historical_landmark': 'historical',
    'monument': 'historical',
    'city_hall': 'historical',
    'embassy': 'historical',
    'library': 'museum',
    'university': 'historical',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  return 'landmark'; // Default category
}

// Delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search queries to use for each city
const SEARCH_QUERIES = [
  'famous landmarks and monuments in',
  'museums and galleries in',
  'parks and gardens in',
  'historical sites in',
  'temples churches mosques in',
];

// Additional query for coastal cities
const BEACH_QUERY = 'beaches near';

// Search for attractions using Google Places Text Search API
async function searchAttractions(query: string, lat: number, lng: number, maxResults: number = 20): Promise<any[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber',
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 30000, // 30km radius
          },
        },
        maxResultCount: maxResults,
        languageCode: 'en',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`    API Error: ${error.substring(0, 100)}`);
      return [];
    }

    const data = await response.json();
    return data.places || [];
  } catch (error: any) {
    console.error(`    Fetch error: ${error.message}`);
    return [];
  }
}

// Get photo URL from photo reference
function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

// Check if a city is coastal (simple heuristic based on name or country)
function isCoastalCity(cityName: string, countryName: string): boolean {
  const coastalKeywords = ['beach', 'bay', 'port', 'coast', 'sea', 'ocean', 'island'];
  const coastalCountries = ['Fiji', 'Maldives', 'Bahamas', 'Jamaica', 'Cuba'];
  const coastalCities = [
    'Miami', 'Los Angeles', 'San Francisco', 'Sydney', 'Melbourne', 'Auckland',
    'Barcelona', 'Lisbon', 'Venice', 'Naples', 'Nice', 'Cannes', 'Monaco',
    'Dubai', 'Mumbai', 'Hong Kong', 'Singapore', 'Bangkok', 'Bali',
    'Rio de Janeiro', 'Cartagena', 'Cancun', 'Havana',
    'Cape Town', 'Casablanca', 'Alexandria',
    'Sarandë', 'Vlorë', 'Durrës', 'Ksamil', 'Himarë',
  ];

  return (
    coastalCities.some(c => cityName.includes(c)) ||
    coastalCountries.includes(countryName) ||
    coastalKeywords.some(k => cityName.toLowerCase().includes(k))
  );
}

interface SeedStats {
  citiesProcessed: number;
  citiesSkipped: number;
  attractionsAdded: number;
  attractionsSkipped: number;
  apiCalls: number;
}

async function seedCityAttractions(
  city: { id: string; name: string; latitude: number | null; longitude: number | null },
  countryName: string,
  stats: SeedStats
): Promise<void> {
  const lat = city.latitude || 0;
  const lng = city.longitude || 0;

  if (!lat || !lng) {
    console.log(`  Skipping ${city.name} - no coordinates`);
    stats.citiesSkipped++;
    return;
  }

  console.log(`\n Processing: ${city.name}, ${countryName}`);

  const seenPlaceIds = new Set<string>();
  let cityAttractionCount = 0;

  // Build list of queries for this city
  const queries = [...SEARCH_QUERIES];
  if (isCoastalCity(city.name, countryName)) {
    queries.push(BEACH_QUERY);
  }

  for (const queryPrefix of queries) {
    const query = `${queryPrefix} ${city.name}`;
    console.log(`   Searching: "${query}"`);

    const places = await searchAttractions(query, lat, lng, 15);
    stats.apiCalls++;

    for (const place of places) {
      try {
        // Skip if already processed
        if (seenPlaceIds.has(place.id)) continue;
        seenPlaceIds.add(place.id);

        const placeName = place.displayName?.text || '';
        if (!placeName) continue;

        // Check category and skip excluded types
        const category = mapGoogleTypeToCategory(place.types || []);
        if (category === null) {
          stats.attractionsSkipped++;
          continue;
        }

        // Filter by minimum rating and reviews
        const rating = place.rating || 0;
        const reviews = place.userRatingCount || 0;
        if (rating < 3.5 || reviews < 20) {
          stats.attractionsSkipped++;
          continue;
        }

        // Check if attraction already exists
        const existingAttraction = await prisma.attraction.findFirst({
          where: {
            name: placeName,
            cityId: city.id,
          },
        });

        if (existingAttraction) {
          continue;
        }

        // Get photo URLs
        const images: string[] = [];
        let thumbnailUrl = '';
        if (place.photos && place.photos.length > 0) {
          thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
          for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
            images.push(getPhotoUrl(place.photos[i].name, 800));
          }
        }

        // Create attraction
        await prisma.attraction.create({
          data: {
            name: placeName,
            description: place.editorialSummary?.text || `A popular attraction in ${city.name}, ${countryName}`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${placeName} in ${city.name}`,
            category: category,
            cityId: city.id,
            latitude: place.location?.latitude || lat,
            longitude: place.location?.longitude || lng,
            address: place.formattedAddress || `${city.name}, ${countryName}`,
            images: images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300?text=No+Image',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: rating,
            totalReviews: reviews,
            isFree: false,
          },
        });

        cityAttractionCount++;
        stats.attractionsAdded++;
        console.log(`     + ${placeName} (${category}, ${rating} stars)`);
      } catch (error: any) {
        console.error(`     Error: ${error.message}`);
      }
    }

    // Rate limiting between queries
    await delay(250);
  }

  console.log(`   Total added for ${city.name}: ${cityAttractionCount}`);
  stats.citiesProcessed++;
}

async function main() {
  console.log('='.repeat(60));
  console.log(' GOOGLE PLACES ATTRACTION SEEDER');
  console.log(' Fetching attractions for all cities in database');
  console.log('='.repeat(60));

  const stats: SeedStats = {
    citiesProcessed: 0,
    citiesSkipped: 0,
    attractionsAdded: 0,
    attractionsSkipped: 0,
    apiCalls: 0,
  };

  // Get all cities from database with their country info
  const cities = await prisma.city.findMany({
    include: {
      country: {
        select: { name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`\nFound ${cities.length} cities in database\n`);

  // Optional: Process only cities that have few attractions
  const citiesWithCounts = await Promise.all(
    cities.map(async (city) => {
      const count = await prisma.attraction.count({ where: { cityId: city.id } });
      return { ...city, attractionCount: count };
    })
  );

  // Sort by attraction count (process cities with fewer attractions first)
  citiesWithCounts.sort((a, b) => a.attractionCount - b.attractionCount);

  for (const city of citiesWithCounts) {
    // Skip cities that already have many attractions
    if (city.attractionCount >= 50) {
      console.log(`Skipping ${city.name} - already has ${city.attractionCount} attractions`);
      stats.citiesSkipped++;
      continue;
    }

    await seedCityAttractions(
      { id: city.id, name: city.name, latitude: city.latitude, longitude: city.longitude },
      city.country.name,
      stats
    );

    // Rate limiting between cities
    await delay(500);
  }

  // Final stats
  const dbStats = {
    continents: await prisma.continent.count(),
    countries: await prisma.country.count(),
    cities: await prisma.city.count(),
    attractions: await prisma.attraction.count(),
  };

  console.log('\n' + '='.repeat(60));
  console.log(' SEED COMPLETE - SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Cities processed:     ${stats.citiesProcessed}`);
  console.log(`   Cities skipped:       ${stats.citiesSkipped}`);
  console.log(`   Attractions added:    ${stats.attractionsAdded}`);
  console.log(`   Attractions skipped:  ${stats.attractionsSkipped}`);
  console.log(`   API calls made:       ${stats.apiCalls}`);
  console.log('-'.repeat(60));
  console.log(`   Total Continents:     ${dbStats.continents}`);
  console.log(`   Total Countries:      ${dbStats.countries}`);
  console.log(`   Total Cities:         ${dbStats.cities}`);
  console.log(`   Total Attractions:    ${dbStats.attractions}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
