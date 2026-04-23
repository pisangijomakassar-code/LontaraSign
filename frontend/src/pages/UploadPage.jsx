import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../lib/utils";

export default function UploadPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  if (!isAuthenticated) { navigate("/login"); return null; }

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Hanya file PDF yang diperbolehkan.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Ukuran file melebihi 20 MB.");
      return;
    }
    setError("");
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
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-slate-900">Upload Dokumen</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-blue-400 bg-blue-50" :
                file ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <svg className="w-10 h-10 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-emerald-700 text-sm">{file.name}</p>
                  <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-xs text-slate-400 mt-2">Klik untuk ganti file</p>
                </div>
              ) : (
                <div>
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-slate-600 font-medium text-sm">Klik atau drag & drop PDF di sini</p>
                  <p className="text-xs text-slate-400 mt-1">Maksimal 20 MB</p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Judul Dokumen <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kosongkan untuk menggunakan nama file"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Declaration checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                Saya menyatakan bahwa dokumen ini bukan dokumen yang mengandung informasi sensitif pribadi
                (KTP, NPWP, slip gaji, data medis, atau sejenisnya) dan saya memiliki hak untuk mengunggahnya.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {loading ? "Mengunggah..." : "Unggah & Review dengan AI"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4">
            AI review adalah review awal, bukan keputusan final.
          </p>
        </div>
      </main>
    </div>
  );
}
