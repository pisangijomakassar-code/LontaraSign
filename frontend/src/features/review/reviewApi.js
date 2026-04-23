import { apiRequest } from "../../lib/api";

export const triggerReview = (id) =>
  apiRequest(`/documents/${id}/review`, { method: "POST" });

export const getReviewResult = (id) =>
  apiRequest(`/documents/${id}/review-result`);

export const markRevision = (id, note) =>
  apiRequest(`/documents/${id}/mark-revision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

export const approveDocument = (id, note) =>
  apiRequest(`/documents/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
