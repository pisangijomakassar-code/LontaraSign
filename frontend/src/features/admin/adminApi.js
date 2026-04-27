import { apiRequest } from "../../lib/api";

export const adminStats = () => apiRequest("/admin/stats");

export const adminListDocuments = () => apiRequest("/admin/documents");
export const adminGetDocument = (id) => apiRequest(`/admin/documents/${id}`);
export const adminGetTimeline = (id) => apiRequest(`/admin/documents/${id}/timeline`);

export const adminListUsers = () => apiRequest("/admin/users");
export const adminPatchUser = (id, payload) =>
  apiRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const adminGetSettings = () => apiRequest("/admin/settings");

export const adminPatchSettings = (payload) =>
  apiRequest("/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
