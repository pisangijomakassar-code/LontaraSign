import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  uploadDrawSignature,
  uploadSignatureImage,
  finalizeSign,
} from "../features/signature/signatureApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage, toBase64FromCanvas } from "../lib/utils";

export default function SignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const [tab, setTab] = useState("draw"); // "draw" | "upload"
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => {
    getDocument(id)
      .then((res) => {
        setDoc(res.data);
        if (res.data.status !== "pending_sign") {
          navigate(`/documents/${id}/review`);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  // Canvas drawing helpers
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

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const endDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleFileUpload = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Hanya PNG/JPG yang diperbolehkan."); return; }
    setError("");
    setUploadedFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (tab === "draw") {
        if (!hasDrawn) { setError("Harap buat tanda tangan terlebih dahulu."); setSubmitting(false); return; }
        const dataUrl = toBase64FromCanvas(canvasRef.current);
        await uploadDrawSignature(id, dataUrl);
      } else {
        if (!uploadedFile) { setError("Harap pilih gambar tanda tangan."); setSubmitting(false); return; }
        await uploadSignatureImage(id, uploadedFile);
      }

      await finalizeSign(id, {
        sign_method: tab,
        page: "last",
        position: { x: 380, y: 120 },
      });

      navigate(`/documents/${id}/result`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">Tanda Tangan Dokumen</h1>
            <p className="text-xs text-slate-400 truncate">{doc?.title}</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Tab switch */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex gap-1">
          <button
            onClick={() => setTab("draw")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "draw" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Buat Tanda Tangan
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "upload" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Upload Gambar
          </button>
        </div>

        {/* Draw canvas */}
        {tab === "draw" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">Tanda tangan di area bawah:</p>
              <button onClick={clearCanvas} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                Hapus
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {!hasDrawn && (
              <p className="text-xs text-slate-400 text-center mt-2">Geser mouse atau jari untuk membuat tanda tangan</p>
            )}
          </div>
        )}

        {/* Upload image */}
        {tab === "upload" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
            {uploadedPreview ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Preview tanda tangan:</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4">
                  <img src={uploadedPreview} alt="Signature preview" className="max-h-40 mx-auto object-contain" />
                </div>
                <button
                  onClick={() => { setUploadedFile(null); setUploadedPreview(null); }}
                  className="mt-3 text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Ganti gambar
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-8 text-center transition-colors"
              >
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">Pilih gambar tanda tangan</p>
                <p className="text-xs text-slate-400 mt-1">PNG atau JPG, maks 5 MB</p>
              </button>
            )}
          </div>
        )}

        {/* Placement info */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Posisi:</span> Halaman terakhir, kanan atas
          </p>
          <p className="text-xs text-slate-400 mt-1">Posisi default: x=380, y=120</p>
        </div>

        {/* Submit */}
        <div className="pb-6">
          <button
            onClick={handleFinalize}
            disabled={submitting || (tab === "draw" && !hasDrawn) || (tab === "upload" && !uploadedFile)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-sm"
          >
            {submitting ? "Menandatangani..." : "Tempel Tanda Tangan ke PDF"}
          </button>
        </div>
      </main>
    </div>
  );
}
