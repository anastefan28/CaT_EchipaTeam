export function getContentType(filePath) {
	if (filePath.endsWith('.js')) return 'application/javascript';
	if (filePath.endsWith('.css')) return 'text/css';
	if (filePath.endsWith('.html')) return 'text/html';
	if (filePath.endsWith('.json')) return 'application/json';
	if (filePath.endsWith('.svg')) return 'image/svg+xml';
	return 'text/plain';
}
