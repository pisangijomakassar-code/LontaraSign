import { apiRequest } from "../../lib/api";

export const uploadDocument = (file, title) => {
  const fd = new FormData();
  fd.append("file", file);
  if (title) fd.append("title", title);
  return apiRequest("/documents/upload", { method: "POST", body: fd });
};

export const listDocuments = () => apiRequest("/documents");

export const getDocument = (id) => apiRequest(`/documents/${id}`);
