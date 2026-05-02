# QA_System

מערכת QA מקומית לאתר קורס ממונה בטיחות. המערכת רצה מקומית בלבד, שומרת נתונים בקבצי JSON, ואינה משתמשת ב-Firebase כבסיס נתונים לבדיקות.

## הפעלה מהירה

לחיצה כפולה על:

```text
start-qa.cmd
```

הפקודה תעלה אוטומטית:

- שרת מקומי לאתר הקורס, בדרך כלל `http://localhost:8080`
- Dashboard של מערכת QA, בדרך כלל `http://localhost:9090`
- דפדפן ל-Dashboard

אם פורט תפוס, ייבחר פורט פנוי והפרטים יישמרו בקובץ `.qa-runtime.json`.

## הרצת כל תהליך ה-QA

```powershell
npm run qa:all
```

הפקודה מריצה:

- sync מהאתר
- scan
- בדיקות Playwright
- חישוב coverage
- יצירת דוח PDF

## הפקת PDF בלבד

```powershell
npm run qa:report
```

הדוח נוצר בתיקייה:

```text
reports/pdf/
```

## עצירה

```text
stop-qa.cmd
```

## אזהרה חשובה

ברירת המחדל היא בדיקה מול אתר מקומי. אין להריץ מול Firebase production כברירת מחדל. שימוש ב-`TARGET_URL=https://ehs-course.web.app` מיועד לבדיקה ידנית ומודעת בלבד.
