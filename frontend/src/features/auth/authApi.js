import { apiRequest } from "../../lib/api";

export const login = (payload) =>
  apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getMe = () => apiRequest("/auth/me");
