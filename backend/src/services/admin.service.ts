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

  // ============ ADD LOCATION IMAGES ============

  async addLocationImages() {
    const COUNTRY_CODES: Record<string, string> = {
      'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
      'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ',
      'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Belgium': 'BE', 'Bhutan': 'BT',
      'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR',
      'Bulgaria': 'BG', 'Cambodia': 'KH', 'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL',
      'China': 'CN', 'Colombia': 'CO', 'Costa Rica': 'CR', 'Croatia': 'HR', 'Cuba': 'CU',
      'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK', 'Dominican Republic': 'DO',
      'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV', 'Estonia': 'EE', 'Ethiopia': 'ET',
      'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR', 'Georgia': 'GE', 'Germany': 'DE',
      'Ghana': 'GH', 'Greece': 'GR', 'Guatemala': 'GT', 'Honduras': 'HN', 'Hong Kong': 'HK',
      'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR',
      'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT', 'Jamaica': 'JM',
      'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW',
      'Laos': 'LA', 'Latvia': 'LV', 'Lebanon': 'LB', 'Lithuania': 'LT', 'Luxembourg': 'LU',
      'Macedonia': 'MK', 'North Macedonia': 'MK', 'Malaysia': 'MY', 'Maldives': 'MV', 'Malta': 'MT',
      'Mexico': 'MX', 'Moldova': 'MD', 'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME',
      'Morocco': 'MA', 'Myanmar': 'MM', 'Namibia': 'NA', 'Nepal': 'NP', 'Netherlands': 'NL',
      'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Nigeria': 'NG', 'Norway': 'NO', 'Oman': 'OM',
      'Pakistan': 'PK', 'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH',
      'Poland': 'PL', 'Portugal': 'PT', 'Puerto Rico': 'PR', 'Qatar': 'QA', 'Romania': 'RO',
      'Russia': 'RU', 'Saudi Arabia': 'SA', 'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK',
      'Slovenia': 'SI', 'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES', 'Sri Lanka': 'LK',
      'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH',
      'Tunisia': 'TN', 'Turkey': 'TR', 'Türkiye': 'TR', 'Uganda': 'UG', 'Ukraine': 'UA',
      'United Arab Emirates': 'AE', 'UAE': 'AE', 'United Kingdom': 'GB', 'UK': 'GB',
      'United States': 'US', 'USA': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Vatican City': 'VA',
      'Venezuela': 'VE', 'Vietnam': 'VN', 'Zimbabwe': 'ZW',
    };

    const CONTINENT_IMAGES: Record<string, string> = {
      'Africa': 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
      'Asia': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800',
      'Europe': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
      'North America': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800',
      'South America': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      'Oceania': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
      'Antarctica': 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?w=800',
    };

    // Curated city images from Unsplash (iconic landmarks/skylines)
    const CITY_IMAGES: Record<string, string> = {
      // Europe
      'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
      'Prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
      'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800',
      'Berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
      'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
      'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
      'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
      'Venice': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800',
      'Florence': 'https://images.unsplash.com/photo-1543429258-c5ca3f4d5c4c?w=800',
      'Milan': 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=800',
      'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800',
      'Budapest': 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800',
      'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800',
      'Edinburgh': 'https://images.unsplash.com/photo-1506377585622-bedcbb5f8551?w=800',
      'Stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
      'Copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
      'Oslo': 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=800',
      'Helsinki': 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800',
      'Reykjavik': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
      'Brussels': 'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800',
      'Zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800',
      'Geneva': 'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=800',
      'Warsaw': 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800',
      'Krakow': 'https://images.unsplash.com/photo-1574236170878-f66e35f83207?w=800',
      'Nice': 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=800',
      'Santorini': 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      'Dubrovnik': 'https://images.unsplash.com/photo-1555990538-1d0d0d37d60c?w=800',
      'Split': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
      'Salzburg': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800',
      'Porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
      'Seville': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
      'Valencia': 'https://images.unsplash.com/photo-1599561046251-bfb9465b4c44?w=800',
      'Bucharest': 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800',
      'Ljubljana': 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800',
      'Riga': 'https://images.unsplash.com/photo-1539180412834-bd8f61da01ee?w=800',
      'Vilnius': 'https://images.unsplash.com/photo-1549990476-a2e5a0ed6769?w=800',
      'Tallinn': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
      'Tirana': 'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=800',
      'Kotor': 'https://images.unsplash.com/photo-1555990538-1d0d0d37d60c?w=800',
      // Asia
      'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800',
      'Seoul': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800',
      'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
      'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
      'Shanghai': 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800',
      'Beijing': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
      'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      'Mumbai': 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800',
      'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
      'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      'Hanoi': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'Ho Chi Minh City': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'Kuala Lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
      'Taipei': 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800',
      'Manila': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
      'Jakarta': 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800',
      'Tel Aviv': 'https://images.unsplash.com/photo-1544629885-a0f5e1efb53e?w=800',
      'Jerusalem': 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800',
      'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
      'Kathmandu': 'https://images.unsplash.com/photo-1558799401-1dcba79f0a0a?w=800',
      'Jaipur': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800',
      'Varanasi': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800',
      'Siem Reap': 'https://images.unsplash.com/photo-1539667547529-a5a2ea7e5f60?w=800',
      'Chiang Mai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
      'Phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
      // North America
      'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
      'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
      'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'Chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800',
      'Miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800',
      'Las Vegas': 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=800',
      'Washington DC': 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=800',
      'Boston': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800',
      'Seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800',
      'Toronto': 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800',
      'Vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800',
      'Montreal': 'https://images.unsplash.com/photo-1519178614-68673b201f36?w=800',
      'Mexico City': 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=800',
      'Cancun': 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800',
      'Havana': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=800',
      // South America
      'Rio de Janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      'Buenos Aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800',
      'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800',
      'Cusco': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
      'Bogota': 'https://images.unsplash.com/photo-1536086845232-16c09eba7e70?w=800',
      'Cartagena': 'https://images.unsplash.com/photo-1583531172005-814892e68f84?w=800',
      'Santiago': 'https://images.unsplash.com/photo-1510253687831-0f982d5e8411?w=800',
      'Sao Paulo': 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=800',
      'Quito': 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800',
      // Oceania
      'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
      'Melbourne': 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800',
      'Auckland': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800',
      'Queenstown': 'https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?w=800',
      // Africa
      'Cape Town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
      'Marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800',
      'Cairo': 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
      'Nairobi': 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800',
      'Zanzibar': 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800',
      'Casablanca': 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=800',
      'Fes': 'https://images.unsplash.com/photo-1548017534-5b7b4e08b9f1?w=800',
      'Luxor': 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800',
      'Victoria Falls': 'https://images.unsplash.com/photo-1568093858174-0f391ea21c45?w=800',
    };

    // Update countries with flags
    const countries = await prisma.country.findMany();
    let countriesUpdated = 0;
    for (const country of countries) {
      const code = COUNTRY_CODES[country.name] || country.code;
      if (code) {
        const flagUrl = `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
        await prisma.country.update({
          where: { id: country.id },
          data: { flagUrl, code: code.toUpperCase() },
        });
        countriesUpdated++;
      }
    }

    // Update cities with curated images (fallback to Unsplash source for unknown cities)
    const cities = await prisma.city.findMany();
    for (const city of cities) {
      // Use curated image if available, otherwise use Unsplash source search
      const imageUrl = CITY_IMAGES[city.name] ||
        `https://source.unsplash.com/800x600/?${encodeURIComponent(city.name + ' city skyline')}`;
      await prisma.city.update({
        where: { id: city.id },
        data: { imageUrl },
      });
    }

    // Update continents with images
    const continents = await prisma.continent.findMany();
    for (const continent of continents) {
      const imageUrl = CONTINENT_IMAGES[continent.name] || `https://picsum.photos/seed/${continent.name}/800/600`;
      await prisma.continent.update({
        where: { id: continent.id },
        data: { imageUrl },
      });
    }

    return {
      success: true,
      updated: {
        countries: countriesUpdated,
        cities: cities.length,
        continents: continents.length,
      },
    };
  }

  // ============ USA SEEDING ============

  async seedUSA() {
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }

    // USA cities to seed
    const USA_CITIES = [
      { name: 'Washington DC', state: 'DC', lat: 38.9072, lng: -77.0369 },
      { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
      { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
      { name: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
      { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
      { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
      { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
      { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
      { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
      { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
      { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
      { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
      { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
      { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
      { name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 },
      { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
      { name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
      { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
      { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
      { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
      { name: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
      { name: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994 },
      { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
      { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
      { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
      { name: 'Savannah', state: 'GA', lat: 32.0809, lng: -81.0912 },
      { name: 'Charleston', state: 'SC', lat: 32.7765, lng: -79.9311 },
      { name: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490 },
      { name: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
      { name: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003 },
      { name: 'Key West', state: 'FL', lat: 24.5551, lng: -81.7800 },
      { name: 'Santa Fe', state: 'NM', lat: 35.6870, lng: -105.9378 },
      { name: 'Sedona', state: 'AZ', lat: 34.8697, lng: -111.7610 },
      { name: 'Asheville', state: 'NC', lat: 35.5951, lng: -82.5515 },
      { name: 'Napa', state: 'CA', lat: 38.2975, lng: -122.2869 },
      { name: 'Santa Barbara', state: 'CA', lat: 34.4208, lng: -119.6982 },
      { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
      { name: 'Jackson Hole', state: 'WY', lat: 43.4799, lng: -110.7624 },
      { name: 'Aspen', state: 'CO', lat: 39.1911, lng: -106.8175 },
      { name: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
      { name: 'Newport', state: 'RI', lat: 41.4901, lng: -71.3128 },
      { name: 'Portland', state: 'ME', lat: 43.6591, lng: -70.2568 },
      // Batch 2 - More major cities
      { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
      { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
      { name: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.5120 },
      { name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
      { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
      { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
      { name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
      { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
      { name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
      { name: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784 },
      { name: 'Providence', state: 'RI', lat: 41.8240, lng: -71.4128 },
      { name: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585 },
      { name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
      { name: 'El Paso', state: 'TX', lat: 31.7619, lng: -106.4850 },
      { name: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214 },
      // Batch 3 - Resort and beach destinations
      { name: 'Palm Springs', state: 'CA', lat: 33.8303, lng: -116.5453 },
      { name: 'Monterey', state: 'CA', lat: 36.6002, lng: -121.8947 },
      { name: 'Carmel', state: 'CA', lat: 36.5552, lng: -121.9233 },
      { name: 'Maui', state: 'HI', lat: 20.7984, lng: -156.3319 },
      { name: 'St Augustine', state: 'FL', lat: 29.8978, lng: -81.3115 },
      { name: 'Vail', state: 'CO', lat: 39.6433, lng: -106.3781 },
      { name: 'Park City', state: 'UT', lat: 40.6461, lng: -111.4980 },
      { name: 'Sun Valley', state: 'ID', lat: 43.6966, lng: -114.3562 },
      { name: 'Bend', state: 'OR', lat: 44.0582, lng: -121.3153 },
      { name: 'Bar Harbor', state: 'ME', lat: 44.3876, lng: -68.2039 },
      { name: 'Cape Cod', state: 'MA', lat: 41.6688, lng: -70.2962 },
      { name: 'Hilton Head', state: 'SC', lat: 32.2163, lng: -80.7526 },
      { name: 'Myrtle Beach', state: 'SC', lat: 33.6891, lng: -78.8867 },
      { name: 'Palm Beach', state: 'FL', lat: 26.7056, lng: -80.0364 },
      { name: 'Naples', state: 'FL', lat: 26.1420, lng: -81.7948 },
      { name: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lng: -80.1373 },
      { name: 'Scottsdale', state: 'AZ', lat: 33.4942, lng: -111.9261 },
      { name: 'La Jolla', state: 'CA', lat: 32.8328, lng: -117.2713 },
      { name: 'Lake Tahoe', state: 'CA', lat: 39.0968, lng: -120.0324 },
      { name: 'Sarasota', state: 'FL', lat: 27.3364, lng: -82.5307 },
      { name: 'Clearwater', state: 'FL', lat: 27.9659, lng: -82.8001 },
      // Batch 4 - More popular tourist destinations
      { name: 'Williamsburg', state: 'VA', lat: 37.2707, lng: -76.7075 },
      { name: 'Annapolis', state: 'MD', lat: 38.9784, lng: -76.4922 },
      { name: 'Gettysburg', state: 'PA', lat: 39.8309, lng: -77.2311 },
      { name: 'Niagara Falls', state: 'NY', lat: 43.0962, lng: -79.0377 },
      { name: 'Yosemite', state: 'CA', lat: 37.8651, lng: -119.5383 },
      { name: 'Grand Canyon', state: 'AZ', lat: 36.0544, lng: -112.1401 },
      { name: 'Yellowstone', state: 'WY', lat: 44.4280, lng: -110.5885 },
      { name: 'Zion', state: 'UT', lat: 37.2982, lng: -113.0263 },
      { name: 'Bryce Canyon', state: 'UT', lat: 37.5930, lng: -112.1871 },
      { name: 'Moab', state: 'UT', lat: 38.5733, lng: -109.5498 },
      { name: 'Glacier National Park', state: 'MT', lat: 48.7596, lng: -113.7870 },
      { name: 'Acadia', state: 'ME', lat: 44.3386, lng: -68.2733 },
      { name: 'Nantucket', state: 'MA', lat: 41.2835, lng: -70.0995 },
      { name: 'Marthas Vineyard', state: 'MA', lat: 41.3916, lng: -70.6376 },
      { name: 'Lake Placid', state: 'NY', lat: 44.2795, lng: -73.9799 },
      { name: 'Branson', state: 'MO', lat: 36.6437, lng: -93.2185 },
      { name: 'Hot Springs', state: 'AR', lat: 34.5037, lng: -93.0552 },
      { name: 'Gatlinburg', state: 'TN', lat: 35.7143, lng: -83.5102 },
      { name: 'Pigeon Forge', state: 'TN', lat: 35.7884, lng: -83.5543 },
      { name: 'Destin', state: 'FL', lat: 30.3935, lng: -86.4958 },
      { name: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.9780 },
      { name: 'Atlantic City', state: 'NJ', lat: 39.3643, lng: -74.4229 },
      { name: 'Ocean City', state: 'MD', lat: 38.3365, lng: -75.0849 },
      { name: 'Rehoboth Beach', state: 'DE', lat: 38.7209, lng: -75.0760 },
      { name: 'Cape May', state: 'NJ', lat: 38.9351, lng: -74.9060 },
      { name: 'Long Beach', state: 'CA', lat: 33.7701, lng: -118.1937 },
      { name: 'Santa Monica', state: 'CA', lat: 34.0195, lng: -118.4912 },
      { name: 'Laguna Beach', state: 'CA', lat: 33.5427, lng: -117.7854 },
      { name: 'Pismo Beach', state: 'CA', lat: 35.1428, lng: -120.6413 },
      { name: 'Santa Cruz', state: 'CA', lat: 36.9741, lng: -122.0308 },
      { name: 'Mendocino', state: 'CA', lat: 39.3078, lng: -123.7988 },
      { name: 'Big Sur', state: 'CA', lat: 36.2704, lng: -121.8081 },
      { name: 'Solvang', state: 'CA', lat: 34.5958, lng: -120.1376 },
      { name: 'San Luis Obispo', state: 'CA', lat: 35.2828, lng: -120.6596 },
      { name: 'Santa Rosa', state: 'CA', lat: 38.4404, lng: -122.7141 },
      { name: 'Sonoma', state: 'CA', lat: 38.2919, lng: -122.4580 },
      { name: 'Healdsburg', state: 'CA', lat: 38.6110, lng: -122.8690 },
      { name: 'Telluride', state: 'CO', lat: 37.9375, lng: -107.8123 },
      { name: 'Breckenridge', state: 'CO', lat: 39.4817, lng: -106.0384 },
      { name: 'Steamboat Springs', state: 'CO', lat: 40.4850, lng: -106.8317 },
      // Batch 5 - Remaining major destinations
      { name: 'Taos', state: 'NM', lat: 36.4072, lng: -105.5731 },
      { name: 'Sedona', state: 'AZ', lat: 34.8697, lng: -111.7610 },
      { name: 'Flagstaff', state: 'AZ', lat: 35.1983, lng: -111.6513 },
      { name: 'Death Valley', state: 'CA', lat: 36.5054, lng: -117.0794 },
      { name: 'Joshua Tree', state: 'CA', lat: 33.8734, lng: -115.9010 },
      { name: 'Sequoia', state: 'CA', lat: 36.4864, lng: -118.5658 },
      { name: 'Olympic', state: 'WA', lat: 47.8021, lng: -123.6044 },
      { name: 'Crater Lake', state: 'OR', lat: 42.9446, lng: -122.1090 },
      { name: 'Mount Rainier', state: 'WA', lat: 46.8800, lng: -121.7269 },
      { name: 'Spokane', state: 'WA', lat: 47.6588, lng: -117.4260 },
      { name: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023 },
      { name: 'Missoula', state: 'MT', lat: 46.8721, lng: -114.0135 },
      { name: 'Billings', state: 'MT', lat: 45.7833, lng: -108.5007 },
      { name: 'Rapid City', state: 'SD', lat: 44.0805, lng: -103.2310 },
      { name: 'Mount Rushmore', state: 'SD', lat: 43.8791, lng: -103.4591 },
      { name: 'Badlands', state: 'SD', lat: 43.8554, lng: -102.3397 },
      { name: 'Sioux Falls', state: 'SD', lat: 43.5460, lng: -96.7313 },
      { name: 'Fargo', state: 'ND', lat: 46.8772, lng: -96.7898 },
      { name: 'Des Moines', state: 'IA', lat: 41.5868, lng: -93.6250 },
      { name: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345 },
      { name: 'Wichita', state: 'KS', lat: 37.6872, lng: -97.3301 },
      { name: 'Tulsa', state: 'OK', lat: 36.1540, lng: -95.9928 },
      { name: 'Little Rock', state: 'AR', lat: 34.7465, lng: -92.2896 },
      { name: 'Jackson', state: 'MS', lat: 32.2988, lng: -90.1848 },
      { name: 'Birmingham', state: 'AL', lat: 33.5207, lng: -86.8025 },
      { name: 'Montgomery', state: 'AL', lat: 32.3792, lng: -86.3077 },
      { name: 'Mobile', state: 'AL', lat: 30.6954, lng: -88.0399 },
      { name: 'Pensacola', state: 'FL', lat: 30.4213, lng: -87.2169 },
      { name: 'Biloxi', state: 'MS', lat: 30.3960, lng: -88.8853 },
      { name: 'Baton Rouge', state: 'LA', lat: 30.4515, lng: -91.1871 },
      { name: 'Lafayette', state: 'LA', lat: 30.2241, lng: -92.0198 },
      { name: 'Corpus Christi', state: 'TX', lat: 27.8006, lng: -97.3964 },
      { name: 'Galveston', state: 'TX', lat: 29.3013, lng: -94.7977 },
      { name: 'South Padre Island', state: 'TX', lat: 26.1118, lng: -97.1681 },
      { name: 'Big Bend', state: 'TX', lat: 29.2500, lng: -103.2500 },
      { name: 'San Marcos', state: 'TX', lat: 29.8833, lng: -97.9414 },
      { name: 'Fredericksburg', state: 'TX', lat: 30.2752, lng: -98.8720 },
      { name: 'Marfa', state: 'TX', lat: 30.3096, lng: -104.0219 },
      // Batch 6 - Alaska & Hawaii
      { name: 'Juneau', state: 'AK', lat: 58.3019, lng: -134.4197 },
      { name: 'Fairbanks', state: 'AK', lat: 64.8378, lng: -147.7164 },
      { name: 'Denali', state: 'AK', lat: 63.1148, lng: -151.1926 },
      { name: 'Sitka', state: 'AK', lat: 57.0531, lng: -135.3300 },
      { name: 'Ketchikan', state: 'AK', lat: 55.3422, lng: -131.6461 },
      { name: 'Skagway', state: 'AK', lat: 59.4583, lng: -135.3139 },
      { name: 'Kauai', state: 'HI', lat: 22.0964, lng: -159.5261 },
      { name: 'Big Island', state: 'HI', lat: 19.5429, lng: -155.6659 },
      { name: 'Lanai', state: 'HI', lat: 20.8314, lng: -156.9261 },
      { name: 'Molokai', state: 'HI', lat: 21.1333, lng: -157.0167 },
      // Batch 7 - New England
      { name: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121 },
      { name: 'Stowe', state: 'VT', lat: 44.4654, lng: -72.6874 },
      { name: 'Manchester', state: 'VT', lat: 43.1637, lng: -73.0723 },
      { name: 'Woodstock', state: 'VT', lat: 43.6245, lng: -72.5185 },
      { name: 'Portsmouth', state: 'NH', lat: 43.0718, lng: -70.7626 },
      { name: 'North Conway', state: 'NH', lat: 44.0537, lng: -71.1284 },
      { name: 'Kennebunkport', state: 'ME', lat: 43.3615, lng: -70.4767 },
      { name: 'Camden', state: 'ME', lat: 44.2098, lng: -69.0648 },
      { name: 'Rockland', state: 'ME', lat: 44.1037, lng: -69.1089 },
      { name: 'Ogunquit', state: 'ME', lat: 43.2487, lng: -70.5939 },
      { name: 'Provincetown', state: 'MA', lat: 42.0584, lng: -70.1786 },
      { name: 'Salem', state: 'MA', lat: 42.5195, lng: -70.8967 },
      { name: 'Plymouth', state: 'MA', lat: 41.9584, lng: -70.6673 },
      { name: 'Stockbridge', state: 'MA', lat: 42.2876, lng: -73.3218 },
      { name: 'Lenox', state: 'MA', lat: 42.3584, lng: -73.2854 },
      { name: 'Mystic', state: 'CT', lat: 41.3543, lng: -71.9662 },
      { name: 'Essex', state: 'CT', lat: 41.3526, lng: -72.3884 },
      { name: 'Watch Hill', state: 'RI', lat: 41.3040, lng: -71.8587 },
      { name: 'Block Island', state: 'RI', lat: 41.1725, lng: -71.5780 },
      // Batch 8 - College towns
      { name: 'Ann Arbor', state: 'MI', lat: 42.2808, lng: -83.7430 },
      { name: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012 },
      { name: 'Chapel Hill', state: 'NC', lat: 35.9132, lng: -79.0558 },
      { name: 'Charlottesville', state: 'VA', lat: 38.0293, lng: -78.4767 },
      { name: 'Ithaca', state: 'NY', lat: 42.4440, lng: -76.5019 },
      { name: 'Princeton', state: 'NJ', lat: 40.3573, lng: -74.6672 },
      { name: 'New Haven', state: 'CT', lat: 41.3083, lng: -72.9279 },
      { name: 'Cambridge', state: 'MA', lat: 42.3736, lng: -71.1097 },
      { name: 'Berkeley', state: 'CA', lat: 37.8716, lng: -122.2727 },
      { name: 'Palo Alto', state: 'CA', lat: 37.4419, lng: -122.1430 },
      { name: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
      { name: 'Eugene', state: 'OR', lat: 44.0521, lng: -123.0868 },
      { name: 'Bloomington', state: 'IN', lat: 39.1653, lng: -86.5264 },
      { name: 'State College', state: 'PA', lat: 40.7934, lng: -77.8600 },
      { name: 'Athens', state: 'GA', lat: 33.9519, lng: -83.3576 },
      { name: 'Gainesville', state: 'FL', lat: 29.6516, lng: -82.3248 },
      // Batch 9 - Pacific Northwest & West
      { name: 'Bellingham', state: 'WA', lat: 48.7519, lng: -122.4787 },
      { name: 'Olympia', state: 'WA', lat: 47.0379, lng: -122.9007 },
      { name: 'Tacoma', state: 'WA', lat: 47.2529, lng: -122.4443 },
      { name: 'Walla Walla', state: 'WA', lat: 46.0646, lng: -118.3430 },
      { name: 'Leavenworth', state: 'WA', lat: 47.5962, lng: -120.6615 },
      { name: 'Friday Harbor', state: 'WA', lat: 48.5343, lng: -123.0170 },
      { name: 'Astoria', state: 'OR', lat: 46.1879, lng: -123.8313 },
      { name: 'Hood River', state: 'OR', lat: 45.7054, lng: -121.5215 },
      { name: 'Ashland', state: 'OR', lat: 42.1946, lng: -122.7095 },
      { name: 'Cannon Beach', state: 'OR', lat: 45.8918, lng: -123.9615 },
      { name: 'Newport', state: 'OR', lat: 44.6368, lng: -124.0535 },
      { name: 'Coeur d Alene', state: 'ID', lat: 47.6777, lng: -116.7805 },
      { name: 'McCall', state: 'ID', lat: 44.9110, lng: -116.0988 },
      { name: 'Sandpoint', state: 'ID', lat: 48.2766, lng: -116.5533 },
      { name: 'Whitefish', state: 'MT', lat: 48.4111, lng: -114.3528 },
      { name: 'Bozeman', state: 'MT', lat: 45.6770, lng: -111.0429 },
      { name: 'Helena', state: 'MT', lat: 46.5891, lng: -112.0391 },
      // Batch 10 - More California
      { name: 'Eureka', state: 'CA', lat: 40.8021, lng: -124.1637 },
      { name: 'Redding', state: 'CA', lat: 40.5865, lng: -122.3917 },
      { name: 'Chico', state: 'CA', lat: 39.7285, lng: -121.8375 },
      { name: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871 },
      { name: 'Bakersfield', state: 'CA', lat: 35.3733, lng: -119.0187 },
      { name: 'Ventura', state: 'CA', lat: 34.2805, lng: -119.2945 },
      { name: 'Oxnard', state: 'CA', lat: 34.1975, lng: -119.1771 },
      { name: 'Thousand Oaks', state: 'CA', lat: 34.1706, lng: -118.8376 },
      { name: 'Pasadena', state: 'CA', lat: 34.1478, lng: -118.1445 },
      { name: 'Riverside', state: 'CA', lat: 33.9806, lng: -117.3755 },
      { name: 'Anaheim', state: 'CA', lat: 33.8366, lng: -117.9143 },
      { name: 'Irvine', state: 'CA', lat: 33.6846, lng: -117.8265 },
      { name: 'Temecula', state: 'CA', lat: 33.4936, lng: -117.1484 },
      { name: 'Catalina Island', state: 'CA', lat: 33.3894, lng: -118.4160 },
      { name: 'Channel Islands', state: 'CA', lat: 34.0069, lng: -119.7785 },
      // Batch 11 - Southwest & Mountain West
      { name: 'Las Cruces', state: 'NM', lat: 32.3199, lng: -106.7637 },
      { name: 'Roswell', state: 'NM', lat: 33.3943, lng: -104.5230 },
      { name: 'Carlsbad', state: 'NM', lat: 32.4207, lng: -104.2288 },
      { name: 'White Sands', state: 'NM', lat: 32.7872, lng: -106.3257 },
      { name: 'Durango', state: 'CO', lat: 37.2753, lng: -107.8801 },
      { name: 'Ouray', state: 'CO', lat: 38.0228, lng: -107.6714 },
      { name: 'Crested Butte', state: 'CO', lat: 38.8697, lng: -106.9878 },
      { name: 'Glenwood Springs', state: 'CO', lat: 39.5508, lng: -107.3248 },
      { name: 'Estes Park', state: 'CO', lat: 40.3772, lng: -105.5217 },
      { name: 'Pagosa Springs', state: 'CO', lat: 37.2694, lng: -107.0098 },
      { name: 'Mesa Verde', state: 'CO', lat: 37.1853, lng: -108.4862 },
      { name: 'Black Canyon', state: 'CO', lat: 38.5754, lng: -107.7416 },
      { name: 'Great Sand Dunes', state: 'CO', lat: 37.7916, lng: -105.5943 },
      { name: 'St George', state: 'UT', lat: 37.0965, lng: -113.5684 },
      { name: 'Kanab', state: 'UT', lat: 37.0475, lng: -112.5263 },
      { name: 'Cedar City', state: 'UT', lat: 37.6775, lng: -113.0619 },
      { name: 'Capitol Reef', state: 'UT', lat: 38.2972, lng: -111.2615 },
      { name: 'Arches', state: 'UT', lat: 38.7331, lng: -109.5925 },
      { name: 'Canyonlands', state: 'UT', lat: 38.3269, lng: -109.8783 },
      { name: 'Monument Valley', state: 'AZ', lat: 36.9980, lng: -110.0985 },
      { name: 'Page', state: 'AZ', lat: 36.9147, lng: -111.4558 },
      { name: 'Lake Powell', state: 'AZ', lat: 37.0683, lng: -111.2433 },
      { name: 'Antelope Canyon', state: 'AZ', lat: 36.8619, lng: -111.3743 },
      { name: 'Petrified Forest', state: 'AZ', lat: 35.0657, lng: -109.7890 },
      { name: 'Saguaro', state: 'AZ', lat: 32.2967, lng: -111.1666 },
      { name: 'Tombstone', state: 'AZ', lat: 31.7129, lng: -110.0676 },
      { name: 'Bisbee', state: 'AZ', lat: 31.4484, lng: -109.9284 },
      { name: 'Jerome', state: 'AZ', lat: 34.7489, lng: -112.1138 },
      { name: 'Prescott', state: 'AZ', lat: 34.5400, lng: -112.4685 },
      // Batch 12 - More Southeast
      { name: 'Chattanooga', state: 'TN', lat: 35.0456, lng: -85.3097 },
      { name: 'Knoxville', state: 'TN', lat: 35.9606, lng: -83.9207 },
      { name: 'Lexington', state: 'KY', lat: 38.0406, lng: -84.5037 },
      { name: 'Bowling Green', state: 'KY', lat: 36.9685, lng: -86.4808 },
      { name: 'Mammoth Cave', state: 'KY', lat: 37.1870, lng: -86.1008 },
      { name: 'Ashland', state: 'KY', lat: 38.4784, lng: -82.6379 },
      { name: 'Greenville', state: 'SC', lat: 34.8526, lng: -82.3940 },
      { name: 'Columbia', state: 'SC', lat: 34.0007, lng: -81.0348 },
      { name: 'Beaufort', state: 'SC', lat: 32.4316, lng: -80.6698 },
      { name: 'Wilmington', state: 'NC', lat: 34.2257, lng: -77.9447 },
      { name: 'Outer Banks', state: 'NC', lat: 35.9582, lng: -75.6201 },
      { name: 'Durham', state: 'NC', lat: 35.9940, lng: -78.8986 },
      { name: 'Winston Salem', state: 'NC', lat: 36.0999, lng: -80.2442 },
      { name: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.4360 },
      { name: 'Norfolk', state: 'VA', lat: 36.8508, lng: -76.2859 },
      { name: 'Roanoke', state: 'VA', lat: 37.2710, lng: -79.9414 },
      { name: 'Shenandoah', state: 'VA', lat: 38.2928, lng: -78.6796 },
      { name: 'Luray', state: 'VA', lat: 38.6651, lng: -78.4594 },
      { name: 'Staunton', state: 'VA', lat: 38.1496, lng: -79.0717 },
      { name: 'Lexington', state: 'VA', lat: 37.7840, lng: -79.4428 },
      // Batch 13 - More Midwest
      { name: 'Grand Rapids', state: 'MI', lat: 42.9634, lng: -85.6681 },
      { name: 'Traverse City', state: 'MI', lat: 44.7631, lng: -85.6206 },
      { name: 'Mackinac Island', state: 'MI', lat: 45.8492, lng: -84.6189 },
      { name: 'Saugatuck', state: 'MI', lat: 42.6553, lng: -86.2014 },
      { name: 'Holland', state: 'MI', lat: 42.7876, lng: -86.1089 },
      { name: 'Petoskey', state: 'MI', lat: 45.3733, lng: -84.9553 },
      { name: 'Marquette', state: 'MI', lat: 46.5436, lng: -87.3954 },
      { name: 'Green Bay', state: 'WI', lat: 44.5133, lng: -88.0133 },
      { name: 'Door County', state: 'WI', lat: 45.0536, lng: -87.1525 },
      { name: 'Wisconsin Dells', state: 'WI', lat: 43.6275, lng: -89.7710 },
      { name: 'La Crosse', state: 'WI', lat: 43.8014, lng: -91.2396 },
      { name: 'Duluth', state: 'MN', lat: 46.7867, lng: -92.1005 },
      { name: 'Rochester', state: 'MN', lat: 44.0121, lng: -92.4802 },
      { name: 'Stillwater', state: 'MN', lat: 45.0564, lng: -92.8063 },
      { name: 'Boundary Waters', state: 'MN', lat: 48.0000, lng: -91.5000 },
      { name: 'Voyageurs', state: 'MN', lat: 48.5000, lng: -92.8833 },
      { name: 'Theodore Roosevelt', state: 'ND', lat: 46.9790, lng: -103.5387 },
      { name: 'Bismarck', state: 'ND', lat: 46.8083, lng: -100.7837 },
      { name: 'Deadwood', state: 'SD', lat: 44.3767, lng: -103.7296 },
      { name: 'Custer', state: 'SD', lat: 43.7669, lng: -103.5988 },
      { name: 'Wind Cave', state: 'SD', lat: 43.5579, lng: -103.4839 },
      // Batch 14 - More Florida
      { name: 'West Palm Beach', state: 'FL', lat: 26.7153, lng: -80.0534 },
      { name: 'Boca Raton', state: 'FL', lat: 26.3587, lng: -80.0831 },
      { name: 'Delray Beach', state: 'FL', lat: 26.4615, lng: -80.0728 },
      { name: 'Jupiter', state: 'FL', lat: 26.9342, lng: -80.0942 },
      { name: 'Stuart', state: 'FL', lat: 27.1976, lng: -80.2528 },
      { name: 'Vero Beach', state: 'FL', lat: 27.6386, lng: -80.3973 },
      { name: 'Melbourne', state: 'FL', lat: 28.0836, lng: -80.6081 },
      { name: 'Cocoa Beach', state: 'FL', lat: 28.3200, lng: -80.6076 },
      { name: 'Cape Canaveral', state: 'FL', lat: 28.3922, lng: -80.6077 },
      { name: 'Daytona Beach', state: 'FL', lat: 29.2108, lng: -81.0228 },
      { name: 'St Petersburg', state: 'FL', lat: 27.7676, lng: -82.6403 },
      { name: 'Bradenton', state: 'FL', lat: 27.4989, lng: -82.5748 },
      { name: 'Fort Myers', state: 'FL', lat: 26.6406, lng: -81.8723 },
      { name: 'Sanibel Island', state: 'FL', lat: 26.4390, lng: -82.1070 },
      { name: 'Marco Island', state: 'FL', lat: 25.9412, lng: -81.7184 },
      { name: 'Everglades', state: 'FL', lat: 25.2866, lng: -80.8987 },
      { name: 'Dry Tortugas', state: 'FL', lat: 24.6285, lng: -82.8732 },
      { name: 'Amelia Island', state: 'FL', lat: 30.6169, lng: -81.4448 },
      { name: 'St Simons Island', state: 'GA', lat: 31.1503, lng: -81.3733 },
      { name: 'Jekyll Island', state: 'GA', lat: 31.0663, lng: -81.4145 },
      { name: 'Tybee Island', state: 'GA', lat: 32.0022, lng: -80.8473 },
      // Batch 15 - Northeast & Mid-Atlantic
      { name: 'Albany', state: 'NY', lat: 42.6526, lng: -73.7562 },
      { name: 'Saratoga Springs', state: 'NY', lat: 43.0831, lng: -73.7846 },
      { name: 'Hudson', state: 'NY', lat: 42.2529, lng: -73.7907 },
      { name: 'Woodstock', state: 'NY', lat: 42.0409, lng: -74.1182 },
      { name: 'Catskills', state: 'NY', lat: 42.0982, lng: -74.3157 },
      { name: 'Finger Lakes', state: 'NY', lat: 42.6212, lng: -76.8305 },
      { name: 'Cooperstown', state: 'NY', lat: 42.7003, lng: -74.9243 },
      { name: 'Thousand Islands', state: 'NY', lat: 44.3017, lng: -75.9259 },
      { name: 'Fire Island', state: 'NY', lat: 40.6479, lng: -73.1468 },
      { name: 'Montauk', state: 'NY', lat: 41.0359, lng: -71.9545 },
      { name: 'Hamptons', state: 'NY', lat: 40.9640, lng: -72.1848 },
      { name: 'Cold Spring', state: 'NY', lat: 41.4201, lng: -73.9546 },
      { name: 'Beacon', state: 'NY', lat: 41.5043, lng: -73.9696 },
      { name: 'Rhinebeck', state: 'NY', lat: 41.9270, lng: -73.9126 },
      { name: 'Lancaster', state: 'PA', lat: 40.0379, lng: -76.3055 },
      { name: 'Hershey', state: 'PA', lat: 40.2859, lng: -76.6505 },
      { name: 'Bethlehem', state: 'PA', lat: 40.6259, lng: -75.3705 },
      { name: 'Pocono', state: 'PA', lat: 41.0976, lng: -75.1968 },
      { name: 'Jim Thorpe', state: 'PA', lat: 40.8759, lng: -75.7324 },
      { name: 'New Hope', state: 'PA', lat: 40.3643, lng: -74.9513 },
      { name: 'Cape Charles', state: 'VA', lat: 37.2676, lng: -76.0169 },
      { name: 'Chincoteague', state: 'VA', lat: 37.9332, lng: -75.3788 },
      { name: 'Lewes', state: 'DE', lat: 38.7746, lng: -75.1393 },
      { name: 'Bethany Beach', state: 'DE', lat: 38.5396, lng: -75.0552 },
      { name: 'Cape Henlopen', state: 'DE', lat: 38.8002, lng: -75.0891 },
      { name: 'Asbury Park', state: 'NJ', lat: 40.2201, lng: -74.0121 },
      { name: 'Spring Lake', state: 'NJ', lat: 40.1526, lng: -74.0279 },
      { name: 'Long Beach Island', state: 'NJ', lat: 39.6351, lng: -74.1865 },
      { name: 'Stone Harbor', state: 'NJ', lat: 39.0518, lng: -74.7593 },
      { name: 'Wildwood', state: 'NJ', lat: 38.9918, lng: -74.8149 },
    ];

    const EXCLUDED_TYPES = new Set([
      'bar', 'restaurant', 'night_club', 'liquor_store',
      'cafe', 'bakery', 'meal_delivery', 'meal_takeaway', 'food', 'lodging', 'hotel',
    ]);

    const typeMap: Record<string, string> = {
      'museum': 'museum', 'art_gallery': 'museum', 'park': 'park',
      'national_park': 'nature', 'amusement_park': 'entertainment',
      'tourist_attraction': 'landmark', 'point_of_interest': 'landmark',
      'church': 'religious', 'place_of_worship': 'religious',
      'natural_feature': 'nature', 'beach': 'beach', 'zoo': 'nature',
      'aquarium': 'nature', 'stadium': 'entertainment',
      'historical_landmark': 'historical', 'monument': 'historical',
    };

    const mapCategory = (types: string[]): string | null => {
      for (const type of types) if (EXCLUDED_TYPES.has(type)) return null;
      for (const type of types) if (typeMap[type]) return typeMap[type];
      return 'landmark';
    };

    const getPhotoUrl = (photoName: string, maxWidth: number = 800): string => {
      return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
    };

    const searchAttractions = async (query: string, lat: number, lng: number): Promise<any[]> => {
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 30000 } },
            maxResultCount: 20,
            languageCode: 'en',
          }),
        });
        if (!response.ok) return [];
        const data = await response.json() as { places?: any[] };
        return data.places || [];
      } catch { return []; }
    };

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Find USA
    const usa = await prisma.country.findFirst({
      where: { OR: [{ name: 'United States' }, { code: 'US' }] }
    });
    if (!usa) throw new Error('USA not found in database');

    const stats = { citiesCreated: 0, citiesProcessed: 0, attractionsAdded: 0 };

    const SEARCH_QUERIES = [
      'famous tourist attractions in',
      'historic landmarks in',
      'museums in',
      'popular things to do in',
      'parks and nature in',
      'monuments in',
    ];

    for (const cityData of USA_CITIES) {
      // Find or create city
      let city = await prisma.city.findFirst({
        where: { name: cityData.name, countryId: usa.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityData.name,
            countryId: usa.id,
            latitude: cityData.lat,
            longitude: cityData.lng,
          }
        });
        stats.citiesCreated++;
      }

      // Check current count
      const currentCount = await prisma.attraction.count({ where: { cityId: city.id } });
      if (currentCount >= 50) {
        stats.citiesProcessed++;
        continue;
      }

      const addedNames = new Set<string>();
      const existing = await prisma.attraction.findMany({
        where: { cityId: city.id },
        select: { name: true }
      });
      existing.forEach(a => addedNames.add(a.name.toLowerCase()));

      let cityAdded = 0;
      for (const queryPrefix of SEARCH_QUERIES) {
        if (cityAdded >= 50) break;

        const query = `${queryPrefix} ${cityData.name} ${cityData.state}`;
        const places = await searchAttractions(query, cityData.lat, cityData.lng);

        for (const place of places) {
          if (cityAdded >= 60) break;

          const name = place.displayName?.text || '';
          if (!name || addedNames.has(name.toLowerCase())) continue;

          const category = mapCategory(place.types || []);
          if (!category) continue;

          const rating = place.rating || 0;
          if (rating < 3.5) continue;

          const images: string[] = [];
          let thumbnailUrl = '';
          if (place.photos?.length > 0) {
            thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
            for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
              images.push(getPhotoUrl(place.photos[i].name, 800));
            }
          }

          try {
            await prisma.attraction.create({
              data: {
                name,
                description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}, ${cityData.state}.`,
                shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in ${cityData.name}`,
                category: category as any,
                cityId: city.id,
                latitude: place.location?.latitude || cityData.lat,
                longitude: place.location?.longitude || cityData.lng,
                address: place.formattedAddress || `${cityData.name}, ${cityData.state}`,
                images,
                thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300',
                website: place.websiteUri || null,
                contactPhone: place.internationalPhoneNumber || null,
                averageRating: rating,
                totalReviews: place.userRatingCount || 0,
                isFree: false,
              },
            });
            addedNames.add(name.toLowerCase());
            cityAdded++;
            stats.attractionsAdded++;
          } catch { /* skip duplicates */ }
        }
        await delay(200);
      }
      stats.citiesProcessed++;
      await delay(300);
    }

    const totalUSA = await prisma.attraction.count({
      where: { city: { countryId: usa.id } }
    });

    const usaCities = await prisma.city.count({
      where: { countryId: usa.id }
    });

    return {
      success: true,
      stats,
      totals: {
        usaCities,
        usaAttractions: totalUSA,
      },
    };
  }

  async seedEurope(startIndex: number = 0, batchSize: number = 20) {
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }

    // European cities to seed - comprehensive list by country
    const ALL_EUROPE_CITIES: { name: string; country: string; lat: number; lng: number }[] = [
      // United Kingdom
      { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
      { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lng: -3.1883 },
      { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
      { name: 'Liverpool', country: 'United Kingdom', lat: 53.4084, lng: -2.9916 },
      { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
      { name: 'Glasgow', country: 'United Kingdom', lat: 55.8642, lng: -4.2518 },
      { name: 'Bristol', country: 'United Kingdom', lat: 51.4545, lng: -2.5879 },
      { name: 'Oxford', country: 'United Kingdom', lat: 51.7520, lng: -1.2577 },
      { name: 'Cambridge', country: 'United Kingdom', lat: 52.2053, lng: 0.1218 },
      { name: 'Bath', country: 'United Kingdom', lat: 51.3811, lng: -2.3590 },
      { name: 'York', country: 'United Kingdom', lat: 53.9600, lng: -1.0873 },
      { name: 'Brighton', country: 'United Kingdom', lat: 50.8225, lng: -0.1372 },
      { name: 'Canterbury', country: 'United Kingdom', lat: 51.2802, lng: 1.0789 },
      { name: 'Stratford-upon-Avon', country: 'United Kingdom', lat: 52.1917, lng: -1.7083 },
      { name: 'Windsor', country: 'United Kingdom', lat: 51.4839, lng: -0.6044 },
      { name: 'Stonehenge', country: 'United Kingdom', lat: 51.1789, lng: -1.8262 },
      { name: 'Lake District', country: 'United Kingdom', lat: 54.4609, lng: -3.0886 },
      { name: 'Cornwall', country: 'United Kingdom', lat: 50.2660, lng: -5.0527 },
      { name: 'Cotswolds', country: 'United Kingdom', lat: 51.8330, lng: -1.8433 },
      { name: 'Belfast', country: 'United Kingdom', lat: 54.5973, lng: -5.9301 },
      // France
      { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
      { name: 'Nice', country: 'France', lat: 43.7102, lng: 7.2620 },
      { name: 'Lyon', country: 'France', lat: 45.7640, lng: 4.8357 },
      { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
      { name: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792 },
      { name: 'Strasbourg', country: 'France', lat: 48.5734, lng: 7.7521 },
      { name: 'Toulouse', country: 'France', lat: 43.6047, lng: 1.4442 },
      { name: 'Cannes', country: 'France', lat: 43.5528, lng: 7.0174 },
      { name: 'Monaco', country: 'France', lat: 43.7384, lng: 7.4246 },
      { name: 'Mont Saint-Michel', country: 'France', lat: 48.6361, lng: -1.5115 },
      { name: 'Avignon', country: 'France', lat: 43.9493, lng: 4.8055 },
      { name: 'Normandy', country: 'France', lat: 49.1829, lng: -0.3707 },
      { name: 'Versailles', country: 'France', lat: 48.8049, lng: 2.1204 },
      { name: 'Provence', country: 'France', lat: 43.9352, lng: 6.0679 },
      { name: 'Chamonix', country: 'France', lat: 45.9237, lng: 6.8694 },
      { name: 'Saint-Tropez', country: 'France', lat: 43.2727, lng: 6.6407 },
      { name: 'Nantes', country: 'France', lat: 47.2184, lng: -1.5536 },
      { name: 'Lille', country: 'France', lat: 50.6292, lng: 3.0573 },
      // Italy
      { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
      { name: 'Venice', country: 'Italy', lat: 45.4408, lng: 12.3155 },
      { name: 'Florence', country: 'Italy', lat: 43.7696, lng: 11.2558 },
      { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900 },
      { name: 'Naples', country: 'Italy', lat: 40.8518, lng: 14.2681 },
      { name: 'Amalfi Coast', country: 'Italy', lat: 40.6340, lng: 14.6027 },
      { name: 'Cinque Terre', country: 'Italy', lat: 44.1461, lng: 9.6439 },
      { name: 'Tuscany', country: 'Italy', lat: 43.7711, lng: 11.2486 },
      { name: 'Pisa', country: 'Italy', lat: 43.7228, lng: 10.4017 },
      { name: 'Siena', country: 'Italy', lat: 43.3188, lng: 11.3308 },
      { name: 'Verona', country: 'Italy', lat: 45.4384, lng: 10.9916 },
      { name: 'Bologna', country: 'Italy', lat: 44.4949, lng: 11.3426 },
      { name: 'Turin', country: 'Italy', lat: 45.0703, lng: 7.6869 },
      { name: 'Pompeii', country: 'Italy', lat: 40.7462, lng: 14.4989 },
      { name: 'Capri', country: 'Italy', lat: 40.5531, lng: 14.2222 },
      { name: 'Lake Como', country: 'Italy', lat: 46.0160, lng: 9.2572 },
      { name: 'Sicily', country: 'Italy', lat: 37.5994, lng: 14.0154 },
      { name: 'Sardinia', country: 'Italy', lat: 40.1209, lng: 9.0129 },
      { name: 'Genoa', country: 'Italy', lat: 44.4056, lng: 8.9463 },
      { name: 'Ravenna', country: 'Italy', lat: 44.4184, lng: 12.2035 },
      // Spain
      { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
      { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
      { name: 'Seville', country: 'Spain', lat: 37.3891, lng: -5.9845 },
      { name: 'Granada', country: 'Spain', lat: 37.1773, lng: -3.5986 },
      { name: 'Valencia', country: 'Spain', lat: 39.4699, lng: -0.3763 },
      { name: 'Bilbao', country: 'Spain', lat: 43.2630, lng: -2.9350 },
      { name: 'San Sebastian', country: 'Spain', lat: 43.3183, lng: -1.9812 },
      { name: 'Malaga', country: 'Spain', lat: 36.7213, lng: -4.4214 },
      { name: 'Toledo', country: 'Spain', lat: 39.8628, lng: -4.0273 },
      { name: 'Cordoba', country: 'Spain', lat: 37.8882, lng: -4.7794 },
      { name: 'Ibiza', country: 'Spain', lat: 38.9067, lng: 1.4206 },
      { name: 'Mallorca', country: 'Spain', lat: 39.6953, lng: 3.0176 },
      { name: 'Tenerife', country: 'Spain', lat: 28.2916, lng: -16.6291 },
      { name: 'Santiago de Compostela', country: 'Spain', lat: 42.8782, lng: -8.5448 },
      { name: 'Salamanca', country: 'Spain', lat: 40.9701, lng: -5.6635 },
      // Germany
      { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
      { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
      { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
      { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
      { name: 'Cologne', country: 'Germany', lat: 50.9375, lng: 6.9603 },
      { name: 'Dresden', country: 'Germany', lat: 51.0504, lng: 13.7373 },
      { name: 'Heidelberg', country: 'Germany', lat: 49.3988, lng: 8.6724 },
      { name: 'Nuremberg', country: 'Germany', lat: 49.4521, lng: 11.0767 },
      { name: 'Rothenburg', country: 'Germany', lat: 49.3769, lng: 10.1789 },
      { name: 'Neuschwanstein', country: 'Germany', lat: 47.5576, lng: 10.7498 },
      { name: 'Black Forest', country: 'Germany', lat: 48.3705, lng: 8.2193 },
      { name: 'Stuttgart', country: 'Germany', lat: 48.7758, lng: 9.1829 },
      { name: 'Dusseldorf', country: 'Germany', lat: 51.2277, lng: 6.7735 },
      { name: 'Leipzig', country: 'Germany', lat: 51.3397, lng: 12.3731 },
      { name: 'Bremen', country: 'Germany', lat: 53.0793, lng: 8.8017 },
      // Netherlands
      { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
      { name: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
      { name: 'The Hague', country: 'Netherlands', lat: 52.0705, lng: 4.3007 },
      { name: 'Utrecht', country: 'Netherlands', lat: 52.0907, lng: 5.1214 },
      { name: 'Delft', country: 'Netherlands', lat: 52.0116, lng: 4.3571 },
      { name: 'Leiden', country: 'Netherlands', lat: 52.1601, lng: 4.4970 },
      { name: 'Haarlem', country: 'Netherlands', lat: 52.3874, lng: 4.6462 },
      { name: 'Maastricht', country: 'Netherlands', lat: 50.8514, lng: 5.6910 },
      // Belgium
      { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
      { name: 'Bruges', country: 'Belgium', lat: 51.2093, lng: 3.2247 },
      { name: 'Ghent', country: 'Belgium', lat: 51.0543, lng: 3.7174 },
      { name: 'Antwerp', country: 'Belgium', lat: 51.2194, lng: 4.4025 },
      { name: 'Leuven', country: 'Belgium', lat: 50.8798, lng: 4.7005 },
      // Austria
      { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
      { name: 'Salzburg', country: 'Austria', lat: 47.8095, lng: 13.0550 },
      { name: 'Innsbruck', country: 'Austria', lat: 47.2692, lng: 11.4041 },
      { name: 'Hallstatt', country: 'Austria', lat: 47.5622, lng: 13.6493 },
      { name: 'Graz', country: 'Austria', lat: 47.0707, lng: 15.4395 },
      // Switzerland
      { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
      { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lng: 6.1432 },
      { name: 'Lucerne', country: 'Switzerland', lat: 47.0502, lng: 8.3093 },
      { name: 'Interlaken', country: 'Switzerland', lat: 46.6863, lng: 7.8632 },
      { name: 'Zermatt', country: 'Switzerland', lat: 46.0207, lng: 7.7491 },
      { name: 'Bern', country: 'Switzerland', lat: 46.9480, lng: 7.4474 },
      { name: 'Basel', country: 'Switzerland', lat: 47.5596, lng: 7.5886 },
      { name: 'Lausanne', country: 'Switzerland', lat: 46.5197, lng: 6.6323 },
      // Portugal
      { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
      { name: 'Porto', country: 'Portugal', lat: 41.1579, lng: -8.6291 },
      { name: 'Sintra', country: 'Portugal', lat: 38.8029, lng: -9.3817 },
      { name: 'Algarve', country: 'Portugal', lat: 37.0179, lng: -7.9304 },
      { name: 'Madeira', country: 'Portugal', lat: 32.6669, lng: -16.9241 },
      { name: 'Azores', country: 'Portugal', lat: 37.7412, lng: -25.6756 },
      { name: 'Coimbra', country: 'Portugal', lat: 40.2033, lng: -8.4103 },
      { name: 'Evora', country: 'Portugal', lat: 38.5714, lng: -7.9135 },
      // Greece
      { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
      { name: 'Santorini', country: 'Greece', lat: 36.3932, lng: 25.4615 },
      { name: 'Mykonos', country: 'Greece', lat: 37.4467, lng: 25.3289 },
      { name: 'Crete', country: 'Greece', lat: 35.2401, lng: 24.8093 },
      { name: 'Rhodes', country: 'Greece', lat: 36.4341, lng: 28.2176 },
      { name: 'Corfu', country: 'Greece', lat: 39.6243, lng: 19.9217 },
      { name: 'Thessaloniki', country: 'Greece', lat: 40.6401, lng: 22.9444 },
      { name: 'Delphi', country: 'Greece', lat: 38.4824, lng: 22.5010 },
      { name: 'Meteora', country: 'Greece', lat: 39.7217, lng: 21.6306 },
      { name: 'Zakynthos', country: 'Greece', lat: 37.7870, lng: 20.8979 },
      // Czech Republic
      { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },
      { name: 'Cesky Krumlov', country: 'Czech Republic', lat: 48.8127, lng: 14.3175 },
      { name: 'Karlovy Vary', country: 'Czech Republic', lat: 50.2297, lng: 12.8714 },
      { name: 'Brno', country: 'Czech Republic', lat: 49.1951, lng: 16.6068 },
      // Poland
      { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
      { name: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.9450 },
      { name: 'Gdansk', country: 'Poland', lat: 54.3520, lng: 18.6466 },
      { name: 'Wroclaw', country: 'Poland', lat: 51.1079, lng: 17.0385 },
      { name: 'Poznan', country: 'Poland', lat: 52.4064, lng: 16.9252 },
      { name: 'Zakopane', country: 'Poland', lat: 49.2992, lng: 19.9496 },
      // Hungary
      { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
      { name: 'Eger', country: 'Hungary', lat: 47.9025, lng: 20.3772 },
      { name: 'Lake Balaton', country: 'Hungary', lat: 46.8333, lng: 17.7500 },
      // Croatia
      { name: 'Dubrovnik', country: 'Croatia', lat: 42.6507, lng: 18.0944 },
      { name: 'Split', country: 'Croatia', lat: 43.5081, lng: 16.4402 },
      { name: 'Zagreb', country: 'Croatia', lat: 45.8150, lng: 15.9819 },
      { name: 'Plitvice Lakes', country: 'Croatia', lat: 44.8654, lng: 15.5820 },
      { name: 'Hvar', country: 'Croatia', lat: 43.1729, lng: 16.4412 },
      { name: 'Zadar', country: 'Croatia', lat: 44.1194, lng: 15.2314 },
      { name: 'Rovinj', country: 'Croatia', lat: 45.0812, lng: 13.6387 },
      // Slovenia
      { name: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058 },
      { name: 'Bled', country: 'Slovenia', lat: 46.3683, lng: 14.1146 },
      { name: 'Piran', country: 'Slovenia', lat: 45.5283, lng: 13.5681 },
      // Denmark
      { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
      { name: 'Aarhus', country: 'Denmark', lat: 56.1629, lng: 10.2039 },
      { name: 'Odense', country: 'Denmark', lat: 55.4038, lng: 10.4024 },
      // Sweden
      { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
      { name: 'Gothenburg', country: 'Sweden', lat: 57.7089, lng: 11.9746 },
      { name: 'Malmo', country: 'Sweden', lat: 55.6050, lng: 13.0038 },
      { name: 'Uppsala', country: 'Sweden', lat: 59.8586, lng: 17.6389 },
      { name: 'Lapland', country: 'Sweden', lat: 66.8309, lng: 20.3992 },
      // Norway
      { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
      { name: 'Bergen', country: 'Norway', lat: 60.3913, lng: 5.3221 },
      { name: 'Tromso', country: 'Norway', lat: 69.6492, lng: 18.9553 },
      { name: 'Stavanger', country: 'Norway', lat: 58.9700, lng: 5.7331 },
      { name: 'Lofoten', country: 'Norway', lat: 68.2500, lng: 14.0000 },
      { name: 'Geirangerfjord', country: 'Norway', lat: 62.1008, lng: 7.0940 },
      { name: 'Flam', country: 'Norway', lat: 60.8628, lng: 7.1140 },
      // Finland
      { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
      { name: 'Rovaniemi', country: 'Finland', lat: 66.5039, lng: 25.7294 },
      { name: 'Turku', country: 'Finland', lat: 60.4518, lng: 22.2666 },
      { name: 'Tampere', country: 'Finland', lat: 61.4978, lng: 23.7610 },
      // Iceland
      { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
      { name: 'Blue Lagoon', country: 'Iceland', lat: 63.8804, lng: -22.4495 },
      { name: 'Golden Circle', country: 'Iceland', lat: 64.3271, lng: -20.1199 },
      { name: 'Vik', country: 'Iceland', lat: 63.4186, lng: -19.0060 },
      // Ireland
      { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
      { name: 'Galway', country: 'Ireland', lat: 53.2707, lng: -9.0568 },
      { name: 'Cork', country: 'Ireland', lat: 51.8985, lng: -8.4756 },
      { name: 'Killarney', country: 'Ireland', lat: 52.0599, lng: -9.5044 },
      { name: 'Cliffs of Moher', country: 'Ireland', lat: 52.9715, lng: -9.4309 },
      { name: 'Ring of Kerry', country: 'Ireland', lat: 51.9442, lng: -9.8856 },
      // Baltic States
      { name: 'Tallinn', country: 'Estonia', lat: 59.4370, lng: 24.7536 },
      { name: 'Riga', country: 'Latvia', lat: 56.9496, lng: 24.1052 },
      { name: 'Vilnius', country: 'Lithuania', lat: 54.6872, lng: 25.2797 },
      { name: 'Kaunas', country: 'Lithuania', lat: 54.8985, lng: 23.9036 },
      // Romania
      { name: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025 },
      { name: 'Brasov', country: 'Romania', lat: 45.6427, lng: 25.5887 },
      { name: 'Transylvania', country: 'Romania', lat: 46.7712, lng: 23.6236 },
      { name: 'Sibiu', country: 'Romania', lat: 45.7983, lng: 24.1256 },
      { name: 'Cluj-Napoca', country: 'Romania', lat: 46.7712, lng: 23.6236 },
      // Bulgaria
      { name: 'Sofia', country: 'Bulgaria', lat: 42.6977, lng: 23.3219 },
      { name: 'Plovdiv', country: 'Bulgaria', lat: 42.1354, lng: 24.7453 },
      // Turkey (European part)
      { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
      // Malta
      { name: 'Valletta', country: 'Malta', lat: 35.8989, lng: 14.5146 },
      { name: 'Mdina', country: 'Malta', lat: 35.8867, lng: 14.4028 },
      { name: 'Gozo', country: 'Malta', lat: 36.0444, lng: 14.2510 },
      // Luxembourg
      { name: 'Luxembourg City', country: 'Luxembourg', lat: 49.6116, lng: 6.1319 },
    ];

    const EXCLUDED_TYPES = new Set([
      'bar', 'restaurant', 'night_club', 'liquor_store',
      'cafe', 'bakery', 'meal_delivery', 'meal_takeaway', 'food', 'lodging', 'hotel',
    ]);

    const typeMap: Record<string, string> = {
      'museum': 'museum', 'art_gallery': 'museum', 'park': 'park',
      'national_park': 'nature', 'amusement_park': 'entertainment',
      'tourist_attraction': 'landmark', 'point_of_interest': 'landmark',
      'church': 'religious', 'place_of_worship': 'religious',
      'natural_feature': 'nature', 'beach': 'beach', 'zoo': 'nature',
      'aquarium': 'nature', 'stadium': 'entertainment',
      'historical_landmark': 'historical', 'monument': 'historical',
    };

    const mapCategory = (types: string[]): string | null => {
      for (const type of types) if (EXCLUDED_TYPES.has(type)) return null;
      for (const type of types) if (typeMap[type]) return typeMap[type];
      return 'landmark';
    };

    const getPhotoUrl = (photoName: string, maxWidth: number = 800): string => {
      return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
    };

    const searchAttractions = async (query: string, lat: number, lng: number): Promise<any[]> => {
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri,places.internationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 30000 } },
            maxResultCount: 20,
            languageCode: 'en',
          }),
        });
        if (!response.ok) return [];
        const data = await response.json() as { places?: any[] };
        return data.places || [];
      } catch { return []; }
    };

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const stats = { citiesCreated: 0, citiesProcessed: 0, attractionsAdded: 0, startIndex, batchSize, totalCities: ALL_EUROPE_CITIES.length };

    const SEARCH_QUERIES = [
      'famous tourist attractions in',
      'historic landmarks in',
      'museums in',
      'popular things to do in',
      'parks and nature in',
      'monuments in',
    ];

    // Process only the batch
    const EUROPE_CITIES = ALL_EUROPE_CITIES.slice(startIndex, startIndex + batchSize);

    for (const cityData of EUROPE_CITIES) {
      // Find or create country
      let country = await prisma.country.findFirst({
        where: { name: cityData.country }
      });

      if (!country) {
        // Find Europe continent
        const europe = await prisma.continent.findFirst({
          where: { name: 'Europe' }
        });
        if (!europe) continue;

        country = await prisma.country.create({
          data: {
            name: cityData.country,
            code: cityData.country.substring(0, 2).toUpperCase(),
            continentId: europe.id,
          }
        });
      }

      // Find or create city
      let city = await prisma.city.findFirst({
        where: { name: cityData.name, countryId: country.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityData.name,
            countryId: country.id,
            latitude: cityData.lat,
            longitude: cityData.lng,
          }
        });
        stats.citiesCreated++;
      }

      // Check current count
      const currentCount = await prisma.attraction.count({ where: { cityId: city.id } });
      if (currentCount >= 50) {
        stats.citiesProcessed++;
        continue;
      }

      const addedNames = new Set<string>();
      const existing = await prisma.attraction.findMany({
        where: { cityId: city.id },
        select: { name: true }
      });
      existing.forEach(a => addedNames.add(a.name.toLowerCase()));

      let cityAdded = 0;
      for (const queryPrefix of SEARCH_QUERIES) {
        if (cityAdded >= 50) break;

        const query = `${queryPrefix} ${cityData.name} ${cityData.country}`;
        const places = await searchAttractions(query, cityData.lat, cityData.lng);

        for (const place of places) {
          if (cityAdded >= 60) break;

          const name = place.displayName?.text || '';
          if (!name || addedNames.has(name.toLowerCase())) continue;

          const category = mapCategory(place.types || []);
          if (!category) continue;

          const rating = place.rating || 0;
          if (rating < 3.5) continue;

          const images: string[] = [];
          let thumbnailUrl = '';
          if (place.photos?.length > 0) {
            thumbnailUrl = getPhotoUrl(place.photos[0].name, 400);
            for (let i = 0; i < Math.min(place.photos.length, 5); i++) {
              images.push(getPhotoUrl(place.photos[i].name, 800));
            }
          }

          try {
            await prisma.attraction.create({
              data: {
                name,
                description: place.editorialSummary?.text || `A popular attraction in ${cityData.name}, ${cityData.country}.`,
                shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${name} in ${cityData.name}`,
                category: category as any,
                cityId: city.id,
                latitude: place.location?.latitude || cityData.lat,
                longitude: place.location?.longitude || cityData.lng,
                address: place.formattedAddress || `${cityData.name}, ${cityData.country}`,
                images,
                thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/400x300',
                website: place.websiteUri || null,
                contactPhone: place.internationalPhoneNumber || null,
                averageRating: rating,
                totalReviews: place.userRatingCount || 0,
                isFree: false,
              },
            });
            addedNames.add(name.toLowerCase());
            cityAdded++;
            stats.attractionsAdded++;
          } catch { /* skip duplicates */ }
        }
        await delay(200);
      }
      stats.citiesProcessed++;
      await delay(300);
    }

    // Get totals for Europe
    const europe = await prisma.continent.findFirst({ where: { name: 'Europe' } });
    const europeCountries = await prisma.country.findMany({
      where: { continentId: europe?.id },
      select: { id: true }
    });
    const countryIds = europeCountries.map(c => c.id);

    const totalEurope = await prisma.attraction.count({
      where: { city: { countryId: { in: countryIds } } }
    });

    const europeCities = await prisma.city.count({
      where: { countryId: { in: countryIds } }
    });

    return {
      success: true,
      stats,
      totals: {
        europeCities,
        europeAttractions: totalEurope,
      },
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
