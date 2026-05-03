import { setState, state } from "./state.js";

export const routes = [
  { id: "dashboard", label: "Dashboard", icon: "▦", title: "Dashboard" },
  { id: "requirements", label: "Requirements", icon: "□", title: "דרישות" },
  { id: "tests", label: "Test Cases", icon: "✓", title: "בדיקות" },
  { id: "runs", label: "Test Runs", icon: "↻", title: "הרצות בדיקה" },
  { id: "traceability", label: "Traceability", icon: "⇄", title: "עקיבות" },
  { id: "coverage", label: "Coverage", icon: "◔", title: "כיסוי" },
  { id: "reports", label: "Reports", icon: "▤", title: "דוחות" },
];

export function currentRoute() {
  const value = location.hash.replace("#/", "") || "dashboard";
  return routes.some((route) => route.id === value) ? value : "dashboard";
}

export function navigate(routeId) {
  if (state.route === routeId) return;
  location.hash = `#/${routeId}`;
}

export function initRouter() {
  const update = () => setState({ route: currentRoute() });
  window.addEventListener("hashchange", update);
  update();
}

export function routeTitle(routeId = state.route) {
  return routes.find((route) => route.id === routeId)?.title || "Dashboard";
}
