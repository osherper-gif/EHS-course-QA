import { bindShellEvents, shell, toast } from "./components.js";
import { initRouter } from "./router.js";
import { loadAll, runAction, state, subscribe } from "./state.js";
import { dashboardView } from "./views/dashboard.js";
import { placeholderView } from "./views/placeholder-view.js";

const root = document.getElementById("app");

function loadingView() {
  return `
    <div class="qa-boot">
      <div class="qa-skeleton"></div>
      <p>טוען נתוני QA...</p>
    </div>
  `;
}

function errorView(message) {
  return `
    <section class="qa-empty">
      <div>
        <h1>טעינת הנתונים נכשלה</h1>
        <p>${message || "אירעה שגיאה לא צפויה."}</p>
        <button class="qa-button" data-action="reload">נסה שוב</button>
      </div>
    </section>
  `;
}

function currentView(appState) {
  if (appState.route === "dashboard") return dashboardView(appState);
  return placeholderView(appState.route, appState);
}

function render(appState) {
  if (appState.loading && !appState.summary) {
    root.innerHTML = loadingView();
    return;
  }
  if (appState.error && !appState.summary) {
    root.innerHTML = errorView(appState.error);
    bindActions(root);
    return;
  }
  root.innerHTML = shell(currentView(appState), appState);
  bindShellEvents(root);
  bindActions(root);
}

function actionLabel(name) {
  return {
    sync: "סנכרון",
    scan: "סריקה",
    test: "הרצת בדיקות",
    report: "יצירת PDF",
    all: "הרצת הכול",
    "open-report": "פתיחת דוח אחרון",
  }[name] || name;
}

async function executeAction(name) {
  if (state.action) return;
  if (name === "reload") {
    await loadAll();
    return;
  }
  if (name === "open-report") {
    toast("פתיחת דוח אחרון תתווסף לאחר endpoint דוחות ב-Wave הבא", "info");
    return;
  }
  try {
    toast(`${actionLabel(name)} התחיל...`);
    const result = await runAction(name);
    const output = document.getElementById("actionOutput");
    if (output && result?.output) {
      output.hidden = false;
      output.textContent = result.output.slice(-8000);
    }
    if (Number(result?.code || 0) === 0) {
      toast(`${actionLabel(name)} הסתיים בהצלחה`, "success");
    } else {
      toast(`${actionLabel(name)} הסתיים עם קוד ${result.code}`, "error");
    }
  } catch (error) {
    toast(error.message || "הפעולה נכשלה", "error");
  }
}

function bindActions(host) {
  host.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => executeAction(button.dataset.action));
  });
  host.querySelectorAll("[data-run-output]").forEach((button) => {
    button.addEventListener("click", () => {
      const run = (state.testRuns || []).find((item) => item.id === button.dataset.runOutput);
      if (!run?.output) {
        toast("לא נמצא פלט להרצה זו", "error");
        return;
      }
      const output = document.getElementById("actionOutput");
      if (output) {
        output.hidden = false;
        output.textContent = run.output.slice(-8000);
        output.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        toast("פלט ההרצה יוצג במסך Dashboard", "info");
      }
    });
  });
}

subscribe(render);
initRouter();
loadAll();
