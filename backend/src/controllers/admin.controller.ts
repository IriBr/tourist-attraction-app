import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { seedDatabase } from '../services/seed.service.js';
import { SubscriptionTier, UserRole } from '@prisma/client';
import { BadRequestError } from '../utils/errors.js';

export class AdminController {
  // ============ USER MANAGEMENT ============

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await adminService.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserById(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { tier } = req.body;

      if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
        throw new BadRequestError('Invalid subscription tier');
      }

      const user = await adminService.updateUserSubscription(userId, tier);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        throw new BadRequestError('Invalid role');
      }

      const user = await adminService.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============ ATTRACTION MANAGEMENT ============

  async getAllAttractions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const cityId = req.query.cityId as string | undefined;

      const result = await adminService.getAllAttractions(page, limit, search, category, cityId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAttractionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { attractionId } = req.params;
      const attraction = await adminService.getAttractionById(attractionId);
      res.json(attraction);
    } catch (error) {
      next(error);
    }
  }

  async createAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const attraction = await adminService.createAttraction(req.body);
      res.status(201).json(attraction);
    } catch (error) {
      next(error);
    }
  }

  async updateAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { attractionId } = req.params;
      const attraction = await adminService.updateAttraction(attractionId, req.body);
      res.json(attraction);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { attractionId } = req.params;
      const result = await adminService.deleteAttraction(attractionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttractionsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const result = await adminService.deleteAttractionsByCategory(category);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttractionsByContinent(req: Request, res: Response, next: NextFunction) {
    try {
      const { continent } = req.params;
      const result = await adminService.deleteAttractionsByContinent(continent);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============ LOCATION MANAGEMENT ============

  async getAllCountries(req: Request, res: Response, next: NextFunction) {
    try {
      const countries = await adminService.getAllCountries();
      res.json({ success: true, data: countries });
    } catch (error) {
      next(error);
    }
  }

  async createCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const country = await adminService.createCountry(req.body);
      res.status(201).json({ success: true, data: country });
    } catch (error) {
      next(error);
    }
  }

  async getAllCities(req: Request, res: Response, next: NextFunction) {
    try {
      const cities = await adminService.getAllCities();
      res.json({ success: true, data: cities });
    } catch (error) {
      next(error);
    }
  }

  async createCity(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await adminService.createCity(req.body);
      res.status(201).json({ success: true, data: city });
    } catch (error) {
      next(error);
    }
  }

  // ============ STATS ============

  async getLocationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getLocationStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ============ DATABASE SEED ============

  async seedGooglePlaces(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const maxCities = limit ? parseInt(limit as string) : 10;
      const result = await adminService.seedGooglePlaces(maxCities);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async seedDatabase(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await seedDatabase();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addLocationImages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.addLocationImages();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async seedUSA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.seedUSA();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async seedEurope(req: Request, res: Response, next: NextFunction) {
    try {
      const startIndex = parseInt(req.query.start as string) || 0;
      const batchSize = parseInt(req.query.batch as string) || 20;
      const result = await adminService.seedEurope(startIndex, batchSize);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
