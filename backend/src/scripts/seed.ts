import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const attractions = [
  {
    name: 'Eiffel Tower',
    description:
      'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower.',
    shortDescription: 'Iconic iron lattice tower and symbol of Paris',
    category: 'landmark',
    latitude: 48.8584,
    longitude: 2.2945,
    address: 'Champ de Mars, 5 Avenue Anatole France',
    city: 'Paris',
    country: 'France',
    postalCode: '75007',
    images: [
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
    website: 'https://www.toureiffel.paris',
    currency: 'EUR',
    adultPrice: 26.8,
    childPrice: 13.4,
    isFree: false,
    openingHours: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '00:45', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '00:45', isClosed: false },
    ],
  },
  {
    name: 'Colosseum',
    description:
      'The Colosseum is an oval amphitheatre in the centre of the city of Rome, Italy. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time.',
    shortDescription: 'Ancient Roman amphitheatre and iconic landmark',
    category: 'historical',
    latitude: 41.8902,
    longitude: 12.4922,
    address: 'Piazza del Colosseo, 1',
    city: 'Rome',
    country: 'Italy',
    postalCode: '00184',
    images: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1555992643-a09e0854aa8a?w=800',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    website: 'https://www.colosseo.it',
    currency: 'EUR',
    adultPrice: 18,
    childPrice: 0,
    isFree: false,
    openingHours: [
      { dayOfWeek: 0, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 1, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:30', closeTime: '19:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:30', closeTime: '19:00', isClosed: false },
    ],
  },
  {
    name: 'Central Park',
    description:
      'Central Park is an urban park in New York City located between the Upper West and Upper East Sides of Manhattan. It is the most visited urban park in the United States.',
    shortDescription: 'Iconic urban park in the heart of Manhattan',
    category: 'park',
    latitude: 40.7829,
    longitude: -73.9654,
    address: 'Central Park',
    city: 'New York',
    country: 'United States',
    postalCode: '10024',
    images: [
      'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400',
    website: 'https://www.centralparknyc.org',
    isFree: true,
    openingHours: [
      { dayOfWeek: 0, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 1, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 2, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 3, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 4, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 5, openTime: '06:00', closeTime: '01:00', isClosed: false },
      { dayOfWeek: 6, openTime: '06:00', closeTime: '01:00', isClosed: false },
    ],
  },
  {
    name: 'Louvre Museum',
    description:
      "The Louvre is the world's largest art museum and a historic monument in Paris. A central landmark, it is located on the Right Bank of the Seine.",
    shortDescription: "World's largest art museum housing the Mona Lisa",
    category: 'museum',
    latitude: 48.8606,
    longitude: 2.3376,
    address: 'Rue de Rivoli',
    city: 'Paris',
    country: 'France',
    postalCode: '75001',
    images: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?w=800',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    website: 'https://www.louvre.fr',
    currency: 'EUR',
    adultPrice: 17,
    childPrice: 0,
    isFree: false,
    openingHours: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 2, openTime: '00:00', closeTime: '00:00', isClosed: true },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: false },
    ],
  },
  {
    name: 'Sagrada Familia',
    description:
      'The Basílica de la Sagrada Família is a large unfinished minor basilica in the Eixample district of Barcelona, Catalonia, Spain. Designed by architect Antoni Gaudí.',
    shortDescription: "Gaudí's iconic unfinished masterpiece basilica",
    category: 'religious',
    latitude: 41.4036,
    longitude: 2.1744,
    address: 'Carrer de Mallorca, 401',
    city: 'Barcelona',
    country: 'Spain',
    postalCode: '08013',
    images: [
      'https://images.unsplash.com/photo-1583779457711-ab7a9e6c7a6e?w=800',
      'https://images.unsplash.com/photo-1566522650166-bd8b3e3a2b4b?w=800',
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1583779457711-ab7a9e6c7a6e?w=400',
    website: 'https://sagradafamilia.org',
    currency: 'EUR',
    adultPrice: 26,
    childPrice: 0,
    isFree: false,
    openingHours: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '20:00', isClosed: false },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo@123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      emailVerified: true,
      authProvider: 'email',
    },
  });
  console.log(`Created demo user: ${user.email}`);

  // Create attractions
  for (const attractionData of attractions) {
    const { openingHours, ...data } = attractionData;

    const attraction = await prisma.attraction.upsert({
      where: {
        id: attractionData.name.toLowerCase().replace(/\s+/g, '-'),
      },
      update: data,
      create: {
        ...data,
        openingHours: {
          create: openingHours,
        },
      },
    });

    console.log(`Created attraction: ${attraction.name}`);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
