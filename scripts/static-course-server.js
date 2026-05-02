const fs = require('fs');
const path = require('path');
function defaultCourseSitePath() {
  const explicit = process.env.COURSE_SITE_PATH;
  if (explicit && fs.existsSync(explicit)) return path.resolve(explicit);
  const parent = path.resolve(__dirname, '..', '..');
  for (const name of fs.readdirSync(parent)) {
    const candidate = path.join(parent, name);
    try {
      if (fs.statSync(candidate).isDirectory() && fs.existsSync(path.join(candidate, 'index.html')) && fs.existsSync(path.join(candidate, 'firebase.json'))) return candidate;
    } catch {}
  }
  return path.resolve(parent, 'אתר אינטרנט');
}
const http = require('http');
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const root = path.resolve(arg('root', defaultCourseSitePath()));
const port = Number(arg('port', process.env.COURSE_PORT || 8080));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || !urlPath) urlPath = '/index.html';
  const full = path.resolve(path.join(root, urlPath));
  if (!full.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': types[path.extname(full).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
});
server.listen(port, () => console.log('Course static server running at http://localhost:' + port + ' from ' + root));
