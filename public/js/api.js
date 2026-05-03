async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `API request failed: ${response.status}`);
  }
  return data;
}

export const api = {
  summary: () => request("/api/summary"),
  requirements: () => request("/api/requirements"),
  testCases: () => request("/api/test-cases"),
  testRuns: () => request("/api/test-runs"),
  coverage: () => request("/api/coverage"),
  action: (name) => request(`/api/actions/${encodeURIComponent(name)}`, { method: "POST" }),
};
