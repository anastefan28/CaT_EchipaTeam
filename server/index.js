import http from 'http';
import { parse } from 'url';
import dotenv from 'dotenv';
import { routes } from './router.js';
import { serveStatic } from './middlewares/static.js';

dotenv.config();

const server = http.createServer(async (req, res) => {
	const { pathname } = parse(req.url, true);

	const matchedRoute = Object.keys(routes).find(route => pathname.startsWith(route));
	if (matchedRoute) {
		return routes[matchedRoute](req, res);
	}
	if (serveStatic(req, res)) {
		return;
	}
	res.writeHead(404);
	res.end('Not Found');

});

server.listen(process.env.PORT, () => console.log('Server running at http://localhost:8000'));
