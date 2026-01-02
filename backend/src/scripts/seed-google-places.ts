import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required');
  console.error('   Run: GOOGLE_PLACES_API_KEY=your_key npm run db:seed-google');
  process.exit(1);
}

// Major cities to seed with attractions (capitals + top tourist destinations)
const citiesToSeed: Array<{ name: string; country: string; lat: number; lng: number }> = [
  // Europe
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lng: -3.1883 },
  { name: 'Venice', country: 'Italy', lat: 45.4408, lng: 12.3155 },
  { name: 'Florence', country: 'Italy', lat: 43.7696, lng: 11.2558 },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },

  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
  { name: 'Bali', country: 'Indonesia', lat: -8.3405, lng: 115.0920 },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0278, lng: 105.8342 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lng: 121.5654 },
  { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137 },
  { name: 'Petra', country: 'Jordan', lat: 30.3285, lng: 35.4444 },

  // North America
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
  { name: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398 },
  { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'Washington', country: 'United States', lat: 38.9072, lng: -77.0369 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { name: 'Cancun', country: 'Mexico', lat: 21.1619, lng: -86.8515 },
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lng: -82.3666 },

  // South America
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Cusco', country: 'Peru', lat: -13.5319, lng: -71.9675 },
  { name: 'Bogota', country: 'Colombia', lat: 4.7110, lng: -74.0721 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Cartagena', country: 'Colombia', lat: 10.3910, lng: -75.4794 },

  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { name: 'Luxor', country: 'Egypt', lat: 25.6872, lng: 32.6396 },

  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8509, lng: 174.7645 },
  { name: 'Queenstown', country: 'New Zealand', lat: -45.0312, lng: 168.6626 },
  { name: 'Fiji', country: 'Fiji', lat: -17.7134, lng: 178.0650 },
];

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

// Delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search for tourist attractions in a location using Text Search (New)
async function searchAttractions(cityName: string, lat: number, lng: number): Promise<any[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber,places.regularOpeningHours',
    },
    body: JSON.stringify({
      textQuery: `famous tourist attractions in ${cityName}`,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 20000, // 20km radius
        },
      },
      maxResultCount: 10,
      languageCode: 'en',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ⚠️  Error searching ${cityName}:`, error);
    return [];
  }

  const data = await response.json();
  return data.places || [];
}

// Get photo URL from photo reference
function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  console.log('🌍 Seeding attractions from Google Places API...\n');

  let totalCities = 0;
  let totalAttractions = 0;
  let skippedCities = 0;

  for (const cityData of citiesToSeed) {
    // Find country in database
    const country = await prisma.country.findFirst({
      where: { name: cityData.country },
      include: { continent: true },
    });

    if (!country) {
      console.log(`  ⚠️  Country not found: ${cityData.country}, skipping ${cityData.name}`);
      skippedCities++;
      continue;
    }

    // Create or find city
    let city = await prisma.city.findFirst({
      where: {
        name: cityData.name,
        countryId: country.id,
      },
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          name: cityData.name,
          countryId: country.id,
          latitude: cityData.lat,
          longitude: cityData.lng,
        },
      });
      console.log(`📍 Created city: ${cityData.name}, ${cityData.country}`);
    } else {
      console.log(`📍 Found existing city: ${cityData.name}, ${cityData.country}`);
    }
    totalCities++;

    // Search for attractions
    console.log(`   Searching for attractions...`);
    const places = await searchAttractions(cityData.name, cityData.lat, cityData.lng);

    if (places.length === 0) {
      console.log(`   No attractions found for ${cityData.name}`);
      await delay(200);
      continue;
    }

    let cityAttractionCount = 0;
    for (const place of places) {
      try {
        // Check if attraction already exists
        const existingAttraction = await prisma.attraction.findFirst({
          where: {
            name: place.displayName?.text || '',
            cityId: city.id,
          },
        });

        if (existingAttraction) {
          console.log(`   ⏭️  Skipping existing: ${place.displayName?.text}`);
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
            name: place.displayName?.text || 'Unknown',
            description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${place.displayName?.text} in ${cityData.name}`,
            category: mapGoogleTypeToCategory(place.types || []),
            cityId: city.id,
            latitude: place.location?.latitude || cityData.lat,
            longitude: place.location?.longitude || cityData.lng,
            address: place.formattedAddress || cityData.name,
            images: images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300?text=No+Image',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: place.rating || 0,
            totalReviews: place.userRatingCount || 0,
            isFree: false,
          },
        });

        cityAttractionCount++;
        totalAttractions++;
        console.log(`   ✅ ${place.displayName?.text}`);
      } catch (error: any) {
        console.log(`   ❌ Error creating attraction: ${error.message}`);
      }
    }

    console.log(`   Added ${cityAttractionCount} attractions to ${cityData.name}\n`);

    // Rate limiting - be nice to the API
    await delay(300);
  }

  // Final stats
  const dbStats = {
    continents: await prisma.continent.count(),
    countries: await prisma.country.count(),
    cities: await prisma.city.count(),
    attractions: await prisma.attraction.count(),
  };

  console.log('\n═══════════════════════════════════════');
  console.log('📊 SEED COMPLETE - SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`   Cities processed: ${totalCities}`);
  console.log(`   Cities skipped:   ${skippedCities}`);
  console.log(`   Attractions added: ${totalAttractions}`);
  console.log('───────────────────────────────────────');
  console.log(`   Total Continents:  ${dbStats.continents}`);
  console.log(`   Total Countries:   ${dbStats.countries}`);
  console.log(`   Total Cities:      ${dbStats.cities}`);
  console.log(`   Total Attractions: ${dbStats.attractions}`);
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
