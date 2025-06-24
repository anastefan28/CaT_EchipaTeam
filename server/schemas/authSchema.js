import { z } from 'zod';
import { username, email, password } from './helper.js';

export const registerSchema = z.object({
  username,
  email,
  password,
  role : z.enum(['member', 'admin'])
}).strict();

export const loginSchema = z.object({
  email,
  password : z.string().min(1)
}).strict();
