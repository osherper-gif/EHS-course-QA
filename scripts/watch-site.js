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
const { spawn } = require('child_process');
const siteRoot = defaultCourseSitePath();
let timer = null;
function run() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const child = spawn(process.execPath, [path.join(__dirname, 'sync-from-site.js')], { cwd: path.resolve(__dirname, '..'), stdio:'inherit' });
    child.on('close', () => spawn(process.execPath, [path.join(__dirname, 'scan-site.js')], { cwd: path.resolve(__dirname, '..'), stdio:'inherit' }));
  }, 600);
}
console.log('Watching site changes at', siteRoot);
fs.watch(siteRoot, { recursive: true }, (event, file) => {
  if (!file || !/\.(html|js|css|json|rules)$/i.test(file)) return;
  run();
});
run();
