import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { downloadSignedDocument } from "../features/signature/signatureApi";
import { shareDocument, getLogs } from "../features/share/shareApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { downloadBlob, formatDate, getErrorMessage } from "../lib/utils";

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [doc, setDoc] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => {
    Promise.all([getDocument(id), getLogs(id)])
      .then(([docRes, logsRes]) => {
        setDoc(docRes.data);
        setLogs(logsRes.data.items);
        if (docRes.data.status !== "signed") navigate(`/documents/${id}/review`);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      const blob = await downloadSignedDocument(id);
      downloadBlob(blob, `${doc.document_code}_signed.pdf`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setError("");
    try {
      const res = await shareDocument(id, { share_method: "copy_link" });
      const url = res.data.verify_url;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSharing(false);
    }
  };

  const verifyUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/verify/${id}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-slate-900">Dokumen Selesai</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Success banner */}
        <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Dokumen berhasil ditandatangani!</p>
              <p className="text-emerald-200 text-sm">{doc?.signature?.signed_at ? formatDate(doc.signature.signed_at) : ""}</p>
            </div>
          </div>
        </div>

        {/* Doc info */}
        {doc && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Judul</p>
              <p className="text-slate-900 font-semibold mt-0.5">{doc.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Kode Dokumen</p>
              <p className="text-slate-700 font-mono text-sm mt-0.5">{doc.document_code}</p>
            </div>
            {doc.signature && (
              <>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Ditandatangani oleh</p>
                  <p className="text-slate-700 text-sm mt-0.5">{doc.signature.signer_name} {doc.signature.signer_title ? `— ${doc.signature.signer_title}` : ""}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? "Mengunduh..." : "Download PDF"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="bg-white hover:bg-slate-50 disabled:opacity-60 border border-slate-200 text-slate-700 font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? "Link disalin!" : sharing ? "Menyiapkan..." : "Share"}
          </button>
        </div>

        {/* Share URL */}
        {shareUrl && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500 font-medium mb-1">Link verifikasi:</p>
            <p className="text-xs text-blue-600 break-all font-mono">{shareUrl}</p>
          </div>
        )}

        {/* QR / Verify */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Verifikasi Dokumen</h3>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">URL Verifikasi:</p>
            <p className="text-xs font-mono text-slate-700 break-all">{verifyUrl}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(verifyUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {copied ? "Tersalin!" : "Salin URL verifikasi"}
          </button>
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Log Aktivitas</h3>
            <div className="space-y-3">
              {logs.map((log, i) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    {i < logs.length - 1 && <div className="w-0.5 bg-slate-100 flex-1 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm font-medium text-slate-800">{log.description || log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.actor_name} · {formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-6">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
