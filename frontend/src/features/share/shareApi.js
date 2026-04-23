import { apiRequest } from "../../lib/api";

export const shareDocument = (id, payload) =>
  apiRequest(`/documents/${id}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getShareHistory = (id) =>
  apiRequest(`/documents/${id}/share-history`);

export const getLogs = (id) => apiRequest(`/documents/${id}/logs`);

export const verifyDocument = (id) =>
  apiRequest(`/verify/${id}`, { headers: {} });
