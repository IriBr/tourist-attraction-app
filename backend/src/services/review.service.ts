import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js';
import {
  Review,
  ReviewSummary,
  ReviewSearchParams,
  ReviewStats,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@tourist-app/shared';

interface ReviewWithUser {
  id: string;
  attractionId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  visitDate: Date | null;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    avatarUrl: string | null;
  };
  helpfulVotes?: { id: string }[];
}

function mapToReview(review: ReviewWithUser, userId?: string): Review {
  return {
    id: review.id,
    attractionId: review.attractionId,
    userId: review.userId,
    userName: review.user.name,
    userAvatarUrl: review.user.avatarUrl,
    rating: review.rating,
    title: review.title,
    content: review.content,
    images: review.images,
    visitDate: review.visitDate?.toISOString(),
    helpfulCount: review.helpfulCount,
    isHelpful: userId ? (review.helpfulVotes?.length ?? 0) > 0 : undefined,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

function mapToSummary(review: ReviewWithUser): ReviewSummary {
  return {
    id: review.id,
    userName: review.user.name,
    userAvatarUrl: review.user.avatarUrl,
    rating: review.rating,
    title: review.title,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getReviewsForAttraction(
  params: ReviewSearchParams,
  userId?: string
): Promise<{ items: Review[]; total: number }> {
  const {
    attractionId,
    sortBy = 'recent',
    sortOrder = 'desc',
    minRating,
    page = 1,
    limit = 20,
  } = params;

  const where: Prisma.ReviewWhereInput = { attractionId };

  if (minRating) {
    where.rating = { gte: minRating };
  }

  const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
  if (sortBy === 'recent') orderBy.createdAt = sortOrder;
  else if (sortBy === 'rating') orderBy.rating = sortOrder;
  else if (sortBy === 'helpful') orderBy.helpfulCount = sortOrder;

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        helpfulVotes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: reviews.map((r) => mapToReview(r as ReviewWithUser, userId)),
    total,
  };
}

export async function getReviewById(id: string, userId?: string): Promise<Review> {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      helpfulVotes: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  return mapToReview(review as ReviewWithUser, userId);
}

export async function createReview(
  userId: string,
  data: CreateReviewRequest
): Promise<Review> {
  // Check if attraction exists
  const attraction = await prisma.attraction.findUnique({
    where: { id: data.attractionId },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  // Check if user already reviewed this attraction
  const existingReview = await prisma.review.findUnique({
    where: {
      attractionId_userId: {
        attractionId: data.attractionId,
        userId,
      },
    },
  });

  if (existingReview) {
    throw new ConflictError('You have already reviewed this attraction');
  }

  const review = await prisma.review.create({
    data: {
      attractionId: data.attractionId,
      userId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      images: data.images ?? [],
      visitDate: data.visitDate ? new Date(data.visitDate) : null,
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  // Update attraction stats
  await updateAttractionStats(data.attractionId);

  return mapToReview(review as ReviewWithUser, userId);
}

export async function updateReview(
  reviewId: string,
  userId: string,
  data: UpdateReviewRequest
): Promise<Review> {
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new NotFoundError('Review');
  }

  if (existingReview.userId !== userId) {
    throw new ForbiddenError('You can only edit your own reviews');
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating,
      title: data.title,
      content: data.content,
      images: data.images,
      visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  // Update attraction stats if rating changed
  if (data.rating !== undefined) {
    await updateAttractionStats(existingReview.attractionId);
  }

  return mapToReview(review as ReviewWithUser, userId);
}

export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  if (review.userId !== userId) {
    throw new ForbiddenError('You can only delete your own reviews');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Update attraction stats
  await updateAttractionStats(review.attractionId);
}

export async function markReviewHelpful(
  reviewId: string,
  userId: string
): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new NotFoundError('Review');
  }

  // Check if already marked
  const existingVote = await prisma.helpfulVote.findUnique({
    where: {
      reviewId_userId: { reviewId, userId },
    },
  });

  if (existingVote) {
    // Remove the vote (toggle off)
    await prisma.$transaction([
      prisma.helpfulVote.delete({ where: { id: existingVote.id } }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
      }),
    ]);
  } else {
    // Add the vote
    await prisma.$transaction([
      prisma.helpfulVote.create({ data: { reviewId, userId } }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);
  }
}

export async function getReviewStats(attractionId: string): Promise<ReviewStats> {
  const reviews = await prisma.review.findMany({
    where: { attractionId },
    select: { rating: true },
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  reviews.forEach((r) => {
    distribution[r.rating as keyof typeof distribution]++;
    totalRating += r.rating;
  });

  return {
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
}

export async function getUserReviews(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ items: ReviewSummary[]; total: number }> {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    items: reviews.map((r) => mapToSummary(r as ReviewWithUser)),
    total,
  };
}

async function updateAttractionStats(attractionId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { attractionId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.attraction.update({
    where: { id: attractionId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    },
  });
}
