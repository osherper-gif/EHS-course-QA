# מערכת QA מקומית - הפעלה וסנכרון

## הפעלה בלחיצה אחת

בתיקייה:

`C:\Users\Administrator\Desktop\קורס ממונה בטיחות\QA_System`

להריץ או ללחוץ פעמיים:

- `start-qa.cmd`
- או PowerShell: `./start-qa.ps1`

ה-launcher מבצע אוטומטית:

1. בדיקת Node.js.
2. התקנת dependencies אם `node_modules` חסר.
3. הפעלת שרת סטטי לאתר הקורס.
4. הפעלת Dashboard של מערכת QA.
5. בחירת פורטים פנויים אם 8080/9090 תפוסים.
6. כתיבת `.qa-runtime.json` עם הפורטים וה-PIDs.
7. פתיחת דפדפן ל-Dashboard.

## פורטים

ברירת מחדל:

- אתר הקורס: `http://localhost:8080`
- Dashboard QA: `http://localhost:9090`

אם הפורטים תפוסים, ייבחרו פורטים עוקבים פנויים, והכתובות יישמרו ב־`.qa-runtime.json`.

## עצירה

להריץ:

`stop-qa.cmd`

הקובץ סוגר את התהליכים שה-launcher פתח לפי `.qa-runtime.json`.

## npm scripts

- `npm run qa:start` - מפעיל את סביבת QA.
- `npm run qa:scan` - מסנכרן מהאתר ומחשב כיסוי.
- `npm run qa:test` - מריץ Playwright מול אתר מקומי.
- `npm run qa:report` - מפיק PDF.
- `npm run qa:all` - sync + scan + test + coverage + report.
- `npm run qa:watch` - מאזין לשינויים באתר ומעדכן דרישות/בדיקות/כיסוי.

## איך sync אוטומטי עובד

`scripts/sync-from-site.js` סורק את אתר הקורס:

- עמודי HTML.
- קבצי JS.
- `data/exam-questions.js`.
- `data/game-data.js`.
- `data/site-versions.js`.
- `firestore.rules` אם קיים.

הוא יוצר דרישות ובדיקות אוטומטיות עם:

- `origin: "auto"`
- `sourceKey`
- `lastSeen`
- `status: "active"`

אם פריט אוטומטי כבר לא נמצא באתר, הוא יסומן `stale` ולא יימחק.

## דרישות ידניות

דרישה ידנית צריכה לכלול:

```json
{
  "id": "REQ-MANUAL-001",
  "origin": "manual",
  "type": "Functional",
  "title": "כותרת הדרישה",
  "description": "תיאור",
  "priority": "P1",
  "acceptanceCriteria": [],
  "source": "Manual QA",
  "status": "active"
}
```

ה-sync לא מוחק דרישות או בדיקות ידניות.

## הפקת PDF

```powershell
npm run qa:report
```

הדוח יישמר ב:

`reports/pdf/QA_Report_YYYY-MM-DD_HH-mm.pdf`

## לא להריץ בטעות מול Production

ברירת המחדל של הבדיקות היא אתר מקומי שה-launcher מעלה.

אל תגדיר `TARGET_URL=https://ehs-course.web.app` אלא אם אתה רוצה במפורש לבדוק את סביבת production.
