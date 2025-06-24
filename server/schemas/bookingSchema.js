import { z } from 'zod';
import { uuid, isoDate }  from './helper.js';

export const bookingSchema = z.object({
  campsite_id : uuid,
  checkin : isoDate,
  checkout : isoDate,
  guests : z.number().int().positive().max(20)
}).strict()
.refine(d => new Date(d.checkout) > new Date(d.checkin),
        { message: 'checkout must be after checkin', path:['checkout'] })
.refine(d => new Date(d.checkin) >= new Date().setHours(0,0,0,0),
        { message: 'checkin cannot be in the past', path:['checkin'] });

