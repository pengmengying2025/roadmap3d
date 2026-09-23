// Tiny static server so the engine loads three.js (ES module), fonts and the spec over http:// instead of file://
// (module scripts and fonts from file:// are blocked by Chromium's origin rules).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.css': 'text/css' };
export function startServer({ root, fontDir }) {
  const routes = [
    ['/vendor/', path.join(root, 'node_modules', 'three', 'build')],
    ['/src/', path.join(root, 'src')],
    ['/fonts/', fontDir || path.join(root, 'fonts')],
  ];
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const r = routes.find(([p]) => u.startsWith(p));
    if (!r) { res.writeHead(404); return res.end('not found'); }
    const f = path.normalize(path.join(r[1], u.slice(r[0].length)));
    if (!f.startsWith(r[1]) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${srv.address().port}`, close: () => new Promise(r => srv.close(r)) })));
}
