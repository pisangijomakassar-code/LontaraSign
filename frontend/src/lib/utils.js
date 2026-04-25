export const getErrorMessage = (err) =>
  err?.detail?.message || err?.message || "Terjadi kesalahan";

export function downloadBlob(blob, fileName = "document.pdf") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Delay revoke so browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const toBase64FromCanvas = (canvas) => canvas.toDataURL("image/png");

export const STATUS_LABELS = {
  draft_uploaded: "Diunggah",
  reviewed_by_ai: "Sudah di-review AI",
  needs_revision: "Perlu Revisi",
  approved: "Disetujui",
  pending_sign: "Menunggu Tanda Tangan",
  signed: "Sudah Ditandatangani",
};

export const STATUS_COLORS = {
  draft_uploaded: "bg-slate-100 text-slate-600",
  reviewed_by_ai: "bg-blue-100 text-blue-700",
  needs_revision: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  pending_sign: "bg-purple-100 text-purple-700",
  signed: "bg-emerald-100 text-emerald-800",
};

export const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
