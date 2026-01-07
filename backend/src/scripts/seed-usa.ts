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
    'shopping_mall': 'shopping', 'night_club': 'entertainment',
    'stadium': 'entertainment', 'historical_landmark': 'historical',
    'monument': 'historical', 'university': 'landmark',
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
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 30000 } },
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
  state: string;
  lat: number;
  lng: number;
}

// Comprehensive list of major US cities
const USA_CITIES: CityData[] = [
  // Major metros (already have some)
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },

  // More major cities
  { name: 'Washington DC', state: 'DC', lat: 38.9072, lng: -77.0369 },
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { name: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 },
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
  { name: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { name: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.5120 },
  { name: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994 },
  { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
  { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
  { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
  { name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
  { name: 'Santa Fe', state: 'NM', lat: 35.6870, lng: -105.9378 },
  { name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { name: 'Scottsdale', state: 'AZ', lat: 33.4942, lng: -111.9261 },
  { name: 'Sedona', state: 'AZ', lat: 34.8697, lng: -111.7610 },
  { name: 'Savannah', state: 'GA', lat: 32.0809, lng: -81.0912 },
  { name: 'Charleston', state: 'SC', lat: 32.7765, lng: -79.9311 },
  { name: 'Asheville', state: 'NC', lat: 35.5951, lng: -82.5515 },
  { name: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490 },
  { name: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585 },
  { name: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
  { name: 'Maui', state: 'HI', lat: 20.7984, lng: -156.3319 },
  { name: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003 },
  { name: 'Key West', state: 'FL', lat: 24.5551, lng: -81.7800 },
  { name: 'Palm Beach', state: 'FL', lat: 26.7056, lng: -80.0364 },
  { name: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lng: -80.1373 },
  { name: 'Napa', state: 'CA', lat: 38.2975, lng: -122.2869 },
  { name: 'Santa Barbara', state: 'CA', lat: 34.4208, lng: -119.6982 },
  { name: 'Monterey', state: 'CA', lat: 36.6002, lng: -121.8947 },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Reno', state: 'NV', lat: 39.5296, lng: -119.8138 },
  { name: 'Jackson Hole', state: 'WY', lat: 43.4799, lng: -110.7624 },
  { name: 'Aspen', state: 'CO', lat: 39.1911, lng: -106.8175 },
  { name: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
  { name: 'Park City', state: 'UT', lat: 40.6461, lng: -111.4980 },
  { name: 'Moab', state: 'UT', lat: 38.5733, lng: -109.5498 },
  { name: 'Grand Canyon', state: 'AZ', lat: 36.0544, lng: -112.1401 },
  { name: 'Yosemite', state: 'CA', lat: 37.8651, lng: -119.5383 },
  { name: 'Yellowstone', state: 'WY', lat: 44.4280, lng: -110.5885 },
  { name: 'Newport', state: 'RI', lat: 41.4901, lng: -71.3128 },
  { name: 'Cape Cod', state: 'MA', lat: 41.6688, lng: -70.2962 },
  { name: 'Portland', state: 'ME', lat: 43.6591, lng: -70.2568 },
  { name: 'Bar Harbor', state: 'ME', lat: 44.3876, lng: -68.2039 },
  { name: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121 },
  { name: 'Lake Tahoe', state: 'CA', lat: 39.0968, lng: -120.0324 },
  { name: 'Myrtle Beach', state: 'SC', lat: 33.6891, lng: -78.8867 },
  { name: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.9780 },
  { name: 'Williamsburg', state: 'VA', lat: 37.2707, lng: -76.7075 },
  { name: 'Annapolis', state: 'MD', lat: 38.9784, lng: -76.4922 },
  { name: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.4360 },
  { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { name: 'Durham', state: 'NC', lat: 35.9940, lng: -78.8986 },
  { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
  { name: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345 },
  { name: 'Des Moines', state: 'IA', lat: 41.5868, lng: -93.6250 },
  { name: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012 },
  { name: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023 },
  { name: 'Spokane', state: 'WA', lat: 47.6588, lng: -117.4260 },
  { name: 'Tacoma', state: 'WA', lat: 47.2529, lng: -122.4443 },
  { name: 'Olympia', state: 'WA', lat: 47.0379, lng: -122.9007 },
  { name: 'Eugene', state: 'OR', lat: 44.0521, lng: -123.0868 },
  { name: 'Bend', state: 'OR', lat: 44.0582, lng: -121.3153 },
];

async function seedCity(cityData: CityData, countryId: string) {
  console.log(`\n🏙️  Seeding ${cityData.name}, ${cityData.state}...`);

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
      }
    });
    console.log(`  📍 Created city: ${cityData.name}`);
  }

  // Check current attraction count
  const currentCount = await prisma.attraction.count({ where: { cityId: city.id } });
  if (currentCount >= 50) {
    console.log(`  ⏭️  Already has ${currentCount} attractions, skipping...`);
    return 0;
  }

  const searchQueries = [
    `famous tourist attractions in ${cityData.name} ${cityData.state}`,
    `historic landmarks in ${cityData.name}`,
    `museums in ${cityData.name} ${cityData.state}`,
    `must see places in ${cityData.name}`,
    `popular things to do in ${cityData.name}`,
    `parks and nature in ${cityData.name} ${cityData.state}`,
    `iconic buildings in ${cityData.name}`,
    `cultural attractions ${cityData.name}`,
    `monuments in ${cityData.name}`,
    `scenic viewpoints ${cityData.name} ${cityData.state}`,
  ];

  let addedCount = 0;
  const addedNames = new Set<string>();

  // Get existing attraction names to avoid duplicates
  const existing = await prisma.attraction.findMany({
    where: { cityId: city.id },
    select: { name: true }
  });
  existing.forEach(a => addedNames.add(a.name.toLowerCase()));

  for (const query of searchQueries) {
    if (addedCount >= 50) break; // Stop if we have enough

    const places = await searchAttractions(query, cityData.lat, cityData.lng);

    for (const place of places) {
      if (addedCount >= 60) break; // Max 60 per city

      const name = place.displayName?.text || '';
      if (!name || addedNames.has(name.toLowerCase())) continue;

      // Skip restaurants, hotels, and generic places
      const types = place.types || [];
      if (types.includes('restaurant') || types.includes('lodging') ||
          types.includes('hotel') || types.includes('food')) continue;

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
            description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}, ${cityData.state}.`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in ${cityData.name}`,
            category: mapGoogleTypeToCategory(types),
            cityId: city.id,
            latitude: place.location?.latitude || cityData.lat,
            longitude: place.location?.longitude || cityData.lng,
            address: place.formattedAddress || `${cityData.name}, ${cityData.state}`,
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
        // Silently skip duplicates
      }
    }
    await delay(200);
  }

  console.log(`  📊 Added ${addedCount} new attractions to ${cityData.name}`);
  return addedCount;
}

async function main() {
  console.log('🇺🇸 USA ATTRACTIONS SEEDER');
  console.log('═'.repeat(50));

  // Find USA country
  const usa = await prisma.country.findFirst({
    where: { OR: [{ name: 'United States' }, { name: 'USA' }, { code: 'US' }] }
  });

  if (!usa) {
    console.error('❌ USA not found in database');
    process.exit(1);
  }

  console.log(`Found USA with ID: ${usa.id}`);

  let totalAdded = 0;
  let citiesProcessed = 0;

  for (const city of USA_CITIES) {
    totalAdded += await seedCity(city, usa.id);
    citiesProcessed++;
    console.log(`  Progress: ${citiesProcessed}/${USA_CITIES.length} cities`);
    await delay(300);
  }

  // Final stats
  const totalUSAAttractions = await prisma.attraction.count({
    where: { city: { countryId: usa.id } }
  });

  const usaCities = await prisma.city.count({
    where: { countryId: usa.id }
  });

  console.log('\n' + '═'.repeat(50));
  console.log('🎉 USA SEEDING COMPLETE');
  console.log('═'.repeat(50));
  console.log(`   New attractions added: ${totalAdded}`);
  console.log(`   Total USA cities: ${usaCities}`);
  console.log(`   Total USA attractions: ${totalUSAAttractions}`);
  console.log('═'.repeat(50));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
