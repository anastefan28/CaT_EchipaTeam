
import { authRoute } from './routes/authRoute.js';
import { userRoute } from './routes/userRoute.js';
import { campsiteRoute } from './routes/campsiteRoute.js';
import { mediaRoute } from './routes/mediaRoute.js';
import { bookingRoute } from './routes/bookingRoute.js';
import { adminRoute } from "./routes/adminRoute.js";

export const routes = {
	'/api/media': mediaRoute,
	'/api/auth': authRoute,
	'/api/me': userRoute,
	'/api/campsites': campsiteRoute ,
	'/api/bookings': bookingRoute, 
   '/api/admin': adminRoute,
};
