import { z } from 'zod';

export const uuid = z.string().uuid();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date (yyyy-mm-dd)');
export const username = z.string().min(3).max(30).regex(/^[\w\-]+$/, 'alphanumeric + dash/underscore');
export const password = z.string().min(12);         
export const email = z.string().email().max(320);
