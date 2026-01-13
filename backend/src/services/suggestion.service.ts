import { Prisma, SuggestionType, SuggestionStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import {
  Suggestion,
  SuggestionWithDetails,
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
  SuggestionSearchParams,
} from '@tourist-app/shared';

interface SuggestionWithRelations {
  id: string;
  attractionId: string;
  userId: string;
  type: SuggestionType;
  status: SuggestionStatus;
  comment: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attraction: {
    id: string;
    name: string;
    isVerified: boolean;
    city: {
      name: string;
      country: {
        name: string;
      };
    };
  };
}

function mapToSuggestion(s: SuggestionWithRelations): Suggestion {
  return {
    id: s.id,
    attractionId: s.attractionId,
    userId: s.userId,
    type: s.type as unknown as import('@tourist-app/shared').SuggestionType,
    status: s.status as unknown as import('@tourist-app/shared').SuggestionStatus,
    comment: s.comment,
    adminNotes: s.adminNotes,
    reviewedBy: s.reviewedBy,
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function mapToSuggestionWithDetails(s: SuggestionWithRelations): SuggestionWithDetails {
  return {
    ...mapToSuggestion(s),
    user: {
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
    },
    attraction: {
      id: s.attraction.id,
      name: s.attraction.name,
      city: s.attraction.city.name,
      country: s.attraction.city.country.name,
      isVerified: s.attraction.isVerified,
    },
  };
}

export async function createSuggestion(
  userId: string,
  data: CreateSuggestionRequest
): Promise<Suggestion> {
  const { attractionId, type, comment } = data;

  // Verify attraction exists
  const attraction = await prisma.attraction.findUnique({
    where: { id: attractionId },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  // Check for existing suggestion of same type
  const existing = await prisma.suggestion.findUnique({
    where: {
      attractionId_userId_type: { attractionId, userId, type: type as SuggestionType },
    },
  });

  if (existing) {
    throw new ConflictError('You have already submitted this type of suggestion for this attraction');
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      attractionId,
      userId,
      type: type as SuggestionType,
      comment,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attraction: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          city: {
            select: {
              name: true,
              country: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return mapToSuggestion(suggestion as SuggestionWithRelations);
}

export async function getUserSuggestions(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ items: SuggestionWithDetails[]; total: number }> {
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * safeLimit;

  const [suggestions, total] = await Promise.all([
    prisma.suggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        attraction: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            city: {
              select: {
                name: true,
                country: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.suggestion.count({ where: { userId } }),
  ]);

  return {
    items: suggestions.map((s) => mapToSuggestionWithDetails(s as SuggestionWithRelations)),
    total,
  };
}

export async function getSuggestionsByAttraction(
  attractionId: string
): Promise<SuggestionWithDetails[]> {
  const suggestions = await prisma.suggestion.findMany({
    where: { attractionId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attraction: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          city: {
            select: {
              name: true,
              country: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return suggestions.map((s) => mapToSuggestionWithDetails(s as SuggestionWithRelations));
}

// Admin functions
export async function getAllSuggestions(
  params: SuggestionSearchParams
): Promise<{ items: SuggestionWithDetails[]; total: number }> {
  const { status, type, attractionId, page = 1, limit = 20 } = params;

  const MAX_LIMIT = 100;
  const safeLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * safeLimit;

  const where: Prisma.SuggestionWhereInput = {};

  if (status) {
    where.status = status as SuggestionStatus;
  }

  if (type) {
    where.type = type as SuggestionType;
  }

  if (attractionId) {
    where.attractionId = attractionId;
  }

  const [suggestions, total] = await Promise.all([
    prisma.suggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        attraction: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            city: {
              select: {
                name: true,
                country: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.suggestion.count({ where }),
  ]);

  return {
    items: suggestions.map((s) => mapToSuggestionWithDetails(s as SuggestionWithRelations)),
    total,
  };
}

export async function getSuggestionById(id: string): Promise<SuggestionWithDetails> {
  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attraction: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          city: {
            select: {
              name: true,
              country: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!suggestion) {
    throw new NotFoundError('Suggestion');
  }

  return mapToSuggestionWithDetails(suggestion as SuggestionWithRelations);
}

export async function updateSuggestion(
  id: string,
  adminUserId: string,
  data: UpdateSuggestionRequest
): Promise<SuggestionWithDetails> {
  const { status, adminNotes } = data;

  const existing = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Suggestion');
  }

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data: {
      status: status as SuggestionStatus,
      adminNotes,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attraction: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          city: {
            select: {
              name: true,
              country: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return mapToSuggestionWithDetails(suggestion as SuggestionWithRelations);
}

export async function deleteSuggestion(id: string): Promise<void> {
  const existing = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Suggestion');
  }

  await prisma.suggestion.delete({
    where: { id },
  });
}

// Helper to get suggestion stats for admin dashboard
export async function getSuggestionStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  resolved: number;
}> {
  const [total, pending, approved, rejected, resolved] = await Promise.all([
    prisma.suggestion.count(),
    prisma.suggestion.count({ where: { status: 'pending' } }),
    prisma.suggestion.count({ where: { status: 'approved' } }),
    prisma.suggestion.count({ where: { status: 'rejected' } }),
    prisma.suggestion.count({ where: { status: 'resolved' } }),
  ]);

  return { total, pending, approved, rejected, resolved };
}

// Toggle attraction verification status
export async function setAttractionVerified(
  attractionId: string,
  isVerified: boolean
): Promise<{ id: string; name: string; isVerified: boolean }> {
  const attraction = await prisma.attraction.findUnique({
    where: { id: attractionId },
  });

  if (!attraction) {
    throw new NotFoundError('Attraction');
  }

  const updated = await prisma.attraction.update({
    where: { id: attractionId },
    data: { isVerified },
    select: { id: true, name: true, isVerified: true },
  });

  return updated;
}
