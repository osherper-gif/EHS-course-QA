import { api } from "./api.js";

const listeners = new Set();

export const state = {
  route: "dashboard",
  loading: true,
  action: null,
  error: null,
  summary: null,
  requirements: [],
  testCases: [],
  testRuns: [],
  coverage: {},
};

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((listener) => listener(state));
}

export async function loadAll() {
  setState({ loading: true, error: null });
  try {
    const [summary, requirements, testCases, testRuns, coverage] = await Promise.all([
      api.summary(),
      api.requirements(),
      api.testCases(),
      api.testRuns(),
      api.coverage(),
    ]);
    setState({
      summary,
      requirements,
      testCases,
      testRuns,
      coverage,
      loading: false,
      error: null,
    });
  } catch (error) {
    setState({ loading: false, error: error.message || "טעינת הנתונים נכשלה" });
  }
}

export async function runAction(name) {
  setState({ action: name, error: null });
  try {
    const result = await api.action(name);
    await loadAll();
    setState({ action: null });
    return result;
  } catch (error) {
    setState({ action: null, error: error.message || "הפעולה נכשלה" });
    throw error;
  }
}
