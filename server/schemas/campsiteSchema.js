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

export const campsiteFilterSchema = z.object({
  location : z.string().max(100).optional(),
  capacity : z.coerce.number().int().positive().max(20).optional(),
  checkin : isoDate.optional(),
  checkout : isoDate.optional(),
  sort : z.enum(['popular','price-low','price-high','rating','newest']).optional()
}).passthrough() 
.refine(q => !(q.checkin ^ q.checkout), {            
  message: 'checkin and checkout must be provided together',
  path: ['checkin']
})
.refine(q => !q.checkin || q.checkin < q.checkout, {
  message: 'checkout must be after checkin',
  path   : ['checkout']
});
