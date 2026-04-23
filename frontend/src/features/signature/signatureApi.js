import { apiDownload, apiRequest } from "../../lib/api";

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
