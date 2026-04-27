import { apiRequest } from "../../lib/api";

export const login = (payload) =>
  apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const register = (payload) =>
  apiRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getMe = () => apiRequest("/auth/me");

export const updateMe = (payload) =>
  apiRequest("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
