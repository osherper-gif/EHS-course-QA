import { kpi, table } from "../components.js";
import { routeTitle } from "../router.js";
import { escapeHtml, formatNumber, statusBadge } from "../utils.js";

function sampleRows(route, appState) {
  if (route === "requirements") {
    return table(["ID", "סוג", "עדיפות", "כותרת"], (appState.requirements || []).slice(0, 8).map((item) => [
      escapeHtml(item.id),
      escapeHtml(item.type),
      escapeHtml(item.priority),
      escapeHtml(item.title),
    ]));
  }
  if (route === "tests") {
    return table(["ID", "סוג", "סטטוס", "כותרת"], (appState.testCases || []).slice(0, 8).map((item) => [
      escapeHtml(item.id),
      escapeHtml(item.type),
      statusBadge(item.status),
      escapeHtml(item.title),
    ]));
  }
  if (route === "runs") {
    return table(["ID", "סטטוס", "עברו", "נכשלו"], (appState.testRuns || []).slice(-8).reverse().map((item) => [
      escapeHtml(item.id),
      statusBadge(item.status),
      escapeHtml(item.passed || 0),
      escapeHtml(item.failed || 0),
    ]));
  }
  if (route === "coverage") {
    const files = appState.coverage?.files || {};
    return table(["מדד", "ערך"], [
      ["קבצים סה\"כ", escapeHtml(files.total || 0)],
      ["קבצים מכוסים", escapeHtml(files.covered || 0)],
      ["אחוז כיסוי", escapeHtml(`${files.percent || 0}%`)],
      ["קבצים ללא כיסוי", escapeHtml((files.uncoveredFiles || []).length)],
    ]);
  }
  return "";
}

export function placeholderView(route, appState) {
  const title = routeTitle(route);
  const summary = appState.summary || {};
  const relevant = route === "requirements" ? summary.requirementsTotal :
    route === "tests" ? summary.testsTotal :
    route === "runs" ? (appState.testRuns || []).length :
    route === "coverage" ? appState.coverage?.files?.total :
    route === "traceability" ? summary.requirementsWithoutTests + summary.testsWithoutRequirements :
    route === "reports" ? "PDF/JSON" : "-";

  return `
    <section class="qa-page-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p>המסך ישודרג ב-Wave הבא. בינתיים מוצגת תצוגת בסיס כדי שלא יישאר מסך ריק.</p>
      </div>
    </section>
    <section class="qa-grid qa-grid--three">
      ${kpi("מדד רלוונטי", formatNumber(relevant), "נתון בסיסי מה-JSON המקומי")}
      ${kpi("דרישות", formatNumber(summary.requirementsTotal), `${formatNumber(summary.requirementsCovered)} מכוסות`)}
      ${kpi("בדיקות", formatNumber(summary.testsTotal), `${formatNumber(summary.testsAutomated)} אוטומטיות`)}
    </section>
    <section class="qa-card" style="margin-top:1rem">
      <h2>תצוגת בסיס</h2>
      ${sampleRows(route, appState) || `<div class="qa-empty">התצוגה המלאה תתווסף ב-Wave הבא.</div>`}
    </section>
  `;
}
