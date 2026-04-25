import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Input, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { UploadIllustration } from "../design/illustrations";

const SENSITIVE_HINTS = ["ktp", "npwp", "slip", "gaji", "paspor", "medis", "password", "rahasia"];

export default function UploadPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [dragOver, setDragOver] = useState(false);

  if (!isAuthenticated) { navigate("/login"); return null; }

  const handleFile = (f) => {
    if (!f) return;
    setError(""); setWarning("");
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Hanya file PDF yang diperbolehkan."); return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Ukuran file melebihi 20 MB."); return;
    }
    const lower = f.name.toLowerCase();
    const hit = SENSITIVE_HINTS.find((k) => lower.includes(k));
    if (hit) setWarning(`Nama file mengandung kata "${hit}". Pastikan dokumen ini bukan data pribadi sensitif.`);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Pilih file PDF terlebih dahulu."); return; }
    if (!agreed) { setError("Harap centang pernyataan sebelum mengunggah."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await uploadDocument(file, title);
      navigate(`/documents/${res.data.id}/review`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Unggah Dokumen"
      subtitle="AI akan menganalisis dokumen untuk menemukan potensi kesalahan sebelum ditandatangani."
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Card pad={28}>
          {error && (
            <div className="ls-fade-in" style={{
              background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
              color: LS.danger, borderRadius: 10, padding: "10px 14px",
              fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}
          {warning && (
            <div className="ls-fade-in" style={{
              background: LS.warnSoft, border: `1px solid ${LS.warn}33`,
              color: LS.warn, borderRadius: 10, padding: "10px 14px",
              fontSize: 13, marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <Ic name="alert" size={16} /> <span>{warning}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
              style={{
                position: "relative",
                border: `2px dashed ${dragOver ? LS.brand : file ? LS.ok : LS.borderStrong}`,
                background: dragOver ? LS.brandSoft : file ? LS.okSoft : LS.surfaceMuted,
                borderRadius: 16, padding: 32, textAlign: "center", cursor: "pointer",
                transition: "all .18s ease", outline: "none",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: LS.ok, color: "#fff",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                  }}>
                    <Ic name="check" size={28} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: LS.ok }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: LS.mute, marginTop: 4 }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Klik untuk ganti
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
                  <UploadIllustration size={110} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: LS.ink, marginTop: 8 }}>
                    Klik atau drag & drop PDF di sini
                  </div>
                  <div style={{ fontSize: 12, color: LS.mute, marginTop: 4 }}>
                    Maksimal 20 MB · hanya PDF
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Judul Dokumen (opsional)"
              value={title}
              onChange={setTitle}
              placeholder="Kosongkan untuk memakai nama file"
              icon="edit"
            />

            <label style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "12px 14px", border: `1px solid ${LS.border}`, borderRadius: 12,
              background: LS.surfaceMuted, cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: LS.brand }}
              />
              <span style={{ fontSize: 13, color: LS.inkSoft, lineHeight: 1.55 }}>
                Saya menyatakan bahwa dokumen ini <strong>bukan</strong> data pribadi sensitif
                (KTP, NPWP, slip gaji, data medis) dan saya memiliki hak untuk mengunggahnya.
              </span>
            </label>

            <Btn type="submit" variant="primary" size="lg" full
                 disabled={loading || !file} icon={loading ? undefined : "sparkle"}>
              {loading ? "Mengunggah & memulai review..." : "Unggah & Review dengan AI"}
            </Btn>
          </form>

          <div style={{
            marginTop: 20, padding: "12px 14px",
            background: LS.aiSoft, border: `1px solid ${LS.ai}22`,
            borderRadius: 10, display: "flex", gap: 10, fontSize: 12, color: LS.ai,
          }}>
            <LontaraTag size={14} color={LS.ai} />
            <span>AI review adalah analisis awal otomatis — bukan keputusan final. Verifikasi manual tetap diperlukan.</span>
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: LS.mute, fontSize: 13, fontFamily: LS.font,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            <Ic name="arrowL" size={14} /> Kembali ke beranda
          </button>
        </div>
      </div>
    </AppShell>
  );
}
