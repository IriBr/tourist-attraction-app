import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY required');
  process.exit(1);
}

// Types to exclude
const EXCLUDED_TYPES = new Set([
  'bar', 'restaurant', 'night_club', 'liquor_store', 'cafe',
  'bakery', 'meal_delivery', 'meal_takeaway', 'food',
  'lodging', 'hotel', 'motel', 'hostel', 'guest_house',
  'travel_agency', 'tourist_information',
]);

function mapGoogleTypeToCategory(types: string[]): AttractionCategory | null {
  for (const type of types) {
    if (EXCLUDED_TYPES.has(type)) return null;
  }
  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum', 'art_gallery': 'museum', 'park': 'park',
    'national_park': 'nature', 'amusement_park': 'entertainment',
    'tourist_attraction': 'landmark', 'point_of_interest': 'landmark',
    'church': 'religious', 'hindu_temple': 'religious', 'mosque': 'religious',
    'synagogue': 'religious', 'place_of_worship': 'religious',
    'natural_feature': 'nature', 'beach': 'beach', 'zoo': 'nature',
    'aquarium': 'nature', 'shopping_mall': 'shopping',
    'stadium': 'entertainment', 'historical_landmark': 'historical',
    'monument': 'historical', 'castle': 'historical',
  };
  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return 'landmark';
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function searchAttractions(query: string, lat: number, lng: number, maxResults: number = 20): Promise<any[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber',
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 25000 } },
      maxResultCount: maxResults,
      languageCode: 'en',
    }),
  });
  if (!response.ok) {
    console.error(`API Error: ${await response.text()}`);
    return [];
  }
  const data = await response.json();
  return data.places || [];
}

function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

interface CityData {
  name: string;
  lat: number;
  lng: number;
  isCoastal: boolean;
  imageUrl?: string;
}

const ALBANIAN_CITIES: CityData[] = [
  { name: 'Tirana', lat: 41.3275, lng: 19.8187, isCoastal: false, imageUrl: 'https://images.unsplash.com/photo-1586699253884-e199770f63b9?w=800' },
  { name: 'Durrës', lat: 41.3246, lng: 19.4565, isCoastal: true, imageUrl: 'https://images.unsplash.com/photo-1600002415506-dd06090d3480?w=800' },
  { name: 'Gjirokastër', lat: 40.0758, lng: 20.1389, isCoastal: false, imageUrl: 'https://images.unsplash.com/photo-1596395463985-f3f75f6b93d7?w=800' },
  { name: 'Shkodër', lat: 42.0683, lng: 19.5126, isCoastal: false, imageUrl: 'https://images.unsplash.com/photo-1585000673961-3a0f47d1e6e0?w=800' },
  { name: 'Vlorë', lat: 40.4667, lng: 19.4897, isCoastal: true, imageUrl: 'https://images.unsplash.com/photo-1596178060671-7a80dc42ea90?w=800' },
  { name: 'Sarandë', lat: 39.8664, lng: 20.0050, isCoastal: true, imageUrl: 'https://images.unsplash.com/photo-1596179526829-e4b011d59c04?w=800' },
  { name: 'Korçë', lat: 40.6186, lng: 20.7808, isCoastal: false, imageUrl: 'https://images.unsplash.com/photo-1596178060671-7a80dc42ea90?w=800' },
  { name: 'Pogradec', lat: 40.9025, lng: 20.6528, isCoastal: false, imageUrl: null },
  { name: 'Elbasan', lat: 41.1125, lng: 20.0822, isCoastal: false, imageUrl: null },
  { name: 'Fier', lat: 40.7239, lng: 19.5567, isCoastal: false, imageUrl: null },
  { name: 'Lushnjë', lat: 40.9419, lng: 19.7050, isCoastal: false, imageUrl: null },
  { name: 'Himarë', lat: 40.1028, lng: 19.7514, isCoastal: true, imageUrl: null },
  { name: 'Ksamil', lat: 39.7700, lng: 20.0008, isCoastal: true, imageUrl: null },
  { name: 'Krujë', lat: 41.5089, lng: 19.7928, isCoastal: false, imageUrl: null },
  { name: 'Apollonia', lat: 40.7167, lng: 19.4833, isCoastal: false, imageUrl: null },
];

async function seedCity(cityData: CityData, countryId: string) {
  console.log(`\n Processing ${cityData.name}...`);

  // Find or create city
  let city = await prisma.city.findFirst({
    where: { name: cityData.name, countryId }
  });

  if (!city) {
    city = await prisma.city.create({
      data: {
        name: cityData.name,
        countryId,
        latitude: cityData.lat,
        longitude: cityData.lng,
        imageUrl: cityData.imageUrl,
      }
    });
    console.log(`  Created city: ${cityData.name}`);
  } else {
    console.log(`  City exists: ${cityData.name}`);
  }

  // Build search queries
  const searchQueries = [
    `famous tourist attractions in ${cityData.name} Albania`,
    `historic landmarks monuments in ${cityData.name} Albania`,
    `museums galleries in ${cityData.name} Albania`,
    `historical sites castles in ${cityData.name} Albania`,
    `parks nature in ${cityData.name} Albania`,
  ];

  // Add beach query for coastal cities
  if (cityData.isCoastal) {
    searchQueries.push(`beaches in ${cityData.name} Albania`);
  }

  let addedCount = 0;
  const addedNames = new Set<string>();

  for (const query of searchQueries) {
    console.log(`   Searching: ${query}`);
    const places = await searchAttractions(query, cityData.lat, cityData.lng, 15);

    for (const place of places) {
      const name = place.displayName?.text || '';
      if (!name || addedNames.has(name.toLowerCase())) continue;

      // Skip excluded types
      const category = mapGoogleTypeToCategory(place.types || []);
      if (category === null) continue;

      // For non-coastal cities, skip beaches
      if (!cityData.isCoastal && category === 'beach') {
        console.log(`     Skipping beach in non-coastal city: ${name}`);
        continue;
      }

      // Filter by minimum rating
      const rating = place.rating || 0;
      const reviews = place.userRatingCount || 0;
      if (rating < 3.5 || reviews < 10) continue;

      // Check if exists
      const existing = await prisma.attraction.findFirst({
        where: { name, cityId: city.id }
      });
      if (existing) {
        addedNames.add(name.toLowerCase());
        continue;
      }

      const images: string[] = [];
      let thumbnailUrl = '';
      if (place.photos?.length > 0) {
        thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
        for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
          images.push(getPhotoUrl(place.photos[i].name, 800));
        }
      }

      try {
        await prisma.attraction.create({
          data: {
            name,
            description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}, Albania.`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in ${cityData.name}`,
            category,
            cityId: city.id,
            latitude: place.location?.latitude || cityData.lat,
            longitude: place.location?.longitude || cityData.lng,
            address: place.formattedAddress || `${cityData.name}, Albania`,
            images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: rating,
            totalReviews: reviews,
            isFree: false,
          },
        });
        addedNames.add(name.toLowerCase());
        addedCount++;
        console.log(`     + ${name} (${category})`);
      } catch (e: any) {
        console.log(`     Error: ${name}: ${e.message}`);
      }
    }
    await delay(300);
  }

  console.log(`   Added ${addedCount} attractions to ${cityData.name}`);
  return addedCount;
}

async function main() {
  console.log('='.repeat(60));
  console.log(' SEEDING ALBANIAN CITIES AND ATTRACTIONS');
  console.log('='.repeat(60));

  // Find Albania
  const albania = await prisma.country.findFirst({ where: { name: 'Albania' } });
  if (!albania) {
    console.error('Albania not found in database!');
    process.exit(1);
  }
  console.log(`Found Albania: ${albania.id}`);

  let totalAdded = 0;
  for (const cityData of ALBANIAN_CITIES) {
    totalAdded += await seedCity(cityData, albania.id);
    await delay(500);
  }

  // Get final counts
  const albanianCities = await prisma.city.findMany({
    where: { countryId: albania.id },
    include: { _count: { select: { attractions: true } } }
  });

  console.log('\n' + '='.repeat(60));
  console.log(' SEED COMPLETE - ALBANIA');
  console.log('='.repeat(60));
  console.log(`   Total attractions added: ${totalAdded}`);
  console.log('');
  console.log('   Albanian Cities:');
  for (const city of albanianCities) {
    console.log(`     ${city.name}: ${city._count.attractions} attractions`);
  }
  console.log('='.repeat(60));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
