import { z } from 'zod';
import { uuid } from './helper.js';

export const messageSchema = z.object({
  body_md : z.string().min(1).max(1000)
}).strict();
