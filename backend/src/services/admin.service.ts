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

  async deleteAttractionsByCategory(category: string) {
    // Find all attractions of this category
    const attractions = await prisma.attraction.findMany({
      where: { category: category as any },
      select: { id: true },
    });

    if (attractions.length === 0) {
      return { success: true, message: `No attractions found with category: ${category}`, deleted: 0 };
    }

    const ids = attractions.map((a) => a.id);

    // Delete related records first
    await prisma.visit.deleteMany({ where: { attractionId: { in: ids } } });
    await prisma.favorite.deleteMany({ where: { attractionId: { in: ids } } });
    await prisma.review.deleteMany({ where: { attractionId: { in: ids } } });

    // Delete the attractions
    const result = await prisma.attraction.deleteMany({
      where: { category: category as any },
    });

    return {
      success: true,
      message: `Deleted ${result.count} attractions with category: ${category}`,
      deleted: result.count,
    };
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

  // ============ GOOGLE PLACES SEED ============

  async seedGooglePlaces(maxCities: number = 10) {
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }

    const EXCLUDED_TYPES = new Set([
      'bar', 'restaurant', 'night_club', 'liquor_store',
      'cafe', 'bakery', 'meal_delivery', 'meal_takeaway', 'food',
    ]);

    const typeMap: Record<string, string> = {
      'museum': 'museum',
      'art_gallery': 'museum',
      'park': 'park',
      'national_park': 'nature',
      'amusement_park': 'entertainment',
      'tourist_attraction': 'landmark',
      'point_of_interest': 'landmark',
      'church': 'religious',
      'hindu_temple': 'religious',
      'mosque': 'religious',
      'synagogue': 'religious',
      'place_of_worship': 'religious',
      'natural_feature': 'nature',
      'beach': 'beach',
      'zoo': 'nature',
      'aquarium': 'nature',
      'shopping_mall': 'shopping',
      'stadium': 'entertainment',
      'movie_theater': 'entertainment',
      'historical_landmark': 'historical',
      'monument': 'historical',
    };

    const mapGoogleTypeToCategory = (types: string[]): string | null => {
      for (const type of types) {
        if (EXCLUDED_TYPES.has(type)) return null;
      }
      for (const type of types) {
        if (typeMap[type]) return typeMap[type];
      }
      return 'landmark';
    };

    const getPhotoUrl = (photoName: string, maxWidth: number = 800): string => {
      return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
    };

    const searchAttractions = async (query: string, lat: number, lng: number, maxResults: number = 15): Promise<any[]> => {
      const url = 'https://places.googleapis.com/v1/places:searchText';
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 30000 } },
            maxResultCount: maxResults,
            languageCode: 'en',
          }),
        });
        if (!response.ok) return [];
        const data = await response.json() as { places?: any[] };
        return data.places || [];
      } catch {
        return [];
      }
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const SEARCH_QUERIES = [
      'famous landmarks and monuments in',
      'museums and galleries in',
      'parks and gardens in',
      'historical sites in',
      'nature reserves and wildlife in',
      'beaches and coastline in',
      'temples churches mosques in',
      'castles and palaces in',
      'viewpoints and scenic spots in',
      'archaeological sites in',
    ];

    const stats = { citiesProcessed: 0, citiesSkipped: 0, attractionsAdded: 0, attractionsSkipped: 0, apiCalls: 0 };

    // Get cities with their attraction counts
    const cities = await prisma.city.findMany({
      include: { country: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const citiesWithCounts = await Promise.all(
      cities.map(async (city) => {
        const count = await prisma.attraction.count({ where: { cityId: city.id } });
        return { ...city, attractionCount: count };
      })
    );

    // Sort by attraction count and limit
    citiesWithCounts.sort((a, b) => a.attractionCount - b.attractionCount);
    const citiesToProcess = citiesWithCounts.slice(0, maxCities);

    for (const city of citiesToProcess) {
      if (city.attractionCount >= 50) {
        stats.citiesSkipped++;
        continue;
      }

      const lat = city.latitude || 0;
      const lng = city.longitude || 0;
      if (!lat || !lng) {
        stats.citiesSkipped++;
        continue;
      }

      const seenPlaceIds = new Set<string>();

      for (const queryPrefix of SEARCH_QUERIES) {
        const query = `${queryPrefix} ${city.name}`;
        const places = await searchAttractions(query, lat, lng, 15);
        stats.apiCalls++;

        for (const place of places) {
          try {
            if (seenPlaceIds.has(place.id)) continue;
            seenPlaceIds.add(place.id);

            const placeName = place.displayName?.text || '';
            if (!placeName) continue;

            const category = mapGoogleTypeToCategory(place.types || []);
            if (category === null) {
              stats.attractionsSkipped++;
              continue;
            }

            const rating = place.rating || 0;
            const reviews = place.userRatingCount || 0;
            if (rating < 3.5 || reviews < 20) {
              stats.attractionsSkipped++;
              continue;
            }

            const existing = await prisma.attraction.findFirst({
              where: { name: placeName, cityId: city.id },
            });
            if (existing) continue;

            const images: string[] = [];
            let thumbnailUrl = '';
            if (place.photos && place.photos.length > 0) {
              thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
              for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
                images.push(getPhotoUrl(place.photos[i].name, 800));
              }
            }

            await prisma.attraction.create({
              data: {
                name: placeName,
                description: place.editorialSummary?.text || `A popular attraction in ${city.name}, ${city.country.name}`,
                shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${placeName} in ${city.name}`,
                category: category as any,
                cityId: city.id,
                latitude: place.location?.latitude || lat,
                longitude: place.location?.longitude || lng,
                address: place.formattedAddress || `${city.name}, ${city.country.name}`,
                images: images,
                thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300?text=No+Image',
                website: place.websiteUri || null,
                contactPhone: place.internationalPhoneNumber || null,
                averageRating: rating,
                totalReviews: reviews,
                isFree: false,
              },
            });

            stats.attractionsAdded++;
          } catch {
            // Skip this place on error
          }
        }

        await delay(250);
      }

      stats.citiesProcessed++;
      await delay(500);
    }

    const dbStats = {
      continents: await prisma.continent.count(),
      countries: await prisma.country.count(),
      cities: await prisma.city.count(),
      attractions: await prisma.attraction.count(),
    };

    return {
      success: true,
      stats,
      database: dbStats,
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
