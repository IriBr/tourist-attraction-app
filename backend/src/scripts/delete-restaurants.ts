import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting restaurant attractions...');

  const restaurants = await prisma.attraction.findMany({
    where: { category: 'restaurant' },
    select: { id: true, name: true }
  });

  console.log(`Found ${restaurants.length} restaurant attractions`);

  if (restaurants.length > 0) {
    const ids = restaurants.map(r => r.id);

    // Delete related visits
    const deletedVisits = await prisma.visit.deleteMany({
      where: { attractionId: { in: ids } }
    });
    console.log(`Deleted ${deletedVisits.count} visits`);

    // Delete related favorites
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: { attractionId: { in: ids } }
    });
    console.log(`Deleted ${deletedFavorites.count} favorites`);

    // Delete related reviews
    const deletedReviews = await prisma.review.deleteMany({
      where: { attractionId: { in: ids } }
    });
    console.log(`Deleted ${deletedReviews.count} reviews`);

    // Delete the attractions
    const deleted = await prisma.attraction.deleteMany({
      where: { category: 'restaurant' }
    });
    console.log(`Deleted ${deleted.count} restaurant attractions`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
