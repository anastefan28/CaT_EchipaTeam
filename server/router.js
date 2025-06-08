import { authRoute } from './routes/auth.js';
import{meRoute} from './routes/me.js';
export const routes = {
  '/api/auth': authRoute,
  '/api/me': meRoute,
};