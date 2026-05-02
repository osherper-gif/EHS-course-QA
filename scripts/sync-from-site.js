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
const vm = require('vm');
const qaRoot = path.resolve(__dirname, '..');
const siteRoot = defaultCourseSitePath();
const now = new Date().toISOString();
const readJson = (rel, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(qaRoot, rel), 'utf8')); } catch { return fallback; } };
const writeJson = (rel, value) => fs.writeFileSync(path.join(qaRoot, rel), JSON.stringify(value, null, 2), 'utf8');
const walk = (dir, exts, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.includes(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
};
function loadWindowData(rel, key) {
  const file = path.join(siteRoot, rel);
  if (!fs.existsSync(file)) return null;
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  try { vm.runInNewContext(code, sandbox, { timeout: 1500 }); return sandbox.window[key] || null; } catch { return null; }
}
function nextId(items, prefix) {
  let max = 0;
  for (const item of items) {
    const m = String(item.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return prefix + '-' + String(max + 1).padStart(3, '0');
}
function upsertReq(reqs, sourceKey, data) {
  let item = reqs.find(r => r.sourceKey === sourceKey);
  if (!item) {
    item = { id: nextId(reqs, data.idPrefix), origin: 'auto', sourceKey };
    reqs.push(item);
  }
  Object.assign(item, data.fields, { origin: item.origin || 'auto', sourceKey, lastSeen: now, status: 'active' });
  return item;
}
function upsertTest(tests, sourceKey, data) {
  let item = tests.find(t => t.sourceKey === sourceKey);
  if (!item) {
    item = { id: nextId(tests, data.idPrefix), origin: 'auto', sourceKey };
    tests.push(item);
  }
  Object.assign(item, data.fields, { origin: item.origin || 'auto', sourceKey, lastSeen: now, status: item.status === 'pass' || item.status === 'fail' ? item.status : 'not_run' });
  return item;
}
const reqs = readJson('data/requirements.json', []);
const tests = readJson('data/test-cases.json', []);
for (const r of reqs) { if (!r.origin) r.origin = 'manual'; if (!r.lastSeen) r.lastSeen = now; if (!r.status) r.status = 'active'; }
for (const t of tests) { if (!t.origin) t.origin = 'manual'; if (!t.lastSeen) t.lastSeen = now; if (!t.status) t.status = 'not_run'; }
const seenReq = new Set();
const seenTest = new Set();
const htmlFiles = walk(siteRoot, ['.html']).map(f => path.relative(siteRoot, f).replace(/\\/g, '/'));
const jsFiles = walk(siteRoot, ['.js']).map(f => path.relative(siteRoot, f).replace(/\\/g, '/'));
for (const rel of htmlFiles) {
  const sourceKey = 'page:' + rel;
  const req = upsertReq(reqs, sourceKey, { idPrefix:'REQ-PAGE', fields:{ type:'Functional', title:'זמינות עמוד: ' + rel, description:'העמוד ' + rel + ' צריך להיטען ללא 404 וללא מסך ריק.', priority: rel === 'index.html' ? 'P0' : 'P1', acceptanceCriteria:['העמוד מחזיר HTTP תקין','ה-body אינו ריק','אין שגיאת console חמורה בטעינה'], source:'Auto sync from site scan' } });
  const tc = upsertTest(tests, 'test:' + sourceKey, { idPrefix:'TC-PAGE', fields:{ title:'Smoke לעמוד ' + rel, requirementIds:[req.id], type:'UI', priority:req.priority, preconditions:['שרת אתר הקורס המקומי פעיל'], steps:['פתח את ' + rel, 'בדוק שהעמוד נטען'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:true, script:'tests/playwright/smoke.spec.js' }, coveredFiles:[rel] } });
  seenReq.add(sourceKey); seenTest.add(tc.sourceKey);
}
for (const rel of jsFiles) {
  const sourceKey = 'code:' + rel;
  const req = upsertReq(reqs, sourceKey, { idPrefix:'REQ-CODE', fields:{ type:'Functional', title:'תקינות מודול קוד: ' + rel, description:'קובץ JS צריך לעבור בדיקת תחביר ולהיטען ללא שבירת האתר.', priority:'P1', acceptanceCriteria:['node --check עובר','המודול אינו יוצר שגיאת console חמורה'], source:'Auto sync from JS scan' } });
  const tc = upsertTest(tests, 'test:' + sourceKey, { idPrefix:'TC-CODE', fields:{ title:'Syntax למודול ' + rel, requirementIds:[req.id], type:'Functional', priority:'P1', preconditions:['Node זמין'], steps:['הרץ node --check על הקובץ'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:true, script:'scripts/scan-site.js' }, coveredFiles:[rel] } });
  seenReq.add(sourceKey); seenTest.add(tc.sourceKey);
}
const exam = loadWindowData('data/exam-questions.js', 'EXAM_QUESTIONS') || [];
if (Array.isArray(exam) && exam.length) {
  const req = upsertReq(reqs, 'exam:question-quality', { idPrefix:'REQ-EXAM', fields:{ type:'Exam', title:'איכות מאגר שאלות מבחן', description:'כל שאלת מבחן צריכה לכלול שיוך שיעור, רמת קושי, הסבר ולפחות ארבע אפשרויות.', priority:'P0', acceptanceCriteria:['אין כפילויות משמעותיות','לכל שאלה relatedLessonId','לכל שאלה difficulty','לכל שאלה explanation','לכל שאלה לפחות 4 options'], source:'Auto sync from exam-questions.js', metrics:{ questionCount: exam.length } } });
  const tc = upsertTest(tests, 'test:exam:question-quality', { idPrefix:'TC-EXAM', fields:{ title:'בדיקת איכות מאגר שאלות מבחן', requirementIds:[req.id], type:'Content', priority:'P0', preconditions:['data/exam-questions.js קיים'], steps:['טען את מאגר השאלות','בדוק שדות חובה','בדוק כפילויות'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:true, script:'scripts/audit-questions-quality.js' }, coveredFiles:['data/exam-questions.js'] } });
  seenReq.add('exam:question-quality'); seenTest.add(tc.sourceKey);
}
const game = loadWindowData('data/game-data.js', 'gameChallenges') || loadWindowData('data/game-data.js', 'GAME_CHALLENGES') || [];
if (Array.isArray(game) && game.length) {
  const req = upsertReq(reqs, 'game:challenge-quality', { idPrefix:'REQ-GAME', fields:{ type:'Game', title:'איכות אתגר בטיחות', description:'מודול המשחק צריך לכלול רמות קושי, XP, שאלות, תוצאות ושמירת טעויות.', priority:'P1', acceptanceCriteria:['קיימים אתגרים למשחק','קיימת רמת קושי','קיימים הסברים/רמזים','טעויות נשמרות לחזרה'], source:'Auto sync from game-data.js', metrics:{ challengeCount: game.length } } });
  const tc = upsertTest(tests, 'test:game:challenge-quality', { idPrefix:'TC-GAME', fields:{ title:'בדיקת נתוני אתגר בטיחות', requirementIds:[req.id], type:'Functional', priority:'P1', preconditions:['data/game-data.js קיים'], steps:['טען נתוני משחק','בדוק שדות חובה'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:true, script:'tests/playwright/safety-game.spec.js' }, coveredFiles:['data/game-data.js'] } });
  seenReq.add('game:challenge-quality'); seenTest.add(tc.sourceKey);
}
const versions = loadWindowData('data/site-versions.js', 'SITE_VERSIONS') || [];
if (Array.isArray(versions) && versions.length) {
  const req = upsertReq(reqs, 'release:site-versions', { idPrefix:'REQ-REL', fields:{ type:'Admin', title:'תיעוד גרסאות ושינויים', description:'כל שינוי משמעותי באתר צריך להופיע בניהול גרסאות ובדוח שחרור.', priority:'P1', acceptanceCriteria:['קיימת לפחות גרסה אחת','לכל גרסה כותרת ותאריך','גרסה חדשה אינה מוחקת היסטוריה קיימת'], source:'Auto sync from site-versions.js', metrics:{ versionCount: versions.length } } });
  const tc = upsertTest(tests, 'test:release:site-versions', { idPrefix:'TC-REL', fields:{ title:'בדיקת קובץ גרסאות אתר', requirementIds:[req.id], type:'Admin', priority:'P1', preconditions:['data/site-versions.js קיים'], steps:['טען גרסאות','בדוק שדות חובה'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:true, script:'tests/playwright/admin.spec.js' }, coveredFiles:['data/site-versions.js'] } });
  seenReq.add('release:site-versions'); seenTest.add(tc.sourceKey);
}
for (const rel of ['firestore.rules']) {
  if (fs.existsSync(path.join(siteRoot, rel))) {
    const req = upsertReq(reqs, 'security:' + rel, { idPrefix:'REQ-SEC', fields:{ type:'Security', title:'תקינות הרשאות ' + rel, description:'קובץ הרשאות צריך להגן מפני כתיבה ציבורית ולשמור על הפרדת משתמשים.', priority:'P0', acceptanceCriteria:['אין public write','משתמש רגיל לא משנה role/status','אדמין מוגבל לפי הרשאות'], source:'Auto sync from firestore.rules' } });
    const tc = upsertTest(tests, 'test:security:' + rel, { idPrefix:'TC-SEC', fields:{ title:'בדיקת הרשאות ' + rel, requirementIds:[req.id], type:'Security', priority:'P0', preconditions:[rel + ' קיים'], steps:['סרוק את rules','בדוק שאין public write'], expectedResults:req.acceptanceCriteria, actualResults:'', automation:{ automated:false, script:'' }, coveredFiles:[rel] } });
    seenReq.add('security:' + rel); seenTest.add(tc.sourceKey);
  }
}
for (const r of reqs) if (r.origin === 'auto' && !seenReq.has(r.sourceKey)) r.status = 'stale';
for (const t of tests) if (t.origin === 'auto' && !seenTest.has(t.sourceKey)) t.status = 'stale';
writeJson('data/requirements.json', reqs);
writeJson('data/test-cases.json', tests);
fs.writeFileSync(path.join(qaRoot, 'data/sync-status.json'), JSON.stringify({ lastSyncAt: now, message:'זוהו שינויים חדשים באתר. נוצרו/עודכנו דרישות ובדיקות.', requirements:reqs.length, tests:tests.length }, null, 2), 'utf8');
console.log('Sync complete:', reqs.length, 'requirements,', tests.length, 'tests');
