import { apiDownload, apiRequest, getToken } from "../../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const uploadDrawSignature = (id, image_base64) =>
  apiRequest(`/documents/${id}/signature/draw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64 }),
  });

export const uploadSignatureImage = (id, file) => {
  const fd = new FormData();
  fd.append("signature_image", file);
  return apiRequest(`/documents/${id}/signature/upload-image`, { method: "POST", body: fd });
};

export const finalizeSign = (id, payload) =>
  apiRequest(`/documents/${id}/sign-finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const downloadSignedDocument = (id) =>
  apiDownload(`/documents/${id}/download-signed`);

export const getPagePreview = async (id) => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/documents/${id}/page-preview`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Gagal memuat preview halaman PDF");
  const pageWidth = parseFloat(res.headers.get("X-Page-Width") || "595");
  const pageHeight = parseFloat(res.headers.get("X-Page-Height") || "842");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { url, pageWidth, pageHeight };
};

// Saved signatures
export const listSavedSignatures = () =>
  apiRequest("/users/me/signatures");

export const saveSignatureDraw = (image_base64, label = "Default") => {
  const fd = new FormData();
  fd.append("image_base64", image_base64);
  fd.append("label", label);
  return apiRequest("/users/me/signatures/draw", { method: "POST", body: fd });
};

export const saveSignatureUpload = (file, label = "Default") => {
  const fd = new FormData();
  fd.append("signature_image", file);
  fd.append("label", label);
  return apiRequest("/users/me/signatures/upload", { method: "POST", body: fd });
};

export const deleteSavedSignature = (sigId) =>
  apiRequest(`/users/me/signatures/${sigId}`, { method: "DELETE" });
