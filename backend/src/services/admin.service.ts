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
