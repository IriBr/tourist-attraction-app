import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export class LocationService {
  // ============ CONTINENTS ============

  async getAllContinents() {
    return prisma.continent.findMany({
      include: {
        _count: {
          select: {
            countries: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getContinentById(id: string) {
    const continent = await prisma.continent.findUnique({
      where: { id },
      include: {
        countries: {
          include: {
            _count: {
              select: { cities: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { countries: true },
        },
      },
    });

    if (!continent) {
      throw new NotFoundError('Continent not found');
    }

    return continent;
  }

  async createContinent(data: { name: string; code: string; imageUrl?: string }) {
    return prisma.continent.create({
      data,
      include: {
        _count: {
          select: { countries: true },
        },
      },
    });
  }

  async updateContinent(id: string, data: { name?: string; code?: string; imageUrl?: string }) {
    const continent = await prisma.continent.findUnique({ where: { id } });
    if (!continent) {
      throw new NotFoundError('Continent not found');
    }

    return prisma.continent.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { countries: true },
        },
      },
    });
  }

  async deleteContinent(id: string) {
    const continent = await prisma.continent.findUnique({ where: { id } });
    if (!continent) {
      throw new NotFoundError('Continent not found');
    }

    await prisma.continent.delete({ where: { id } });
    return { success: true, message: 'Continent deleted successfully' };
  }

  // ============ COUNTRIES ============

  async getAllCountries(continentId?: string) {
    const where = continentId ? { continentId } : {};

    return prisma.country.findMany({
      where,
      include: {
        continent: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { cities: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCountryById(id: string) {
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        continent: {
          select: { id: true, name: true, code: true },
        },
        cities: {
          include: {
            _count: {
              select: { attractions: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { cities: true },
        },
      },
    });

    if (!country) {
      throw new NotFoundError('Country not found');
    }

    return country;
  }

  async createCountry(data: {
    name: string;
    code: string;
    continentId: string;
    imageUrl?: string;
    flagUrl?: string;
  }) {
    // Verify continent exists
    const continent = await prisma.continent.findUnique({
      where: { id: data.continentId },
    });
    if (!continent) {
      throw new NotFoundError('Continent not found');
    }

    return prisma.country.create({
      data,
      include: {
        continent: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { cities: true },
        },
      },
    });
  }

  async updateCountry(
    id: string,
    data: {
      name?: string;
      code?: string;
      continentId?: string;
      imageUrl?: string;
      flagUrl?: string;
    }
  ) {
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) {
      throw new NotFoundError('Country not found');
    }

    if (data.continentId) {
      const continent = await prisma.continent.findUnique({
        where: { id: data.continentId },
      });
      if (!continent) {
        throw new NotFoundError('Continent not found');
      }
    }

    return prisma.country.update({
      where: { id },
      data,
      include: {
        continent: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { cities: true },
        },
      },
    });
  }

  async deleteCountry(id: string) {
    const country = await prisma.country.findUnique({ where: { id } });
    if (!country) {
      throw new NotFoundError('Country not found');
    }

    await prisma.country.delete({ where: { id } });
    return { success: true, message: 'Country deleted successfully' };
  }

  // ============ CITIES ============

  async getAllCities(countryId?: string) {
    const where = countryId ? { countryId } : {};

    return prisma.city.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            continent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { attractions: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCityById(id: string) {
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            continent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        attractions: {
          select: {
            id: true,
            name: true,
            category: true,
            thumbnailUrl: true,
            averageRating: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { attractions: true },
        },
      },
    });

    if (!city) {
      throw new NotFoundError('City not found');
    }

    return city;
  }

  async createCity(data: {
    name: string;
    countryId: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
  }) {
    // Verify country exists
    const country = await prisma.country.findUnique({
      where: { id: data.countryId },
    });
    if (!country) {
      throw new NotFoundError('Country not found');
    }

    return prisma.city.create({
      data,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            continent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { attractions: true },
        },
      },
    });
  }

  async updateCity(
    id: string,
    data: {
      name?: string;
      countryId?: string;
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundError('City not found');
    }

    if (data.countryId) {
      const country = await prisma.country.findUnique({
        where: { id: data.countryId },
      });
      if (!country) {
        throw new NotFoundError('Country not found');
      }
    }

    return prisma.city.update({
      where: { id },
      data,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            continent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { attractions: true },
        },
      },
    });
  }

  async deleteCity(id: string) {
    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundError('City not found');
    }

    await prisma.city.delete({ where: { id } });
    return { success: true, message: 'City deleted successfully' };
  }

  // ============ HIERARCHY STATS ============

  async getHierarchyStats() {
    const [continents, countries, cities, attractions] = await Promise.all([
      prisma.continent.count(),
      prisma.country.count(),
      prisma.city.count(),
      prisma.attraction.count(),
    ]);

    return { continents, countries, cities, attractions };
  }

  async getFullHierarchy() {
    return prisma.continent.findMany({
      include: {
        countries: {
          include: {
            cities: {
              include: {
                _count: {
                  select: { attractions: true },
                },
              },
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { cities: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { countries: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export const locationService = new LocationService();
