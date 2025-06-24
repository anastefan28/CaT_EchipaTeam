import { z } from 'zod';
import { username, email, password } from './helper.js';

export const userSchema = z.object({
  username,
  email,
  password,
  role : z.enum(['member','admin']),
  confirmed : z.boolean().optional()
}).strict();

export const userUpdateSchema = z.object({
  username : username.optional(),
  currentPassword : password.optional(),
  newPassword : password.optional()
})
.strict()
.refine(data =>                         
  Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)
.refine(data =>
  (data.currentPassword && data.newPassword) ||
  (!data.currentPassword && !data.newPassword),
  { message: 'currentPassword and newPassword must be provided together'}         
);