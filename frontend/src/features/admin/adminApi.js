import { apiRequest } from "../../lib/api";

export const adminListDocuments = () => apiRequest("/admin/documents");

export const adminGetDocument = (id) => apiRequest(`/admin/documents/${id}`);

export const adminGetTimeline = (id) => apiRequest(`/admin/documents/${id}/timeline`);
