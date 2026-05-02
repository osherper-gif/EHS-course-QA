const fs = require('fs'); const path = require('path'); const http = require('http');
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
} const { spawn } = require('child_process');
const root = path.resolve(__dirname,'..'); const site = defaultCourseSitePath(); const port = Number(process.env.COURSE_PORT || 8080);
function serve(dir){ return http.createServer((req,res)=>{ let file=decodeURIComponent(req.url.split('?')[0]); if(file==='/'||!file) file='/index.html'; const full=path.resolve(path.join(dir,file)); if(!full.startsWith(path.resolve(dir))) {res.writeHead(403); return res.end('Forbidden');} fs.readFile(full,(err,data)=>{ if(err){res.writeHead(404); return res.end('Not found');} const ext=path.extname(full); const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'}[ext]||'application/octet-stream'; res.writeHead(200,{'Content-Type':type}); res.end(data); }); }); }
const server = serve(site); server.listen(port, ()=>{ const env={...process.env,TARGET_URL:process.env.TARGET_URL||`http://localhost:${port}`}; const child=spawn(process.platform==='win32'?'npx.cmd':'npx',['playwright','test'],{cwd:root,env,stdio:'pipe',shell:process.platform==='win32'}); let out=''; const started=Date.now(); child.stdout.on('data',d=>{out+=d; process.stdout.write(d)}); child.stderr.on('data',d=>{out+=d; process.stderr.write(d)}); child.on('close',code=>{ const runsPath=path.join(root,'data/test-runs.json'); const runs=JSON.parse(fs.readFileSync(runsPath,'utf8')); const failed=(out.match(/failed/gi)||[]).length; const passed=(out.match(/passed/gi)||[]).length; runs.push({id:'RUN-'+Date.now(), startedAt:new Date(started).toISOString(), finishedAt:new Date().toISOString(), status:code===0?'pass':'fail', passed, failed, durationMs:Date.now()-started, output:out.slice(-8000)}); fs.writeFileSync(runsPath,JSON.stringify(runs,null,2),'utf8'); server.close(()=>process.exit(code)); }); });
