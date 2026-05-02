const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 7070;
const root = __dirname;
const dataDir = path.join(root, 'data');
const readJson = (name, fallback = null) => { try { return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')); } catch { return fallback; } };
const writeJson = (name, value) => fs.writeFileSync(path.join(dataDir, name), JSON.stringify(value, null, 2), 'utf8');
const readRuntime = () => { try { return JSON.parse(fs.readFileSync(path.join(root, '.qa-runtime.json'), 'utf8')); } catch { return null; } };
app.use(express.json({limit:'5mb'}));
app.use(express.static(path.join(root, 'public')));
function buildSummary() {
  const requirements = readJson('requirements.json', []);
  const tests = readJson('test-cases.json', []);
  const runs = readJson('test-runs.json', []);
  const coverage = readJson('coverage.json', {});
  const linkedReqs = new Set(tests.flatMap(t => t.requirementIds || []));
  const pass = tests.filter(t => t.status === 'pass').length;
  const count = (items, pred) => items.filter(pred).length;
  const reqWithoutTests = requirements.filter(r => !tests.some(t => (t.requirementIds || []).includes(r.id))).length;
  const testsWithoutReq = tests.filter(t => !(t.requirementIds || []).length).length;
  const runtime = readRuntime();
  return {
    requirementsTotal: requirements.length,
    requirementsCovered: linkedReqs.size,
    requirementsCoverage: requirements.length ? Math.round(linkedReqs.size / requirements.length * 100) : 0,
    requirementsAuto: count(requirements, r => r.origin === 'auto'),
    requirementsManual: count(requirements, r => r.origin !== 'auto'),
    requirementsStale: count(requirements, r => r.status === 'stale'),
    requirementsWithoutTests: reqWithoutTests,
    testsTotal: tests.length,
    testsAutomated: count(tests, t => t.automation?.automated),
    testsPassed: pass,
    testsPassRate: tests.length ? Math.round(pass / tests.length * 100) : 0,
    testsWithoutRequirements: testsWithoutReq,
    runs: runs.slice(-10).reverse(),
    coverage,
    runtime,
    targetUrl: process.env.TARGET_URL || runtime?.targetUrl || 'http://localhost:8080',
    qaUrl: runtime?.qaUrl || ('http://localhost:' + PORT),
    qaRunning: true,
    courseRunning: Boolean(runtime?.coursePid)
  };
}
app.get('/api/summary', (req,res) => res.json(buildSummary()));
app.get('/api/status', (req,res) => res.json(buildSummary()));
app.get('/api/requirements', (req,res)=>res.json(readJson('requirements.json', [])));
app.get('/api/test-cases', (req,res)=>res.json(readJson('test-cases.json', [])));
app.get('/api/test-runs', (req,res)=>res.json(readJson('test-runs.json', [])));
app.get('/api/coverage', (req,res)=>res.json(readJson('coverage.json', {})));
app.post('/api/test-cases/:id', (req,res)=>{ const tests=readJson('test-cases.json', []); const i=tests.findIndex(t=>t.id===req.params.id); if(i<0) return res.status(404).json({error:'not found'}); tests[i]={...tests[i], ...req.body}; writeJson('test-cases.json', tests); res.json(tests[i]); });
function runScript(script, res, extraArgs = []) {
  const child = spawn(process.execPath, [path.join(root, 'scripts', script), ...extraArgs], { cwd: root, env: { ...process.env, TARGET_URL: process.env.TARGET_URL || readRuntime()?.targetUrl || 'http://localhost:8080' }, shell: false });
  let out = '';
  child.stdout.on('data', d => out += d);
  child.stderr.on('data', d => out += d);
  child.on('close', code => res.json({ code, output: out }));
}
app.post('/api/actions/sync',(req,res)=>runScript('sync-from-site.js',res));
app.post('/api/actions/scan',(req,res)=>runScript('scan-site.js',res));
app.post('/api/actions/test',(req,res)=>runScript('run-tests.js',res));
app.post('/api/actions/coverage',(req,res)=>runScript('calculate-coverage.js',res));
app.post('/api/actions/report',(req,res)=>runScript('generate-pdf-report.js',res));
app.post('/api/actions/all',(req,res)=>{
  const scripts = ['sync-from-site.js','scan-site.js','run-tests.js','calculate-coverage.js','generate-pdf-report.js'];
  let output = '';
  function next(i) {
    if (i >= scripts.length) return res.json({ code: 0, output });
    const child = spawn(process.execPath, [path.join(root, 'scripts', scripts[i])], { cwd: root, env: { ...process.env, TARGET_URL: process.env.TARGET_URL || readRuntime()?.targetUrl || 'http://localhost:8080' }, shell:false });
    child.stdout.on('data', d => output += d);
    child.stderr.on('data', d => output += d);
    child.on('close', code => code ? res.json({ code, output }) : next(i + 1));
  }
  next(0);
});
app.listen(PORT, ()=>console.log('QA System running at http://localhost:' + PORT));
