import { Router } from 'express';
import { prisma } from '../config/database.js';
import { ApiResponse } from '@tourist-app/shared';
import { optionalAuth } from '../middleware/auth.js';
import { subscriptionService } from '../services/subscription.service.js';
import { cacheService } from '../services/cache.service.js';

const router = Router();

// Get all continents with full data for map
router.get('/continents', async (req, res) => {
  // Try cache first
  const cached = await cacheService.getContinents<any[]>();
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  const continents = await prisma.continent.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { countries: true }
      }
    }
  });

  const data = continents.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    imageUrl: c.imageUrl,
    color: c.color,
    latitude: c.latitude,
    longitude: c.longitude,
    latitudeDelta: c.latitudeDelta,
    longitudeDelta: c.longitudeDelta,
    countryCount: c._count.countries
  }));

  // Cache the result
  await cacheService.setContinents(data);

  const response: ApiResponse<any> = {
    success: true,
    data
  };

  res.json(response);
});

// Get countries in a continent with coordinates
router.get('/continents/:id/countries', async (req, res) => {
  const { id } = req.params;

  const continent = await prisma.continent.findUnique({
    where: { id },
    include: {
      countries: {
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { cities: true }
          }
        }
      }
    }
  });

  if (!continent) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Continent not found' }
    });
  }

  const response: ApiResponse<any> = {
    success: true,
    data: {
      continent: {
        id: continent.id,
        name: continent.name,
        code: continent.code,
        color: continent.color,
        latitude: continent.latitude,
        longitude: continent.longitude,
        latitudeDelta: continent.latitudeDelta,
        longitudeDelta: continent.longitudeDelta,
      },
      countries: continent.countries.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        flagUrl: c.flagUrl,
        imageUrl: c.imageUrl,
        latitude: c.latitude,
        longitude: c.longitude,
        latitudeDelta: c.latitudeDelta,
        longitudeDelta: c.longitudeDelta,
        cityCount: c._count.cities
      }))
    }
  };

  res.json(response);
});

// Get cities in a country with coordinates
router.get('/countries/:id/cities', async (req, res) => {
  const { id } = req.params;

  const country = await prisma.country.findUnique({
    where: { id },
    include: {
      continent: {
        select: { id: true, name: true, color: true }
      },
      cities: {
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { attractions: true }
          }
        }
      }
    }
  });

  if (!country) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Country not found' }
    });
  }

  const response: ApiResponse<any> = {
    success: true,
    data: {
      country: {
        id: country.id,
        name: country.name,
        code: country.code,
        latitude: country.latitude,
        longitude: country.longitude,
        latitudeDelta: country.latitudeDelta,
        longitudeDelta: country.longitudeDelta,
        continent: country.continent
      },
      cities: country.cities.map(c => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        latitude: c.latitude,
        longitude: c.longitude,
        attractionCount: c._count.attractions
      }))
    }
  };

  res.json(response);
});

// Get attractions in a city (with subscription limit)
router.get('/cities/:id/attractions', optionalAuth, async (req: any, res) => {
  const { id } = req.params;
  const { category } = req.query;

  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      country: {
        include: {
          continent: {
            select: { id: true, name: true, color: true }
          }
        }
      },
      attractions: {
        where: category ? { category: category as any } : undefined,
        orderBy: { averageRating: 'desc' },
        select: {
          id: true,
          name: true,
          shortDescription: true,
          description: true,
          category: true,
          thumbnailUrl: true,
          images: true,
          latitude: true,
          longitude: true,
          address: true,
          averageRating: true,
          totalReviews: true,
          isFree: true,
          adultPrice: true,
          currency: true,
          website: true,
          contactPhone: true,
        }
      }
    }
  });

  if (!city) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'City not found' }
    });
  }

  // Get user's visited attractions in this city
  const userId = req.user?.id;
  let visitedAttractionIds = new Set<string>();
  let visitedCount = 0;

  if (userId) {
    const userVisits = await prisma.visit.findMany({
      where: {
        userId,
        attraction: { cityId: id }
      },
      select: { attractionId: true }
    });
    visitedAttractionIds = new Set(userVisits.map(v => v.attractionId));
    visitedCount = userVisits.length;
  }

  // Mark which attractions are visited
  const attractionsWithVisitStatus = city.attractions.map(a => ({
    ...a,
    isVisited: visitedAttractionIds.has(a.id)
  }));

  const response: ApiResponse<any> = {
    success: true,
    data: {
      city: {
        id: city.id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        country: {
          id: city.country.id,
          name: city.country.name,
          code: city.country.code
        },
        continent: city.country.continent
      },
      attractions: attractionsWithVisitStatus,
      totalAttractions: city.attractions.length,
      visitedAttractions: visitedCount,
      progress: city.attractions.length > 0
        ? Math.round((visitedCount / city.attractions.length) * 100)
        : 0
    }
  };

  res.json(response);
});

// Get all countries (flat list)
router.get('/countries', async (req, res) => {
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    include: {
      continent: {
        select: { id: true, name: true, color: true }
      },
      _count: {
        select: { cities: true }
      }
    }
  });

  const response: ApiResponse<any> = {
    success: true,
    data: countries.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      flagUrl: c.flagUrl,
      imageUrl: c.imageUrl,
      latitude: c.latitude,
      longitude: c.longitude,
      latitudeDelta: c.latitudeDelta,
      longitudeDelta: c.longitudeDelta,
      continent: c.continent,
      cityCount: c._count.cities
    }))
  };

  res.json(response);
});

// Get all cities (flat list with pagination)
router.get('/cities', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const skip = (page - 1) * limit;

  const [cities, total] = await Promise.all([
    prisma.city.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        country: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { attractions: true }
        }
      }
    }),
    prisma.city.count()
  ]);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      items: cities.map(c => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        latitude: c.latitude,
        longitude: c.longitude,
        country: c.country,
        attractionCount: c._count.attractions
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    }
  };

  res.json(response);
});

// Get global stats (totals for all locations)
router.get('/stats', async (req, res) => {
  // Try cache first
  const cached = await cacheService.getStats<any>();
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  const [continents, countries, cities, attractions] = await Promise.all([
    prisma.continent.count(),
    prisma.country.count(),
    prisma.city.count(),
    prisma.attraction.count(),
  ]);

  const data = {
    continents,
    countries,
    cities,
    attractions,
  };

  // Cache the result
  await cacheService.setStats(data);

  const response: ApiResponse<any> = {
    success: true,
    data
  };

  res.json(response);
});

// Search locations
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.json({
      success: true,
      data: { continents: [], countries: [], cities: [] }
    });
  }

  const searchTerm = q.toLowerCase();

  const [continents, countries, cities] = await Promise.all([
    prisma.continent.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      take: 5
    }),
    prisma.country.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: {
        continent: { select: { name: true } }
      },
      take: 10
    }),
    prisma.city.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: {
        country: {
          select: { name: true }
        }
      },
      take: 15
    })
  ]);

  const response: ApiResponse<any> = {
    success: true,
    data: {
      continents: continents.map(c => ({
        id: c.id,
        name: c.name,
        type: 'continent'
      })),
      countries: countries.map(c => ({
        id: c.id,
        name: c.name,
        continentName: c.continent.name,
        type: 'country'
      })),
      cities: cities.map(c => ({
        id: c.id,
        name: c.name,
        countryName: c.country.name,
        type: 'city'
      }))
    }
  };

  res.json(response);
});

// Get full map data (optimized endpoint for map view)
router.get('/map-data', async (req, res) => {
  // Try cache first - this is a heavy query
  const cached = await cacheService.getMapData<any[]>();
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  const continents = await prisma.continent.findMany({
    orderBy: { name: 'asc' },
    include: {
      countries: {
        orderBy: { name: 'asc' },
        include: {
          cities: {
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: { attractions: true }
              }
            }
          },
          _count: {
            select: { cities: true }
          }
        }
      },
      _count: {
        select: { countries: true }
      }
    }
  });

  const data = continents.map(continent => ({
    id: continent.id,
    name: continent.name,
    code: continent.code,
    color: continent.color,
    latitude: continent.latitude,
    longitude: continent.longitude,
    latitudeDelta: continent.latitudeDelta,
    longitudeDelta: continent.longitudeDelta,
    countryCount: continent._count.countries,
    countries: continent.countries.map(country => ({
      id: country.id,
      name: country.name,
      code: country.code,
      latitude: country.latitude,
      longitude: country.longitude,
      latitudeDelta: country.latitudeDelta,
      longitudeDelta: country.longitudeDelta,
      cityCount: country._count.cities,
      cities: country.cities.map(city => ({
        id: city.id,
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        attractionCount: city._count.attractions
      }))
    }))
  }));

  // Cache the result
  await cacheService.setMapData(data);

  const response: ApiResponse<any> = {
    success: true,
    data
  };

  res.json(response);
});

export default router;
