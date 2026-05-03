import { routes, navigate, routeTitle } from "./router.js";
import { escapeHtml, statusBadge } from "./utils.js";

export function button(label, action, options = {}) {
  const disabled = options.busy ? " disabled" : "";
  const variant = options.secondary ? " qa-button--secondary" : "";
  return `<button class="qa-button${variant}" data-action="${escapeHtml(action)}"${disabled}>${escapeHtml(options.busy ? "מריץ..." : label)}</button>`;
}

export function progress(value) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return `<div class="qa-progress" aria-label="כיסוי ${safeValue}%"><span style="--value:${safeValue}%"></span></div>`;
}

export function kpi(label, value, hint = "") {
  return `
    <article class="qa-card qa-kpi">
      <span class="qa-kpi__label">${escapeHtml(label)}</span>
      <strong class="qa-kpi__value">${escapeHtml(value)}</strong>
      <span class="qa-kpi__hint">${escapeHtml(hint)}</span>
    </article>
  `;
}

export function table(headers, rows) {
  if (!rows.length) return `<div class="qa-empty">אין נתונים להצגה כרגע.</div>`;
  return `
    <table class="qa-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr>${row.map((cell, index) => `<td data-label="${escapeHtml(headers[index])}">${cell ?? ""}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export function shell(viewHtml, appState) {
  const summary = appState.summary || {};
  const targetUrl = summary.targetUrl || "לא ידוע";
  const activeRoute = appState.route;
  return `
    <div class="qa-shell">
      <aside class="qa-sidebar">
        <div class="qa-brand">
          <strong>QA System</strong>
          <span>מערכת בדיקות מקומית</span>
        </div>
        <nav class="qa-nav" aria-label="ניווט QA">
          ${routes.map((route) => `
            <button class="qa-nav__item ${activeRoute === route.id ? "is-active" : ""}" data-route="${route.id}" type="button">
              <span class="qa-nav__icon" aria-hidden="true">${route.icon}</span>
              <span>${route.label}</span>
            </button>
          `).join("")}
        </nav>
        <div class="qa-sidebar__meta">
          <strong>Target URL</strong>
          <div>${escapeHtml(targetUrl)}</div>
        </div>
      </aside>
      <section class="qa-main">
        <header class="qa-topbar">
          <div class="qa-topbar__title">
            <strong>QA System</strong>
            <span class="qa-target">${escapeHtml(targetUrl)}</span>
          </div>
          <div class="qa-topbar__actions">
            ${button("סנכרן", "sync", { secondary: true, busy: appState.action === "sync" })}
            ${button("הרץ הכל", "all", { busy: appState.action === "all" })}
            ${button("צור PDF", "report", { secondary: true, busy: appState.action === "report" })}
          </div>
        </header>
        <main class="qa-content">
          <div class="qa-breadcrumb">QA System / ${escapeHtml(routeTitle(activeRoute))}</div>
          ${viewHtml}
        </main>
      </section>
    </div>
  `;
}

export function bindShellEvents(root) {
  root.querySelectorAll("[data-route]").forEach((item) => {
    item.addEventListener("click", () => navigate(item.dataset.route));
  });
}

export function toast(message, type = "info") {
  const host = document.getElementById("toastRoot");
  if (!host) return;
  const item = document.createElement("div");
  item.className = `qa-toast qa-toast--${type}`;
  item.textContent = message;
  host.append(item);
  window.setTimeout(() => item.remove(), 4500);
}

export function runStatus(run) {
  return statusBadge(run?.status || "unknown");
}
