import { authRoute } from './routes/authRoute.js';
import { userRoute } from './routes/userRoute.js';
import { campsiteRoute } from './routes/campsiteRoute.js';
export const routes = {
	'/api/auth': authRoute,
	'/api/me': userRoute,
	'/api/campsites': campsiteRoute ,
};