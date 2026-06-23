/* Minimal static file server for local preview (no deps).
   Mirrors GitHub Pages / Hostinger clean-URL behaviour: /services -> services.html */
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const port = process.env.PORT || 8123;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};
http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let filePath = path.join(root, urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }

  function send(fp) {
    fs.readFile(fp, (e, data) => {
      if (e) { res.writeHead(500); return res.end('error'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  }
  function notFound() {
    fs.readFile(path.join(root, '404.html'), (e, data) => {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(e ? 'Not found' : data);
    });
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isFile()) return send(filePath);
    if (!err && st.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      return fs.stat(idx, (e2, s2) => (!e2 && s2.isFile()) ? send(idx) : notFound());
    }
    // Clean URL: try appending .html (e.g. /services -> services.html)
    fs.stat(filePath + '.html', (e3, s3) => (!e3 && s3.isFile()) ? send(filePath + '.html') : notFound());
  });
}).listen(port, () => console.log('Preview server on http://localhost:' + port));
