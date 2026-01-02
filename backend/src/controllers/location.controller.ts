import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/location.service.js';

export class LocationController {
  // ============ CONTINENTS ============

  async getAllContinents(req: Request, res: Response, next: NextFunction) {
    try {
      const continents = await locationService.getAllContinents();
      res.json(continents);
    } catch (error) {
      next(error);
    }
  }

  async getContinentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const continent = await locationService.getContinentById(id);
      res.json(continent);
    } catch (error) {
      next(error);
    }
  }

  async createContinent(req: Request, res: Response, next: NextFunction) {
    try {
      const continent = await locationService.createContinent(req.body);
      res.status(201).json(continent);
    } catch (error) {
      next(error);
    }
  }

  async updateContinent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const continent = await locationService.updateContinent(id, req.body);
      res.json(continent);
    } catch (error) {
      next(error);
    }
  }

  async deleteContinent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await locationService.deleteContinent(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============ COUNTRIES ============

  async getAllCountries(req: Request, res: Response, next: NextFunction) {
    try {
      const { continentId } = req.query;
      const countries = await locationService.getAllCountries(continentId as string | undefined);
      res.json(countries);
    } catch (error) {
      next(error);
    }
  }

  async getCountryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const country = await locationService.getCountryById(id);
      res.json(country);
    } catch (error) {
      next(error);
    }
  }

  async createCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const country = await locationService.createCountry(req.body);
      res.status(201).json(country);
    } catch (error) {
      next(error);
    }
  }

  async updateCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const country = await locationService.updateCountry(id, req.body);
      res.json(country);
    } catch (error) {
      next(error);
    }
  }

  async deleteCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await locationService.deleteCountry(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============ CITIES ============

  async getAllCities(req: Request, res: Response, next: NextFunction) {
    try {
      const { countryId } = req.query;
      const cities = await locationService.getAllCities(countryId as string | undefined);
      res.json(cities);
    } catch (error) {
      next(error);
    }
  }

  async getCityById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const city = await locationService.getCityById(id);
      res.json(city);
    } catch (error) {
      next(error);
    }
  }

  async createCity(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await locationService.createCity(req.body);
      res.status(201).json(city);
    } catch (error) {
      next(error);
    }
  }

  async updateCity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const city = await locationService.updateCity(id, req.body);
      res.json(city);
    } catch (error) {
      next(error);
    }
  }

  async deleteCity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await locationService.deleteCity(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============ HIERARCHY ============

  async getHierarchyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await locationService.getHierarchyStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getFullHierarchy(req: Request, res: Response, next: NextFunction) {
    try {
      const hierarchy = await locationService.getFullHierarchy();
      res.json(hierarchy);
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
