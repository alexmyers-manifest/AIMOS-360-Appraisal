import { getStoredToken, setStoredToken } from "./auth.js";

async function request(path, opts = {}) {
  const token = getStoredToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    setStoredToken(null);
    throw new Error("Session expired. Please sign in again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  me: () => request("/api/me"),
  generate: (type, data) =>
    request("/api/generate", {
      method: "POST",
      body: JSON.stringify({ type, data }),
    }),
  listAllowlist: () => request("/api/allowlist"),
  addAllowlist: (email) =>
    request("/api/allowlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  removeAllowlist: (email) =>
    request("/api/allowlist?email=" + encodeURIComponent(email), {
      method: "DELETE",
    }),
};
