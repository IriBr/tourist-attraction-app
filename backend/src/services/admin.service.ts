import { prisma } from '../config/database.js';
import { SubscriptionTier, SubscriptionStatus, UserRole } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class AdminService {
  // ============ USER MANAGEMENT ============

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          authProvider: true,
          emailVerified: true,
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              favorites: true,
              visits: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        authProvider: true,
        emailVerified: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            visits: true,
            dailyScans: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUserSubscription(userId: string, tier: SubscriptionTier) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData: any = {
      subscriptionTier: tier,
      subscriptionStatus: SubscriptionStatus.active,
    };

    if (tier === SubscriptionTier.premium) {
      updateData.subscriptionStartDate = new Date();
      updateData.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else {
      updateData.subscriptionStartDate = null;
      updateData.subscriptionEndDate = null;
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete user and all related data (cascading)
    await prisma.user.delete({ where: { id: userId } });

    return { success: true, message: 'User deleted successfully' };
  }

  // ============ ATTRACTION MANAGEMENT ============

  async getAllAttractions(page = 1, limit = 20, search?: string, category?: string, cityId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        skip,
        take: limit,
        include: {
          city: {
            include: {
              country: {
                include: {
                  continent: true,
                },
              },
            },
          },
          openingHours: true,
          _count: {
            select: {
              reviews: true,
              favorites: true,
              visits: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attraction.count({ where }),
    ]);

    return {
      attractions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttractionById(attractionId: string) {
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
      include: {
        city: {
          include: {
            country: {
              include: {
                continent: true,
              },
            },
          },
        },
        openingHours: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            visits: true,
          },
        },
      },
    });

    if (!attraction) {
      throw new NotFoundError('Attraction not found');
    }

    return attraction;
  }

  async createAttraction(data: any) {
    const { openingHours, ...attractionData } = data;

    return prisma.attraction.create({
      data: {
        ...attractionData,
        openingHours: openingHours
          ? {
              createMany: {
                data: openingHours,
              },
            }
          : undefined,
      },
      include: {
        city: {
          include: {
            country: {
              include: {
                continent: true,
              },
            },
          },
        },
        openingHours: true,
      },
    });
  }

  async updateAttraction(attractionId: string, data: any) {
    const attraction = await prisma.attraction.findUnique({ where: { id: attractionId } });

    if (!attraction) {
      throw new NotFoundError('Attraction not found');
    }

    const { openingHours, ...attractionData } = data;

    // If opening hours are provided, delete existing and create new
    if (openingHours) {
      await prisma.openingHours.deleteMany({ where: { attractionId } });
    }

    return prisma.attraction.update({
      where: { id: attractionId },
      data: {
        ...attractionData,
        openingHours: openingHours
          ? {
              createMany: {
                data: openingHours,
              },
            }
          : undefined,
      },
      include: {
        city: {
          include: {
            country: {
              include: {
                continent: true,
              },
            },
          },
        },
        openingHours: true,
      },
    });
  }

  async deleteAttraction(attractionId: string) {
    const attraction = await prisma.attraction.findUnique({ where: { id: attractionId } });

    if (!attraction) {
      throw new NotFoundError('Attraction not found');
    }

    await prisma.attraction.delete({ where: { id: attractionId } });

    return { success: true, message: 'Attraction deleted successfully' };
  }

  // ============ LOCATION MANAGEMENT ============

  async getAllCountries() {
    return prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        continent: { select: { id: true, name: true } },
        _count: { select: { cities: true } },
      },
    });
  }

  async createCountry(data: {
    name: string;
    continentId: string;
    code?: string;
    latitude?: number;
    longitude?: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
    flagUrl?: string;
    imageUrl?: string;
  }) {
    return prisma.country.create({
      data: {
        name: data.name,
        continentId: data.continentId,
        code: data.code || data.name.substring(0, 2).toUpperCase(),
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: data.latitudeDelta || 5,
        longitudeDelta: data.longitudeDelta || 5,
        flagUrl: data.flagUrl,
        imageUrl: data.imageUrl,
      },
      include: {
        continent: { select: { id: true, name: true } },
      },
    });
  }

  async getAllCities() {
    return prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: {
        country: { select: { id: true, name: true } },
        _count: { select: { attractions: true } },
      },
    });
  }

  async createCity(data: {
    name: string;
    countryId: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  }) {
    return prisma.city.create({
      data: {
        name: data.name,
        countryId: data.countryId,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrl: data.imageUrl,
      },
      include: {
        country: { select: { id: true, name: true } },
      },
    });
  }

  // ============ LOCATION STATS ============

  async getLocationStats() {
    const [continentsData, countriesData, citiesData, attractionsCount, usersCount] = await Promise.all([
      prisma.continent.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { countries: true } },
        },
      }),
      prisma.country.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { cities: true } },
        },
      }),
      prisma.city.findMany({
        select: {
          id: true,
          name: true,
          country: { select: { name: true } },
          _count: { select: { attractions: true } },
        },
      }),
      prisma.attraction.count(),
      prisma.user.count(),
    ]);

    return {
      continents: continentsData.length,
      countries: countriesData.length,
      cities: citiesData.length,
      attractions: attractionsCount,
      users: usersCount,
      countryList: countriesData.map(c => ({
        name: c.name,
        attractionCount: c._count.cities,
      })),
      cityList: citiesData.map(c => ({
        name: c.name,
        country: c.country.name,
        attractionCount: c._count.attractions,
      })),
    };
  }

  // ============ DASHBOARD STATS ============

  async getDashboardStats() {
    const [
      totalUsers,
      premiumUsers,
      freeUsers,
      totalAttractions,
      totalReviews,
      totalVisits,
      recentUsers,
      recentAttractions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionTier: SubscriptionTier.premium } }),
      prisma.user.count({ where: { subscriptionTier: SubscriptionTier.free } }),
      prisma.attraction.count(),
      prisma.review.count(),
      prisma.visit.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          createdAt: true,
        },
      }),
      prisma.attraction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: {
            select: {
              name: true,
              country: {
                select: { name: true },
              },
            },
          },
          category: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: freeUsers,
      },
      attractions: {
        total: totalAttractions,
      },
      engagement: {
        reviews: totalReviews,
        visits: totalVisits,
      },
      recent: {
        users: recentUsers,
        attractions: recentAttractions,
      },
    };
  }
}

export const adminService = new AdminService();
