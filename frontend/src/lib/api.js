const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const TOKEN_KEY = "lontara_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const buildHeaders = (extra = {}) => {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

// Auto-logout + redirect ke /login saat token tidak valid (session hilang karena backend restart, dll).
function handleAuthFailure() {
  clearToken();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    // Pakai setTimeout supaya error masih bisa di-throw ke caller sebelum redirect
    setTimeout(() => { window.location.href = "/login"; }, 50);
  }
}

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers || {}),
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json() : await res.blob();
  if (!res.ok) {
    if (res.status === 401) handleAuthFailure();
    throw payload;
  }
  return payload;
}

export async function apiDownload(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) handleAuthFailure();
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    throw isJson ? await res.json() : { message: "Download gagal" };
  }
  return res.blob();
}
