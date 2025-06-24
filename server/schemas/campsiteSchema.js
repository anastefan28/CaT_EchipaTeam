import { z } from 'zod';
import { isoDate } from './helper.js';
export const campsiteSchema = z.object({
  name : z.string().min(3).max(100),
  description : z.string().max(10_000),
  lat : z.number().min(-90).max(90),
  lon : z.number().min(-180).max(180),
  capacity : z.number().int().positive().max(50),
  price : z.number().positive().max(10_000),
  county : z.string().max(100),
  type : z.enum(['tent','rv','cabin'])
}).strict();

