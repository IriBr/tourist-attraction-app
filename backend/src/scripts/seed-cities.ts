import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY required');
  process.exit(1);
}

function mapGoogleTypeToCategory(types: string[]): AttractionCategory {
  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum', 'art_gallery': 'museum', 'park': 'park',
    'amusement_park': 'entertainment', 'tourist_attraction': 'landmark',
    'point_of_interest': 'landmark', 'church': 'religious',
    'hindu_temple': 'religious', 'mosque': 'religious', 'synagogue': 'religious',
    'place_of_worship': 'religious', 'natural_feature': 'nature',
    'beach': 'beach', 'zoo': 'nature', 'aquarium': 'nature',
    'shopping_mall': 'shopping', 'restaurant': 'restaurant',
    'night_club': 'entertainment', 'stadium': 'entertainment',
    'historical_landmark': 'historical', 'monument': 'historical',
  };
  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return 'landmark';
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function searchAttractions(query: string, lat: number, lng: number): Promise<any[]> {
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
      maxResultCount: 20,
      languageCode: 'en',
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.places || [];
}

function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

interface CityData {
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  lat: number;
  lng: number;
}

const CITIES: CityData[] = [
  { name: 'Paris', country: 'France', countryCode: 'FR', continent: 'Europe', lat: 48.8566, lng: 2.3522 },
  { name: 'Rome', country: 'Italy', countryCode: 'IT', continent: 'Europe', lat: 41.9028, lng: 12.4964 },
  { name: 'London', country: 'United Kingdom', countryCode: 'GB', continent: 'Europe', lat: 51.5074, lng: -0.1278 },
  { name: 'Barcelona', country: 'Spain', countryCode: 'ES', continent: 'Europe', lat: 41.3851, lng: 2.1734 },
  { name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', continent: 'Europe', lat: 52.3676, lng: 4.9041 },
  { name: 'Prague', country: 'Czech Republic', countryCode: 'CZ', continent: 'Europe', lat: 50.0755, lng: 14.4378 },
  { name: 'Vienna', country: 'Austria', countryCode: 'AT', continent: 'Europe', lat: 48.2082, lng: 16.3738 },
  { name: 'Berlin', country: 'Germany', countryCode: 'DE', continent: 'Europe', lat: 52.5200, lng: 13.4050 },
  { name: 'New York', country: 'United States', countryCode: 'US', continent: 'North America', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', country: 'Japan', countryCode: 'JP', continent: 'Asia', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', country: 'Australia', countryCode: 'AU', continent: 'Oceania', lat: -33.8688, lng: 151.2093 },
  { name: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR', continent: 'South America', lat: -22.9068, lng: -43.1729 },
  { name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', continent: 'Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Bangkok', country: 'Thailand', countryCode: 'TH', continent: 'Asia', lat: 13.7563, lng: 100.5018 },
  { name: 'Singapore', country: 'Singapore', countryCode: 'SG', continent: 'Asia', lat: 1.3521, lng: 103.8198 },
];

async function seedCity(cityData: CityData) {
  console.log(`\n🌍 Seeding ${cityData.name}, ${cityData.country}...`);

  // Find or create continent
  let continent = await prisma.continent.findFirst({ where: { name: cityData.continent } });
  if (!continent) {
    continent = await prisma.continent.create({
      data: { name: cityData.continent, code: cityData.continent.substring(0, 2).toUpperCase() }
    });
  }

  // Find or create country
  let country = await prisma.country.findFirst({ where: { name: cityData.country } });
  if (!country) {
    country = await prisma.country.create({
      data: {
        name: cityData.country,
        code: cityData.countryCode,
        continentId: continent.id,
        latitude: cityData.lat,
        longitude: cityData.lng,
      }
    });
    console.log(`  📍 Created country: ${cityData.country}`);
  }

  // Find or create city
  let city = await prisma.city.findFirst({
    where: { name: cityData.name, countryId: country.id }
  });
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: cityData.name,
        countryId: country.id,
        latitude: cityData.lat,
        longitude: cityData.lng,
      }
    });
    console.log(`  📍 Created city: ${cityData.name}`);
  }

  const searchQueries = [
    `famous tourist attractions in ${cityData.name}`,
    `historic landmarks in ${cityData.name}`,
    `museums in ${cityData.name}`,
    `must see places in ${cityData.name}`,
  ];

  let addedCount = 0;
  const addedNames = new Set<string>();

  for (const query of searchQueries) {
    const places = await searchAttractions(query, cityData.lat, cityData.lng);
    
    for (const place of places) {
      const name = place.displayName?.text || '';
      if (!name || addedNames.has(name.toLowerCase())) continue;

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
            description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}, ${cityData.country}.`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in ${cityData.name}`,
            category: mapGoogleTypeToCategory(place.types || []),
            cityId: city.id,
            latitude: place.location?.latitude || cityData.lat,
            longitude: place.location?.longitude || cityData.lng,
            address: place.formattedAddress || `${cityData.name}, ${cityData.country}`,
            images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: place.rating || 0,
            totalReviews: place.userRatingCount || 0,
            isFree: false,
          },
        });
        addedNames.add(name.toLowerCase());
        addedCount++;
        console.log(`  ✅ ${name}`);
      } catch (e: any) {
        console.log(`  ❌ ${name}: ${e.message}`);
      }
    }
    await delay(200);
  }

  console.log(`  📊 Added ${addedCount} attractions to ${cityData.name}`);
  return addedCount;
}

async function main() {
  console.log('🚀 Seeding attractions for major cities...\n');
  
  let totalAdded = 0;
  for (const city of CITIES) {
    totalAdded += await seedCity(city);
    await delay(500);
  }

  const totalAttractions = await prisma.attraction.count();
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`   New attractions added: ${totalAdded}`);
  console.log(`   Total attractions in DB: ${totalAttractions}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
