const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "lontara_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const buildHeaders = (extra = {}) => {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
};

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers || {}),
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json() : await res.blob();
  if (!res.ok) throw payload;
  return payload;
}

export async function apiDownload(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(),
  });
  if (!res.ok) {
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    throw isJson ? await res.json() : { message: "Download gagal" };
  }
  return res.blob();
}
