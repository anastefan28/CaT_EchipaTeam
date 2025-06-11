import fs from 'fs';
import path from 'path';
import { getContentType } from '../utils/mime.js';

export function serveStatic(req, res) {
	const pathname = req.url.split('?')[0];
	let filePath;
	if (pathname === '/' || !path.extname(pathname)) {
		const page = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '') + '.html';
		filePath = path.resolve(`./client/pages/${page}`);
	} else {
		filePath = path.resolve(`./client${pathname}`);
	}

	if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
		const fileContent = fs.readFileSync(filePath);
		const contentType = getContentType(filePath);

		res.writeHead(200, { 'Content-Type': contentType });
		res.end(fileContent);
		return true;
	}

	return false;
}
