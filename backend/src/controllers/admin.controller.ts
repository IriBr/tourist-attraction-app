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

  async seedDatabase(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await seedDatabase();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
