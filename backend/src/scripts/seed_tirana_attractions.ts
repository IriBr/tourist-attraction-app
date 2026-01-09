import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTiranaAttractions() {
  const TIRANA_ID = 'a9780b42-f46f-4022-b74f-750ae850b3fa';
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  const categories = [
    { type: 'tourist_attraction', label: 'Tourist Attractions' },
    { type: 'museum', label: 'Museums' },
    { type: 'park', label: 'Parks' },
    { type: 'church', label: 'Churches' },
    { type: 'art_gallery', label: 'Art Galleries' },
    { type: 'historical_landmark', label: 'Historical Landmarks' },
    { type: 'monument', label: 'Monuments' },
  ];

  const city = await prisma.city.findUnique({
    where: { id: TIRANA_ID },
    include: { country: true }
  });

  if (!city) {
    console.log('Tirana city not found');
    return;
  }

  console.log('Seeding attractions for:', city.name, city.country.name);
  let totalAdded = 0;

  for (const cat of categories) {
    console.log('Fetching', cat.label, '...');

    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const body = {
      includedTypes: [cat.type],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: city.latitude, longitude: city.longitude },
          radius: 15000
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY || '',
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types,places.editorialSummary,places.photos'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json() as any;
      const places = data.places || [];

      for (const place of places) {
        const name = place.displayName?.text || 'Unknown';
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;

        if (!lat || !lng) continue;

        // Check if attraction already exists
        const existing = await prisma.attraction.findFirst({
          where: {
            name: name,
            cityId: TIRANA_ID
          }
        });

        if (existing) continue;

        // Get photo URL
        let imageUrl: string | null = null;
        if (place.photos && place.photos.length > 0) {
          const photoName = place.photos[0].name;
          imageUrl = 'https://places.googleapis.com/v1/' + photoName + '/media?maxWidthPx=800&key=' + GOOGLE_API_KEY;
        }

        // Create attraction
        await prisma.attraction.create({
          data: {
            name: name,
            shortDescription: place.editorialSummary?.text || 'A notable attraction in Tirana',
            description: place.editorialSummary?.text || 'Discover this fascinating location in Tirana, Albania.',
            latitude: lat,
            longitude: lng,
            imageUrl: imageUrl,
            category: cat.type.toUpperCase().replace(/_/g, ' '),
            rating: place.rating || 4.0,
            isPremium: false,
            cityId: TIRANA_ID
          }
        });

        totalAdded++;
        console.log('  Added:', name);
      }
    } catch (error: any) {
      console.error('Error fetching', cat.label, ':', error.message);
    }
  }

  console.log('');
  console.log('Total attractions added:', totalAdded);

  // Get final count
  const count = await prisma.attraction.count({ where: { cityId: TIRANA_ID } });
  console.log('Tirana now has', count, 'attractions');
}

seedTiranaAttractions().then(() => prisma.$disconnect());
