const fs = require('fs'); const path = require('path');
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
const root = path.resolve(__dirname, '..');
const site = defaultCourseSitePath();
const tests = JSON.parse(fs.readFileSync(path.join(root,'data/test-cases.json'),'utf8'));
const walk=(dir,arr=[])=>{ if(!fs.existsSync(dir)) return arr; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ if(e.name.startsWith('.git')||e.name==='node_modules') continue; const p=path.join(dir,e.name); if(e.isDirectory()) walk(p,arr); else if(/\.(html|js|css)$/i.test(e.name)) arr.push(p); } return arr; };
const files = walk(site).map(f=>path.relative(site,f).replace(/\\/g,'/'));
const patterns = [/auth|login|firebase/i,/admin|version/i,/quiz|exam/i,/game|safety-game/i,/feedback/i,/lesson|syllabus|index|styles|app/i,/mobile|m-mobile/i];
const coveredFiles = files.filter(f => patterns.some(re => re.test(f)));
const uncoveredFiles = files.filter(f => !coveredFiles.includes(f));
const reqs = JSON.parse(fs.readFileSync(path.join(root,'data/requirements.json'),'utf8'));
const linkedReqs = new Set(tests.flatMap(t=>t.requirementIds||[]));
const byType = reqs.reduce((acc,r)=>{ acc[r.type] ||= {total:0,covered:0,percent:0}; acc[r.type].total++; if(linkedReqs.has(r.id)) acc[r.type].covered++; return acc; },{}); Object.values(byType).forEach(v=>v.percent=Math.round(v.covered/v.total*100));
const coverage = { generatedAt:new Date().toISOString(), requirements:{total:reqs.length, covered:linkedReqs.size, percent:Math.round(linkedReqs.size/reqs.length*100)}, tests:{total:tests.length, automated:tests.filter(t=>t.automation?.automated).length}, files:{total:files.length, covered:coveredFiles.length, percent:files.length?Math.round(coveredFiles.length/files.length*100):0, coveredFiles, uncoveredFiles}, byType };
fs.writeFileSync(path.join(root,'data/coverage.json'), JSON.stringify(coverage,null,2), 'utf8');
fs.mkdirSync(path.join(root,'reports/json'),{recursive:true}); fs.writeFileSync(path.join(root,'reports/json','coverage-latest.json'), JSON.stringify(coverage,null,2),'utf8');
console.log('Scan complete:', files.length, 'files,', coveredFiles.length, 'covered.');
