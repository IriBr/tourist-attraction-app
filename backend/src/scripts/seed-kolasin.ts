import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY environment variable is required');
  process.exit(1);
}

// Kolasin, Montenegro coordinates
const KOLASIN = {
  name: 'Kolašin',
  latitude: 42.8242,
  longitude: 19.5178,
  country: 'Montenegro',
  continent: 'Europe',
};

// Map Google place types to our categories
function mapGoogleTypeToCategory(types: string[]): AttractionCategory | null {
  const excludedTypes = new Set(['bar', 'restaurant', 'night_club', 'cafe', 'bakery', 'food']);

  for (const type of types) {
    if (excludedTypes.has(type)) return null;
  }

  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum',
    'park': 'park',
    'national_park': 'nature',
    'tourist_attraction': 'landmark',
    'point_of_interest': 'landmark',
    'church': 'religious',
    'monastery': 'religious',
    'place_of_worship': 'religious',
    'natural_feature': 'nature',
    'ski_resort': 'entertainment',
    'campground': 'nature',
    'hiking_area': 'nature',
    'historical_landmark': 'historical',
    'monument': 'historical',
  };

  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return 'landmark';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchAttractions(query: string, lat: number, lng: number): Promise<any[]> {
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
            radius: 50000, // 50km radius for mountain region
          },
        },
        maxResultCount: 20,
        languageCode: 'en',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error: ${error}`);
      return [];
    }

    const data = await response.json();
    return data.places || [];
  } catch (error: any) {
    console.error(`Fetch error: ${error.message}`);
    return [];
  }
}

function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
}

async function main() {
  console.log('='.repeat(60));
  console.log(' SEEDING ATTRACTIONS FOR KOLASIN, MONTENEGRO');
  console.log('='.repeat(60));

  // 1. Ensure continent exists
  let continent = await prisma.continent.findFirst({ where: { name: KOLASIN.continent } });
  if (!continent) {
    continent = await prisma.continent.create({
      data: { name: KOLASIN.continent, code: 'EU' },
    });
    console.log(`Created continent: ${continent.name}`);
  }

  // 2. Ensure country exists
  let country = await prisma.country.findFirst({ where: { name: KOLASIN.country } });
  if (!country) {
    country = await prisma.country.create({
      data: {
        name: KOLASIN.country,
        code: 'ME',
        continentId: continent.id,
      },
    });
    console.log(`Created country: ${country.name}`);
  }

  // 3. Ensure city exists
  let city = await prisma.city.findFirst({ where: { name: KOLASIN.name, countryId: country.id } });
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: KOLASIN.name,
        countryId: country.id,
        latitude: KOLASIN.latitude,
        longitude: KOLASIN.longitude,
      },
    });
    console.log(`Created city: ${city.name}`);
  } else {
    console.log(`City exists: ${city.name}`);
  }

  // 4. Search queries for mountain/ski resort town
  const queries = [
    'tourist attractions in Kolašin Montenegro',
    'things to do in Kolašin',
    'Biogradska Gora National Park',
    'ski resorts near Kolašin',
    'hiking trails Kolašin Montenegro',
    'monasteries near Kolašin',
    'nature attractions Kolašin',
    'Bjelasica mountain attractions',
    'lakes near Kolašin Montenegro',
  ];

  const seenPlaceIds = new Set<string>();
  let attractionsAdded = 0;

  for (const query of queries) {
    console.log(`\nSearching: "${query}"`);

    const places = await searchAttractions(query, KOLASIN.latitude, KOLASIN.longitude);
    console.log(`  Found ${places.length} places`);

    for (const place of places) {
      try {
        if (seenPlaceIds.has(place.id)) continue;
        seenPlaceIds.add(place.id);

        const placeName = place.displayName?.text || '';
        if (!placeName) continue;

        const category = mapGoogleTypeToCategory(place.types || []);
        if (category === null) {
          console.log(`  Skipped (excluded type): ${placeName}`);
          continue;
        }

        // Lower threshold for mountain town (fewer reviews expected)
        const rating = place.rating || 0;
        const reviews = place.userRatingCount || 0;
        if (rating < 3.0 || reviews < 5) {
          console.log(`  Skipped (low rating/reviews): ${placeName}`);
          continue;
        }

        // Check if exists
        const existing = await prisma.attraction.findFirst({
          where: { name: placeName, cityId: city.id },
        });
        if (existing) {
          console.log(`  Already exists: ${placeName}`);
          continue;
        }

        // Get photos
        const images: string[] = [];
        let thumbnailUrl = '';
        if (place.photos?.length > 0) {
          thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
          for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
            images.push(getPhotoUrl(place.photos[i].name, 800));
          }
        }

        // Create attraction
        await prisma.attraction.create({
          data: {
            name: placeName,
            description: place.editorialSummary?.text || `A popular attraction in ${KOLASIN.name}, ${KOLASIN.country}. This destination offers visitors a unique experience in the beautiful Montenegrin mountains.`,
            shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${placeName} in ${KOLASIN.name}`,
            category: category,
            cityId: city.id,
            latitude: place.location?.latitude || KOLASIN.latitude,
            longitude: place.location?.longitude || KOLASIN.longitude,
            address: place.formattedAddress || `${KOLASIN.name}, ${KOLASIN.country}`,
            images: images,
            thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300?text=No+Image',
            website: place.websiteUri || null,
            contactPhone: place.internationalPhoneNumber || null,
            averageRating: rating,
            totalReviews: reviews,
            isFree: false,
          },
        });

        attractionsAdded++;
        console.log(`  + Added: ${placeName} (${category}, ${rating}★, ${reviews} reviews)`);
      } catch (error: any) {
        console.error(`  Error: ${error.message}`);
      }
    }

    await delay(300);
  }

  // Final count
  const totalAttractions = await prisma.attraction.count({ where: { cityId: city.id } });

  console.log('\n' + '='.repeat(60));
  console.log(' SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`  Attractions added: ${attractionsAdded}`);
  console.log(`  Total attractions in ${KOLASIN.name}: ${totalAttractions}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
