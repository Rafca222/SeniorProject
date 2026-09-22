import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request, Response, NextFunction } from 'express';

// Same job as NestJS's globally-registered ValidationPipe, just as an
// Express middleware instead of a Nest pipe: turns the raw request body
// into an instance of the given DTO class, runs its @Is...() decorators,
// and rejects the request with a 400 if anything fails -- before the
// route handler (or any service/database call) ever runs.
export function validateDto(DtoClass: new () => object) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(DtoClass, req.body);

    // whitelist: true is the same protection as NestJS's whitelist option --
    // any field not declared on the DTO gets silently stripped rather than
    // passed through to the database.
    const errors = await validate(instance, { whitelist: true });

    if (errors.length > 0) {
      const firstConstraint = Object.values(errors[0].constraints ?? {})[0];
      return res.status(400).json({ error: firstConstraint ?? 'Invalid request data' });
    }

    req.body = instance;
    next();
  };
}
