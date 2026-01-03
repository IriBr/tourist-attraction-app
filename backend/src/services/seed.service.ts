import { prisma } from '../config/database.js';
import { AttractionCategory } from '@prisma/client';

// Continent data
const continents = [
  { name: 'Africa', code: 'AF', color: '#F59E0B', latitude: 0, longitude: 20, latitudeDelta: 60, longitudeDelta: 60 },
  { name: 'Asia', code: 'AS', color: '#EF4444', latitude: 35, longitude: 100, latitudeDelta: 70, longitudeDelta: 100 },
  { name: 'Europe', code: 'EU', color: '#3B82F6', latitude: 50, longitude: 10, latitudeDelta: 40, longitudeDelta: 60 },
  { name: 'North America', code: 'NA', color: '#10B981', latitude: 40, longitude: -100, latitudeDelta: 60, longitudeDelta: 80 },
  { name: 'Oceania', code: 'OC', color: '#8B5CF6', latitude: -25, longitude: 135, latitudeDelta: 50, longitudeDelta: 70 },
  { name: 'South America', code: 'SA', color: '#EC4899', latitude: -15, longitude: -60, latitudeDelta: 60, longitudeDelta: 50 },
];

// Countries by continent
const countriesByContinent: Record<string, Array<{ name: string; code: string }>> = {
  'EU': [
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Germany', code: 'DE' },
    { name: 'Greece', code: 'GR' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Portugal', code: 'PT' },
  ],
  'AS': [
    { name: 'Japan', code: 'JP' },
    { name: 'China', code: 'CN' },
    { name: 'Thailand', code: 'TH' },
    { name: 'India', code: 'IN' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Turkey', code: 'TR' },
  ],
  'NA': [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'Mexico', code: 'MX' },
  ],
  'SA': [
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Peru', code: 'PE' },
  ],
  'AF': [
    { name: 'Egypt', code: 'EG' },
    { name: 'Morocco', code: 'MA' },
    { name: 'South Africa', code: 'ZA' },
  ],
  'OC': [
    { name: 'Australia', code: 'AU' },
    { name: 'New Zealand', code: 'NZ' },
  ],
};

// Cities by country code
const citiesByCountry: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  'FR': [{ name: 'Paris', lat: 48.8566, lng: 2.3522 }],
  'IT': [{ name: 'Rome', lat: 41.9028, lng: 12.4964 }, { name: 'Venice', lat: 45.4408, lng: 12.3155 }],
  'ES': [{ name: 'Barcelona', lat: 41.3874, lng: 2.1686 }, { name: 'Madrid', lat: 40.4168, lng: -3.7038 }],
  'GB': [{ name: 'London', lat: 51.5074, lng: -0.1278 }],
  'DE': [{ name: 'Berlin', lat: 52.5200, lng: 13.4050 }],
  'GR': [{ name: 'Athens', lat: 37.9838, lng: 23.7275 }],
  'NL': [{ name: 'Amsterdam', lat: 52.3676, lng: 4.9041 }],
  'PT': [{ name: 'Lisbon', lat: 38.7223, lng: -9.1393 }],
  'JP': [{ name: 'Tokyo', lat: 35.6762, lng: 139.6503 }, { name: 'Kyoto', lat: 35.0116, lng: 135.7681 }],
  'CN': [{ name: 'Beijing', lat: 39.9042, lng: 116.4074 }, { name: 'Shanghai', lat: 31.2304, lng: 121.4737 }],
  'TH': [{ name: 'Bangkok', lat: 13.7563, lng: 100.5018 }],
  'IN': [{ name: 'New Delhi', lat: 28.6139, lng: 77.2090 }, { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }],
  'AE': [{ name: 'Dubai', lat: 25.2048, lng: 55.2708 }],
  'TR': [{ name: 'Istanbul', lat: 41.0082, lng: 28.9784 }],
  'US': [{ name: 'New York', lat: 40.7128, lng: -74.0060 }, { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 }],
  'CA': [{ name: 'Toronto', lat: 43.6532, lng: -79.3832 }],
  'MX': [{ name: 'Mexico City', lat: 19.4326, lng: -99.1332 }],
  'BR': [{ name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 }],
  'AR': [{ name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 }],
  'PE': [{ name: 'Lima', lat: -12.0464, lng: -77.0428 }, { name: 'Cusco', lat: -13.5319, lng: -71.9675 }],
  'EG': [{ name: 'Cairo', lat: 30.0444, lng: 31.2357 }],
  'MA': [{ name: 'Marrakech', lat: 31.6295, lng: -7.9811 }],
  'ZA': [{ name: 'Cape Town', lat: -33.9249, lng: 18.4241 }],
  'AU': [{ name: 'Sydney', lat: -33.8688, lng: 151.2093 }],
  'NZ': [{ name: 'Auckland', lat: -36.8509, lng: 174.7645 }],
};

// Sample attractions
const attractions = [
  // Paris
  { city: 'Paris', name: 'Eiffel Tower', category: 'landmark' as AttractionCategory, lat: 48.8584, lng: 2.2945, address: 'Champ de Mars, Paris', description: 'Iconic iron lattice tower on the Champ de Mars, symbol of Paris and France.', shortDescription: 'Iconic Parisian landmark', famousFor: 'Most visited paid monument in the world', thumbnailUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400' },
  { city: 'Paris', name: 'Louvre Museum', category: 'museum' as AttractionCategory, lat: 48.8606, lng: 2.3376, address: 'Rue de Rivoli, Paris', description: 'World\'s largest art museum and historic monument, home to the Mona Lisa.', shortDescription: 'World\'s largest art museum', famousFor: 'Home of the Mona Lisa', thumbnailUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400' },
  // Rome
  { city: 'Rome', name: 'Colosseum', category: 'historical' as AttractionCategory, lat: 41.8902, lng: 12.4922, address: 'Piazza del Colosseo, Rome', description: 'Ancient amphitheatre, largest ever built, iconic symbol of Imperial Rome.', shortDescription: 'Ancient Roman amphitheatre', famousFor: 'Largest ancient amphitheatre', thumbnailUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
  { city: 'Rome', name: 'Vatican Museums', category: 'museum' as AttractionCategory, lat: 41.9065, lng: 12.4536, address: 'Vatican City', description: 'Christian and art museums showcasing works from the immense collection of the Catholic Church.', shortDescription: 'World-renowned art museums', famousFor: 'Sistine Chapel ceiling by Michelangelo', thumbnailUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400' },
  // London
  { city: 'London', name: 'Big Ben', category: 'landmark' as AttractionCategory, lat: 51.5007, lng: -0.1246, address: 'Westminster, London', description: 'Iconic clock tower at the north end of the Palace of Westminster.', shortDescription: 'Famous clock tower', famousFor: 'Most famous clock in the world', thumbnailUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400' },
  { city: 'London', name: 'Tower of London', category: 'historical' as AttractionCategory, lat: 51.5081, lng: -0.0759, address: 'Tower Hill, London', description: 'Historic castle and fortress on the north bank of the River Thames.', shortDescription: 'Historic royal palace', famousFor: 'Crown Jewels of England', thumbnailUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400' },
  // New York
  { city: 'New York', name: 'Statue of Liberty', category: 'landmark' as AttractionCategory, lat: 40.6892, lng: -74.0445, address: 'Liberty Island, New York', description: 'Colossal neoclassical sculpture, a gift from France, symbol of freedom.', shortDescription: 'Symbol of freedom', famousFor: 'Welcome beacon for immigrants', thumbnailUrl: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=400' },
  { city: 'New York', name: 'Central Park', category: 'park' as AttractionCategory, lat: 40.7829, lng: -73.9654, address: 'Manhattan, New York', description: 'Iconic urban park in Manhattan, offering lakes, trails, and recreational areas.', shortDescription: 'Iconic urban park', famousFor: 'Most visited urban park in the US', thumbnailUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400' },
  // Tokyo
  { city: 'Tokyo', name: 'Senso-ji Temple', category: 'religious' as AttractionCategory, lat: 35.7148, lng: 139.7967, address: 'Asakusa, Tokyo', description: 'Ancient Buddhist temple, Tokyo\'s oldest and most significant temple.', shortDescription: 'Tokyo\'s oldest temple', famousFor: 'Thunder Gate (Kaminarimon)', thumbnailUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400' },
  { city: 'Tokyo', name: 'Tokyo Tower', category: 'landmark' as AttractionCategory, lat: 35.6586, lng: 139.7454, address: 'Minato, Tokyo', description: 'Communications and observation tower inspired by the Eiffel Tower.', shortDescription: 'Iconic Tokyo landmark', famousFor: 'Panoramic city views', thumbnailUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400' },
  // Cairo
  { city: 'Cairo', name: 'Great Pyramid of Giza', category: 'historical' as AttractionCategory, lat: 29.9792, lng: 31.1342, address: 'Al Haram, Giza', description: 'The oldest and largest of the pyramids in the Giza pyramid complex.', shortDescription: 'Ancient wonder of the world', famousFor: 'Only surviving ancient wonder', thumbnailUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400' },
  // Sydney
  { city: 'Sydney', name: 'Sydney Opera House', category: 'landmark' as AttractionCategory, lat: -33.8568, lng: 151.2153, address: 'Bennelong Point, Sydney', description: 'Multi-venue performing arts centre, UNESCO World Heritage Site.', shortDescription: 'Iconic performing arts venue', famousFor: 'Distinctive sail-shaped design', thumbnailUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400' },
  // Dubai
  { city: 'Dubai', name: 'Burj Khalifa', category: 'landmark' as AttractionCategory, lat: 25.1972, lng: 55.2744, address: 'Downtown Dubai', description: 'The world\'s tallest building, a global icon of modern architecture.', shortDescription: 'World\'s tallest building', famousFor: 'Tallest structure ever built', thumbnailUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400' },
  // Barcelona
  { city: 'Barcelona', name: 'Sagrada Familia', category: 'religious' as AttractionCategory, lat: 41.4036, lng: 2.1744, address: 'Carrer de Mallorca, Barcelona', description: 'Gaudí\'s unfinished masterpiece, a UNESCO World Heritage basilica.', shortDescription: 'Gaudí\'s masterpiece', famousFor: 'Unique Art Nouveau architecture', thumbnailUrl: 'https://images.unsplash.com/photo-1583779457711-e1f4ca5a2d91?w=400' },
  // Rio
  { city: 'Rio de Janeiro', name: 'Christ the Redeemer', category: 'landmark' as AttractionCategory, lat: -22.9519, lng: -43.2105, address: 'Corcovado Mountain, Rio', description: 'Art Deco statue of Jesus Christ, one of the New Seven Wonders of the World.', shortDescription: 'Iconic statue of Christ', famousFor: 'New Seven Wonders of the World', thumbnailUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400' },
  // Cusco
  { city: 'Cusco', name: 'Machu Picchu', category: 'historical' as AttractionCategory, lat: -13.1631, lng: -72.5450, address: 'Cusco Region, Peru', description: '15th-century Inca citadel set high in the Andes Mountains.', shortDescription: 'Ancient Inca citadel', famousFor: 'Best-known icon of Inca civilization', thumbnailUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400' },
];

export async function seedDatabase(): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    // Check if already seeded
    const existingContinents = await prisma.continent.count();
    if (existingContinents > 0) {
      return { success: true, message: 'Database already seeded', stats: { continents: existingContinents } };
    }

    console.log('Starting database seed...');

    // Create continents
    const createdContinents: Record<string, string> = {};
    for (const continent of continents) {
      const created = await prisma.continent.create({ data: continent });
      createdContinents[continent.code] = created.id;
      console.log(`Created continent: ${continent.name}`);
    }

    // Create countries
    const createdCountries: Record<string, string> = {};
    for (const [continentCode, countries] of Object.entries(countriesByContinent)) {
      const continentId = createdContinents[continentCode];
      if (!continentId) continue;

      for (const country of countries) {
        const created = await prisma.country.create({
          data: { ...country, continentId }
        });
        createdCountries[country.code] = created.id;
        console.log(`Created country: ${country.name}`);
      }
    }

    // Create cities
    const createdCities: Record<string, string> = {};
    for (const [countryCode, cities] of Object.entries(citiesByCountry)) {
      const countryId = createdCountries[countryCode];
      if (!countryId) continue;

      for (const city of cities) {
        const created = await prisma.city.create({
          data: {
            name: city.name,
            latitude: city.lat,
            longitude: city.lng,
            countryId
          }
        });
        createdCities[city.name] = created.id;
        console.log(`Created city: ${city.name}`);
      }
    }

    // Create attractions
    let attractionCount = 0;
    for (const attraction of attractions) {
      const cityId = createdCities[attraction.city];
      if (!cityId) continue;

      await prisma.attraction.create({
        data: {
          name: attraction.name,
          description: attraction.description,
          shortDescription: attraction.shortDescription,
          category: attraction.category,
          cityId,
          latitude: attraction.lat,
          longitude: attraction.lng,
          address: attraction.address,
          thumbnailUrl: attraction.thumbnailUrl,
          images: [attraction.thumbnailUrl],
          famousFor: attraction.famousFor,
          isFree: false,
        }
      });
      attractionCount++;
      console.log(`Created attraction: ${attraction.name}`);
    }

    const stats = {
      continents: Object.keys(createdContinents).length,
      countries: Object.keys(createdCountries).length,
      cities: Object.keys(createdCities).length,
      attractions: attractionCount
    };

    console.log('Seed completed:', stats);
    return { success: true, message: 'Database seeded successfully', stats };
  } catch (error) {
    console.error('Seed error:', error);
    return { success: false, message: `Seed failed: ${error}` };
  }
}
