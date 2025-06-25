import { z } from 'zod';
import { uuid } from './helper.js';

export const reviewSchema = z.object({
  rating : z.number().int().min(1).max(5),
  body_md : z.string().min(1).max(1000)
}).strict();
