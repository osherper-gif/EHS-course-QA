export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("he-IL").format(Number(value || 0));
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDuration(ms) {
  const value = Number(ms || 0);
  if (!value) return "-";
  if (value < 1000) return `${value}ms`;
  return `${Math.round(value / 100) / 10}s`;
}

export function statusBadge(status) {
  const normalized = String(status || "unknown").toLowerCase();
  const variant = normalized === "pass" ? "pass" :
    normalized === "fail" || normalized === "failed" ? "fail" :
    normalized === "warning" ? "warning" : "info";
  const label = {
    pass: "עבר",
    fail: "נכשל",
    failed: "נכשל",
    not_run: "לא הורץ",
    blocked: "חסום",
    unknown: "לא ידוע",
  }[normalized] || status || "לא ידוע";
  return `<span class="qa-badge qa-badge--${variant}">${escapeHtml(label)}</span>`;
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}
