import { z } from 'zod';
import { uuid } from './helper.js';

export const mediaSchema = z.object({
  campsite_id : uuid,
  review_id : uuid.optional(),
  message_id : uuid.optional()
}).strict()
.refine(
  d => !(d.review_id && d.message_id),       
  {message : 'Provide either review_id or message_id, not both'}
);
