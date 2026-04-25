import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  uploadDrawSignature, uploadSignatureImage, finalizeSign,
  getPagePreview, saveSignatureDraw, saveSignatureUpload,
  listSavedSignatures, deleteSavedSignature,
} from "../features/signature/signatureApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage, toBase64FromCanvas } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Input, LontaraTag, StatusChip } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { Stepper } from "../design/ui-pieces";

const TABS = [
  { key: "draw", label: "Gambar", icon: "pen" },
  { key: "upload", label: "Upload Gambar", icon: "image" },
  { key: "saved", label: "Tersimpan", icon: "history" },
];

const DEFAULT_SIG_W = 150;
const DEFAULT_SIG_H = 60;

export default function SignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const previewContainerRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const [tab, setTab] = useState("draw");
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSigPreview, setCurrentSigPreview] = useState(null);

  const [savedSigs, setSavedSigs] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [saveAfterSign, setSaveAfterSign] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Default");

  const [pagePreviewUrl, setPagePreviewUrl] = useState(null);
  const [pdfDims, setPdfDims] = useState({ w: 595, h: 842 });
  // Default posisi: area TTD umum (kanan-bawah, ~70% dari atas)
  const [sigPos, setSigPos] = useState({ x: 380, y: 640 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => {
    Promise.all([getDocument(id), loadPagePreview(), loadSavedSignatures()])
      .then(([docRes]) => {
        setDoc(docRes.data);
        if (docRes.data.status !== "pending_sign") {
          navigate(`/documents/${id}/review`);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line
  }, [id]);

  const loadPagePreview = async () => {
    try {
      const { url, pageWidth, pageHeight } = await getPagePreview(id);
      setPagePreviewUrl(url);
      setPdfDims({ w: pageWidth, h: pageHeight });
    } catch (_) {}
  };

  const loadSavedSignatures = async () => {
    try {
      const res = await listSavedSignatures();
      setSavedSigs(res.data || []);
    } catch (_) {}
  };

  // Canvas drawing
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };
  const endDraw = () => { drawing.current = false; };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1A1410";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
    setCurrentSigPreview(null);
  };
  const confirmDraw = () => {
    if (!hasDrawn) return;
    setCurrentSigPreview(toBase64FromCanvas(canvasRef.current));
  };

  const handleFileUpload = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Hanya PNG/JPG yang diperbolehkan."); return; }
    setError("");
    setUploadedFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPreview(e.target.result);
      setCurrentSigPreview(e.target.result);
    };
    reader.readAsDataURL(f);
  };

  const handleSelectSaved = (sig) => {
    setSelectedSavedId(sig.id);
    setCurrentSigPreview(sig.image_base64);
  };

  const handleDeleteSaved = async (sigId) => {
    try {
      await deleteSavedSignature(sigId);
      setSavedSigs((prev) => prev.filter((s) => s.id !== sigId));
      if (selectedSavedId === sigId) { setSelectedSavedId(null); setCurrentSigPreview(null); }
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const pdfToPx = useCallback((pdfX, pdfY) => {
    if (!previewContainerRef.current) return { x: pdfX, y: pdfY };
    const { width, height } = previewContainerRef.current.getBoundingClientRect();
    return { x: (pdfX / pdfDims.w) * width, y: (pdfY / pdfDims.h) * height };
  }, [pdfDims]);

  const onPreviewMouseDown = (e) => {
    if (!currentSigPreview || !pagePreviewUrl) return;
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, sx: sigPos.x, sy: sigPos.y };
  };
  const onPreviewMouseMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const dxPdf = ((e.clientX - dragStart.current.mx) / rect.width) * pdfDims.w;
    const dyPdf = ((e.clientY - dragStart.current.my) / rect.height) * pdfDims.h;
    setSigPos({
      x: Math.max(0, Math.min(pdfDims.w - DEFAULT_SIG_W, dragStart.current.sx + dxPdf)),
      y: Math.max(0, Math.min(pdfDims.h - DEFAULT_SIG_H, dragStart.current.sy + dyPdf)),
    });
  };
  const onPreviewMouseUp = () => setIsDragging(false);
  const onPreviewTouchStart = (e) => {
    if (!currentSigPreview || !pagePreviewUrl) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, sx: sigPos.x, sy: sigPos.y };
  };
  const onPreviewTouchMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    e.preventDefault();
    const rect = previewContainerRef.current.getBoundingClientRect();
    const dx = e.touches[0].clientX - dragStart.current.mx;
    const dy = e.touches[0].clientY - dragStart.current.my;
    setSigPos({
      x: Math.max(0, Math.min(pdfDims.w - DEFAULT_SIG_W, dragStart.current.sx + (dx / rect.width) * pdfDims.w)),
      y: Math.max(0, Math.min(pdfDims.h - DEFAULT_SIG_H, dragStart.current.sy + (dy / rect.height) * pdfDims.h)),
    });
  };
  const onPreviewTouchEnd = () => setIsDragging(false);

  // Click-to-place: klik di mana saja di preview untuk pindahkan overlay
  // (center overlay ke titik klik). Dipicu hanya kalau user klik di luar overlay.
  const onPreviewContainerClick = (e) => {
    if (!currentSigPreview || !pagePreviewUrl) return;
    if (isDragging) return; // sudah di-handle oleh drag
    // Jangan trigger kalau klik di overlay-nya sendiri (biar drag tetap jalan)
    if (e.target.closest("[data-sig-overlay]")) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Convert ke PDF coords, center overlay ke titik klik
    const xPdf = (px / rect.width) * pdfDims.w - DEFAULT_SIG_W / 2;
    const yPdf = (py / rect.height) * pdfDims.h - DEFAULT_SIG_H / 2;
    setSigPos({
      x: Math.max(0, Math.min(pdfDims.w - DEFAULT_SIG_W, xPdf)),
      y: Math.max(0, Math.min(pdfDims.h - DEFAULT_SIG_H, yPdf)),
    });
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (tab === "saved") {
        if (!selectedSavedId || !currentSigPreview) throw new Error("Pilih tanda tangan tersimpan terlebih dahulu.");
        await uploadDrawSignature(id, currentSigPreview);
      } else if (tab === "draw") {
        if (!hasDrawn) throw new Error("Buat tanda tangan terlebih dahulu.");
        const dataUrl = toBase64FromCanvas(canvasRef.current);
        await uploadDrawSignature(id, dataUrl);
        if (saveAfterSign) {
          try {
            const res = await saveSignatureDraw(dataUrl, saveLabel || "Default");
            setSavedSigs((prev) => [res.data, ...prev]);
          } catch (_) {}
        }
      } else {
        if (!uploadedFile) throw new Error("Pilih gambar tanda tangan terlebih dahulu.");
        await uploadSignatureImage(id, uploadedFile);
        if (saveAfterSign) {
          try {
            const res = await saveSignatureUpload(uploadedFile, saveLabel || "Default");
            setSavedSigs((prev) => [res.data, ...prev]);
          } catch (_) {}
        }
      }
      await finalizeSign(id, {
        // DB enum hanya menerima 'draw' atau 'upload'. Saved signature secara
        // efektif adalah drawn image yang dipakai ulang → kirim sebagai 'draw'.
        sign_method: tab === "upload" ? "upload" : "draw",
        page: "last",
        position: { x: sigPos.x, y: sigPos.y },
      });
      navigate(`/documents/${id}/result`);
    } catch (err) {
      setError(typeof err === "string" ? err : getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canFinalize =
    (tab === "draw" && hasDrawn) ||
    (tab === "upload" && !!uploadedFile) ||
    (tab === "saved" && !!selectedSavedId);

  if (loading) {
    return (
      <AppShell title="Tanda Tangan Dokumen">
        <Card pad={48}><div style={{ textAlign: "center", color: LS.mute }}>Memuat...</div></Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={doc?.title || "Tanda Tangan Dokumen"}
      subtitle={<span style={{ fontFamily: LS.fontMono }}>{doc?.document_code}</span>}
      headerRight={doc && <StatusChip status={doc.status} size="md" />}
    >
      <div style={{ marginBottom: 20 }}>
        <Stepper steps={["Unggah", "Review AI", "Tanda Tangan", "Selesai"]} current={2} />
      </div>

      {error && (
        <div style={{
          background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
          color: LS.danger, borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 1100 }}>
        {/* Tab switch */}
        <Card pad={6}>
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key}
                  onClick={() => { setTab(t.key); setCurrentSigPreview(null); setSelectedSavedId(null); }}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: active ? LS.brand : "transparent",
                    color: active ? "#fff" : LS.inkSoft,
                    border: "none", cursor: "pointer", fontFamily: LS.font,
                    fontSize: 13, fontWeight: 600,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all .15s ease",
                  }}>
                  <Ic name={t.icon} size={15} /> {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {tab === "draw" && (
          <Card pad={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: LS.inkSoft }}>Gambar tanda tangan di bawah:</div>
              <button onClick={clearCanvas} style={{
                background: "none", border: "none", cursor: "pointer",
                color: LS.mute, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Ic name="refresh" size={12} /> Hapus
              </button>
            </div>
            <div style={{
              position: "relative",
              border: `1.5px dashed ${LS.borderStrong}`, borderRadius: 12,
              background: LS.surfaceMuted, overflow: "hidden",
            }}>
              <canvas ref={canvasRef} width={900} height={240}
                style={{ width: "100%", height: 200, display: "block", touchAction: "none", cursor: "crosshair" }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              />
              <div style={{ position: "absolute", left: 24, right: 24, bottom: 40, borderTop: `1px solid ${LS.borderStrong}`, opacity: 0.7, pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 24, bottom: 14, fontSize: 11, color: LS.muteSoft, letterSpacing: 0.4, pointerEvents: "none" }}>× Tanda tangan di atas garis</div>
            </div>
            {hasDrawn && (
              <div style={{ marginTop: 12 }}>
                <Btn variant="subtle" icon="check" onClick={confirmDraw} full>
                  Gunakan Tanda Tangan Ini
                </Btn>
              </div>
            )}
            {hasDrawn && (
              <label style={{
                marginTop: 10, display: "flex", gap: 8, fontSize: 13, color: LS.inkSoft,
                alignItems: "center", cursor: "pointer",
              }}>
                <input type="checkbox" checked={saveAfterSign}
                  onChange={(e) => setSaveAfterSign(e.target.checked)}
                  style={{ accentColor: LS.brand }} />
                Simpan untuk dipakai lagi
                {saveAfterSign && (
                  <input type="text" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="Nama" style={{
                      marginLeft: 4, border: `1px solid ${LS.border}`, borderRadius: 6,
                      padding: "2px 8px", fontSize: 12, width: 100,
                    }} />
                )}
              </label>
            )}
          </Card>
        )}

        {tab === "upload" && (
          <Card pad={20}>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files[0])} />
            {uploadedPreview ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: LS.inkSoft, marginBottom: 10 }}>Preview:</div>
                <div style={{
                  border: `1px solid ${LS.border}`, borderRadius: 12,
                  background: LS.surfaceMuted, padding: 20, textAlign: "center",
                }}>
                  <img src={uploadedPreview} alt="sig"
                    style={{ maxHeight: 120, maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button onClick={() => { setUploadedFile(null); setUploadedPreview(null); setCurrentSigPreview(null); }}
                  style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer",
                           color: LS.mute, fontSize: 12 }}>
                  Ganti gambar
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: "100%", padding: 32, borderRadius: 12,
                border: `2px dashed ${LS.borderStrong}`, background: LS.surfaceMuted,
                cursor: "pointer", fontFamily: LS.font, color: LS.inkSoft,
              }}>
                <Ic name="image" size={36} color={LS.muteSoft} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Pilih gambar tanda tangan</div>
                <div style={{ fontSize: 12, color: LS.mute, marginTop: 4 }}>PNG atau JPG, maks 5 MB</div>
              </button>
            )}
            {uploadedFile && (
              <label style={{
                marginTop: 10, display: "flex", gap: 8, fontSize: 13, color: LS.inkSoft,
                alignItems: "center", cursor: "pointer",
              }}>
                <input type="checkbox" checked={saveAfterSign}
                  onChange={(e) => setSaveAfterSign(e.target.checked)}
                  style={{ accentColor: LS.brand }} />
                Simpan untuk dipakai lagi
                {saveAfterSign && (
                  <input type="text" value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="Nama" style={{
                      marginLeft: 4, border: `1px solid ${LS.border}`, borderRadius: 6,
                      padding: "2px 8px", fontSize: 12, width: 100,
                    }} />
                )}
              </label>
            )}
          </Card>
        )}

        {tab === "saved" && (
          <Card pad={20}>
            <div style={{ fontSize: 13, fontWeight: 600, color: LS.inkSoft, marginBottom: 10 }}>
              Pilih tanda tangan tersimpan:
            </div>
            {savedSigs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: LS.mute }}>
                <Ic name="history" size={28} color={LS.muteSoft} />
                <div style={{ fontSize: 13, marginTop: 6 }}>Belum ada tanda tangan tersimpan</div>
                <div style={{ fontSize: 11, marginTop: 4, color: LS.muteSoft }}>
                  Buat di tab "Gambar" atau "Upload" dan centang "Simpan".
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedSigs.map((sig) => (
                  <div key={sig.id} onClick={() => handleSelectSaved(sig)} style={{
                    display: "flex", gap: 12, alignItems: "center", padding: "10px 12px",
                    border: `1px solid ${selectedSavedId === sig.id ? LS.brand : LS.border}`,
                    background: selectedSavedId === sig.id ? LS.brandSoft : "#fff",
                    borderRadius: 10, cursor: "pointer",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: LS.ink }}>{sig.label}</div>
                      <div style={{ fontSize: 11, color: LS.mute }}>
                        {sig.created_at ? new Date(sig.created_at).toLocaleDateString("id-ID") : ""}
                      </div>
                    </div>
                    {sig.image_base64 && (
                      <img src={sig.image_base64} alt="sig"
                        style={{ height: 34, width: 80, objectFit: "contain",
                                 background: "#fff", border: `1px solid ${LS.border}`, borderRadius: 6 }} />
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSaved(sig.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: LS.muteSoft, padding: 4 }}>
                      <Ic name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Position preview */}
        {currentSigPreview && pagePreviewUrl && (
          <Card pad={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: LS.inkSoft }}>Posisikan tanda tangan</div>
              <div style={{ fontSize: 11, color: LS.mute }}>Klik di area target, atau seret kotak dashed</div>
            </div>
            <div ref={previewContainerRef}
              style={{ position: "relative", overflow: "hidden", borderRadius: 12,
                       border: `1px solid ${LS.border}`, userSelect: "none", touchAction: "none",
                       maxWidth: 560, margin: "0 auto", cursor: currentSigPreview ? "crosshair" : "default" }}
              onMouseMove={onPreviewMouseMove} onMouseUp={onPreviewMouseUp} onMouseLeave={onPreviewMouseUp}
              onTouchMove={onPreviewTouchMove} onTouchEnd={onPreviewTouchEnd}
              onClick={onPreviewContainerClick}>
              <img src={pagePreviewUrl} alt="PDF" style={{ width: "100%", display: "block" }} draggable={false} />
              <div data-sig-overlay style={{
                position: "absolute",
                left: `${(sigPos.x / pdfDims.w) * 100}%`,
                top: `${(sigPos.y / pdfDims.h) * 100}%`,
                width: `${(DEFAULT_SIG_W / pdfDims.w) * 100}%`,
                height: `${(DEFAULT_SIG_H / pdfDims.h) * 100}%`,
                minWidth: 60, minHeight: 20,
                border: `2px dashed ${isDragging ? LS.brand : LS.brandInk}`,
                borderRadius: 8, overflow: "hidden",
                background: "rgba(255,255,255,0.88)",
                cursor: isDragging ? "grabbing" : "grab",
                boxShadow: `0 0 0 2px ${LS.brandRing}`,
              }}
              onMouseDown={onPreviewMouseDown} onTouchStart={onPreviewTouchStart}>
                <img src={currentSigPreview} alt="sig"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: LS.mute }}>
              Posisi: x={Math.round(sigPos.x)}, y={Math.round(sigPos.y)} dari total {Math.round(pdfDims.w)}×{Math.round(pdfDims.h)} · Halaman terakhir
            </div>
          </Card>
        )}

        {!currentSigPreview && pagePreviewUrl && (
          <Card pad={14} style={{ background: LS.surfaceMuted }}>
            <div style={{ fontSize: 12, color: LS.mute, textAlign: "center" }}>
              Selesaikan pembuatan tanda tangan di atas untuk mengatur posisinya di dokumen.
            </div>
          </Card>
        )}

        {/* Signer snapshot */}
        {user && (
          <Card pad={16}>
            <div style={{ fontSize: 11, color: LS.mute, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
              Ditandatangani sebagai
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: LS.ink }}>{user.name}</div>
            {user.title && <div style={{ fontSize: 12, color: LS.mute }}>{user.title}</div>}
            {user.organization?.name && (
              <div style={{ fontSize: 11, color: LS.bugisGold, marginTop: 4, fontWeight: 600 }}>
                {user.organization.name}
              </div>
            )}
          </Card>
        )}

        {/* Submit */}
        <div style={{ padding: "16px 0", borderTop: `1px solid ${LS.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => navigate(-1)}>Batal</Btn>
          <Btn variant="ok" size="lg" icon="pen" onClick={handleFinalize}
               disabled={submitting || !canFinalize}>
            {submitting ? "Menandatangani..." : "Tempel & Finalisasi Tanda Tangan"}
          </Btn>
        </div>

        <div style={{
          padding: "10px 14px", background: LS.aiSoft, border: `1px solid ${LS.ai}22`,
          borderRadius: 10, fontSize: 12, color: LS.ai,
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <LontaraTag size={14} color={LS.ai} />
          Dokumen akan disegel secara digital dan mendapatkan QR untuk verifikasi.
        </div>
      </div>
    </AppShell>
  );
}
