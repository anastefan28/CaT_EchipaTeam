import { z } from 'zod';

export const uuid = z.string().uuid();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date (yyyy-mm-dd)');
export const username = z.string().min(3).max(30).regex(/^[\w\-]+$/, 'alphanumeric + dash/underscore');        
export const email = z.string().email().max(320);
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100)
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => /\d/.test(val), {
    message: "Password must contain at least one digit",
  })
  .refine((val) => /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/.test(val), {
    message: "Password must contain at least one special character",
  });
