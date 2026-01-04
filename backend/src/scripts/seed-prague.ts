import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required');
  process.exit(1);
}

// Map Google place types to our categories
function mapGoogleTypeToCategory(types: string[]): AttractionCategory {
  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum',
    'art_gallery': 'museum',
    'park': 'park',
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
    'shopping_mall': 'shopping',
    'restaurant': 'restaurant',
    'night_club': 'entertainment',
    'stadium': 'entertainment',
    'casino': 'entertainment',
    'historical_landmark': 'historical',
    'monument': 'historical',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  return 'landmark';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search for tourist attractions
async function searchAttractions(query: string, lat: number, lng: number): Promise<any[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber,places.regularOpeningHours',
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 25000,
        },
      },
      maxResultCount: 20,
      languageCode: 'en',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ⚠️  Error searching:`, error);
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  console.log('🏰 Seeding Prague attractions from Google Places API...\n');

  const pragueData = { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 };

  // Find Czech Republic
  let country = await prisma.country.findFirst({
    where: { name: 'Czech Republic' },
  });

  if (!country) {
    // Try Czechia
    country = await prisma.country.findFirst({
      where: { name: 'Czechia' },
    });
  }

  if (!country) {
    // Create Czech Republic under Europe
    const europe = await prisma.continent.findFirst({ where: { name: 'Europe' } });
    if (!europe) {
      console.error('❌ Europe continent not found');
      process.exit(1);
    }
    country = await prisma.country.create({
      data: {
        name: 'Czech Republic',
        code: 'CZ',
        continentId: europe.id,
        latitude: 49.8175,
        longitude: 15.4730,
      },
    });
    console.log('📍 Created country: Czech Republic');
  }

  // Find or create Prague
  let city = await prisma.city.findFirst({
    where: {
      name: 'Prague',
      countryId: country.id,
    },
  });

  if (!city) {
    city = await prisma.city.create({
      data: {
        name: 'Prague',
        countryId: country.id,
        latitude: pragueData.lat,
        longitude: pragueData.lng,
      },
    });
    console.log('📍 Created city: Prague');
  } else {
    console.log('📍 Found existing city: Prague');
  }

  // Different search queries to get diverse attractions
  const searchQueries = [
    'famous tourist attractions in Prague',
    'historic landmarks in Prague',
    'museums in Prague',
    'castles and palaces in Prague',
    'churches in Prague',
    'parks and gardens in Prague',
  ];

  let totalAttractions = 0;
  const addedNames = new Set<string>();

  for (const query of searchQueries) {
    console.log(`\n🔍 Searching: "${query}"`);
    const places = await searchAttractions(query, pragueData.lat, pragueData.lng);

    if (places.length === 0) {
      console.log(`   No results`);
      continue;
    }

    for (const place of places) {
      const name = place.displayName?.text || '';
      
      // Skip duplicates
      if (addedNames.has(name.toLowerCase())) {
        continue;
      }

      // Check if attraction already exists
      const existingAttraction = await prisma.attraction.findFirst({
        where: {
          name: name,
          cityId: city.id,
        },
      });

      if (existingAttraction) {
        console.log(`   ⏭️  Exists: ${name}`);
        addedNames.add(name.toLowerCase());
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
      try {
        await prisma.attraction.create({
          data: {
            name: name,
            description: place.editorialSummary?.text || `A popular attraction in Prague, Czech Republic. ${name} is one of the must-visit destinations for travelers exploring this beautiful city.`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in Prague`,
            category: mapGoogleTypeToCategory(place.types || []),
            cityId: city.id,
            latitude: place.location?.latitude || pragueData.lat,
            longitude: place.location?.longitude || pragueData.lng,
            address: place.formattedAddress || 'Prague, Czech Republic',
            images: images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300?text=Prague',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: place.rating || 0,
            totalReviews: place.userRatingCount || 0,
            isFree: false,
          },
        });

        addedNames.add(name.toLowerCase());
        totalAttractions++;
        console.log(`   ✅ ${name}`);
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    await delay(300);
  }

  // Count Prague attractions
  const pragueAttractions = await prisma.attraction.count({
    where: { cityId: city.id },
  });

  console.log('\n═══════════════════════════════════════');
  console.log('📊 PRAGUE SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`   New attractions added: ${totalAttractions}`);
  console.log(`   Total Prague attractions: ${pragueAttractions}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
