import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import {
  Favorite,
  FavoriteWithAttraction,
  FavoritesListParams,
  AttractionSummary,
  AttractionCategory,
} from '@tourist-app/shared';

interface FavoriteWithAttractionData {
  id: string;
  userId: string;
  attractionId: string;
  createdAt: Date;
  attraction: {
    id: string;
    name: string;
    shortDescription: string;
    category: string;
    thumbnailUrl: string;
    city: string;
    country: string;
    averageRating: number;
    totalReviews: number;
  };
}

function mapToFavoriteWithAttraction(
  fav: FavoriteWithAttractionData
): FavoriteWithAttraction {
  const attraction: AttractionSummary = {
    id: fav.attraction.id,
    name: fav.attraction.name,
    shortDescription: fav.attraction.shortDescription,
    category: fav.attraction.category as AttractionCategory,
    thumbnailUrl: fav.attraction.thumbnailUrl,
    location: {
      city: fav.attraction.city,
      country: fav.attraction.country,
    },
    averageRating: fav.attraction.averageRating,
    totalReviews: fav.attraction.totalReviews,
    isFavorited: true,
  };

  return {
    id: fav.id,
    userId: fav.userId,
    attractionId: fav.attractionId,
    createdAt: fav.createdAt.toISOString(),
    attraction,
  };
}

export async function addFavorite(
  userId: string,
  attractionId: string
): Promise<Favorite> {
  // Check if attraction exists
  const attraction = await prisma.attraction.findUnique({
    where: { id: attractionId },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  // Check if already favorited
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });

  if (existing) {
    throw new ConflictError('Attraction is already in favorites');
  }

  const favorite = await prisma.favorite.create({
    data: { userId, attractionId },
  });

  return {
    id: favorite.id,
    userId: favorite.userId,
    attractionId: favorite.attractionId,
    createdAt: favorite.createdAt.toISOString(),
  };
}

export async function removeFavorite(
  userId: string,
  attractionId: string
): Promise<void> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });

  if (!favorite) {
    throw new NotFoundError('Favorite');
  }

  await prisma.favorite.delete({
    where: { id: favorite.id },
  });
}

export async function getUserFavorites(
  userId: string,
  params: FavoritesListParams = {}
): Promise<{ items: FavoriteWithAttraction[]; total: number }> {
  const { page = 1, limit = 20, sortBy = 'recent', sortOrder = 'desc' } = params;

  const skip = (page - 1) * limit;

  const orderBy: Prisma.FavoriteOrderByWithRelationInput =
    sortBy === 'name'
      ? { attraction: { name: sortOrder } }
      : { createdAt: sortOrder };

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      orderBy,
      skip,
      take: limit,
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            shortDescription: true,
            category: true,
            thumbnailUrl: true,
            city: true,
            country: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  return {
    items: favorites.map((f) =>
      mapToFavoriteWithAttraction(f as FavoriteWithAttractionData)
    ),
    total,
  };
}

export async function isFavorited(
  userId: string,
  attractionId: string
): Promise<boolean> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_attractionId: { userId, attractionId },
    },
  });

  return favorite !== null;
}

export async function getFavoritesCount(userId: string): Promise<number> {
  return prisma.favorite.count({ where: { userId } });
}
