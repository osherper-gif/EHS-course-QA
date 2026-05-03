import { button, kpi, progress, runStatus, table } from "../components.js";
import { escapeHtml, formatDate, formatDuration, formatNumber, formatPercent, statusBadge } from "../utils.js";

function testsByStatus(testCases) {
  return {
    pass: testCases.filter((test) => test.status === "pass").length,
    fail: testCases.filter((test) => test.status === "fail").length,
    notRun: testCases.filter((test) => !test.status || test.status === "not_run").length,
  };
}

function alerts(appState) {
  const summary = appState.summary || {};
  const coverage = appState.coverage || {};
  const lastRuns = appState.testRuns || [];
  const failedRun = lastRuns.slice().reverse().find((run) => run.status === "fail");
  const uncoveredFiles = coverage.files?.uncoveredFiles?.length || 0;
  return [
    {
      type: summary.requirementsWithoutTests ? "warning" : "pass",
      title: "דרישות ללא בדיקות",
      value: summary.requirementsWithoutTests || 0,
      text: summary.requirementsWithoutTests ? "נדרש להשלים עקיבות" : "כל הדרישות מקושרות",
    },
    {
      type: summary.testsWithoutRequirements ? "warning" : "pass",
      title: "בדיקות ללא דרישה",
      value: summary.testsWithoutRequirements || 0,
      text: summary.testsWithoutRequirements ? "יש לשייך בדיקות לדרישות" : "כל הבדיקות משויכות",
    },
    {
      type: uncoveredFiles ? "warning" : "pass",
      title: "קבצים ללא כיסוי",
      value: uncoveredFiles,
      text: uncoveredFiles ? "מומלץ להוסיף בדיקות smoke/module" : "כיסוי קבצים מלא",
    },
    {
      type: failedRun ? "fail" : "pass",
      title: "כשלונות אחרונים",
      value: failedRun ? failedRun.failed || 1 : 0,
      text: failedRun ? `הרצה אחרונה שנכשלה: ${formatDate(failedRun.finishedAt || failedRun.startedAt)}` : "לא נמצאו כשלונות אחרונים",
    },
  ];
}

function alertList(appState) {
  return alerts(appState).map((alert) => `
    <article class="qa-alert qa-alert--${alert.type}">
      <span class="qa-alert__mark" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(alert.title)}</strong>
        <p>${escapeHtml(alert.text)}</p>
      </div>
      <span class="qa-chip">${formatNumber(alert.value)}</span>
    </article>
  `).join("");
}

function recentRuns(runs) {
  const rows = (runs || []).slice(-6).reverse().map((run) => [
    escapeHtml(formatDate(run.startedAt)),
    runStatus(run),
    escapeHtml(`${formatNumber(run.passed || 0)} / ${formatNumber(run.failed || 0)}`),
    escapeHtml(formatDuration(run.durationMs)),
    run.output ? `<button class="qa-button qa-button--secondary" data-run-output="${escapeHtml(run.id || "")}">פרטים</button>` : "-",
  ]);
  return table(["תאריך", "סטטוס", "עבר/נכשל", "משך", "פרטים"], rows);
}

function coverageSummary(appState) {
  const coverage = appState.coverage || {};
  const byType = coverage.byType || {};
  const rows = Object.entries(byType).slice(0, 7).map(([type, item]) => [
    escapeHtml(type),
    escapeHtml(formatNumber(item.total)),
    escapeHtml(formatNumber(item.covered)),
    `${progress(item.percent)}<strong>${formatPercent(item.percent)}</strong>`,
  ]);
  if (!rows.length) {
    rows.push(["דרישות", escapeHtml(formatNumber(appState.summary?.requirementsTotal)), escapeHtml(formatNumber(appState.summary?.requirementsCovered)), `${progress(appState.summary?.requirementsCoverage)}<strong>${formatPercent(appState.summary?.requirementsCoverage)}</strong>`]);
  }
  return table(["תחום", "סה\"כ", "מכוסה", "אחוז"], rows);
}

export function dashboardView(appState) {
  const summary = appState.summary || {};
  const coverage = appState.coverage || {};
  const status = testsByStatus(appState.testCases || []);
  const lastRun = (appState.testRuns || []).slice(-1)[0] || (summary.runs || [])[0];
  return `
    <section class="qa-page-head">
      <div>
        <h1>Dashboard</h1>
        <p>תמונת מצב של דרישות, בדיקות, כיסוי והרצות אחרונות.</p>
      </div>
      <div class="qa-status-line">
        <span class="qa-chip">QA: ${summary.qaRunning ? "רץ" : "לא ידוע"}</span>
        <span class="qa-chip">אתר קורס: ${summary.courseRunning ? "רץ" : "לא רץ/לא ידוע"}</span>
      </div>
    </section>

    <section class="qa-grid qa-grid--kpi">
      ${kpi("סך דרישות", formatNumber(summary.requirementsTotal), `${formatNumber(summary.requirementsCovered)} מכוסות`)}
      ${kpi("כיסוי דרישות", formatPercent(summary.requirementsCoverage), `${formatNumber(summary.requirementsWithoutTests)} ללא בדיקות`)}
      ${kpi("סך בדיקות", formatNumber(summary.testsTotal), `${formatNumber(summary.testsAutomated)} אוטומטיות`)}
      ${kpi("כיסוי קבצים", formatPercent(coverage.files?.percent), `${formatNumber(coverage.files?.covered)} מתוך ${formatNumber(coverage.files?.total)}`)}
      ${kpi("עברו", formatNumber(status.pass || summary.testsPassed), "בדיקות שסומנו pass")}
      ${kpi("נכשלו", formatNumber(status.fail), "בדיקות שסומנו fail")}
      ${kpi("לא הורצו", formatNumber(status.notRun), "דורשות הרצה/עדכון")}
      ${kpi("הרצה אחרונה", lastRun ? (lastRun.status === "pass" ? "PASS" : "FAIL") : "-", lastRun ? formatDate(lastRun.finishedAt || lastRun.startedAt) : "אין הרצות")}
    </section>

    <section class="qa-grid qa-grid--two" style="margin-top:1rem">
      <article class="qa-card">
        <h2>פעולות מהירות</h2>
        <p>הפעולות מפעילות את ה-endpoints המקומיים הקיימים ושומרות הכול ב-JSON מקומי.</p>
        <div class="qa-actions">
          ${button("סנכרן מהאתר", "sync", { secondary: true, busy: appState.action === "sync" })}
          ${button("הרץ בדיקות", "test", { secondary: true, busy: appState.action === "test" })}
          ${button("הרץ הכל", "all", { busy: appState.action === "all" })}
          ${button("צור PDF", "report", { secondary: true, busy: appState.action === "report" })}
          ${button("פתח דוח אחרון", "open-report", { secondary: true })}
        </div>
        <div id="actionOutput" class="qa-run-output" hidden></div>
      </article>
      <article class="qa-card">
        <h2>התראות</h2>
        <div class="qa-alert-list">${alertList(appState)}</div>
      </article>
    </section>

    <section class="qa-grid qa-grid--two" style="margin-top:1rem">
      <article class="qa-card">
        <h2>Recent runs</h2>
        ${recentRuns(appState.testRuns)}
      </article>
      <article class="qa-card">
        <h2>Coverage summary</h2>
        ${coverageSummary(appState)}
      </article>
    </section>
  `;
}
