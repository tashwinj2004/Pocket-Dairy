export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? "/api/backend"
    : "http://localhost:9091");

// ── Session helpers (localStorage) ────────────────────────────

export function session() {
  try {
    return JSON.parse(localStorage.getItem("pocket_dairy_session"));
  } catch {
    return null;
  }
}

export function saveSession(value) {
  localStorage.setItem(
    "pocket_dairy_session",
    JSON.stringify({
      ...value,
      expiresAt: Date.now() + 15 * 86_400_000,
    })
  );
}

export function clearSession() {
  localStorage.removeItem("pocket_dairy_session");
}

// ── Authenticated fetch wrapper ────────────────────────────────

export async function api(path, options = {}) {
  const token = session()?.access_token;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Request failed");
  }

  // 204 No Content → return null instead of trying to parse empty body
  return response.status === 204 ? null : response.json();
}
