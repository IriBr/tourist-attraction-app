import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export const validate = <T extends ZodSchema>(
  schema: T,
  location: RequestLocation = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      next(result.error);
      return;
    }

    // Replace the request data with the validated and transformed data
    req[location] = result.data;
    next();
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
