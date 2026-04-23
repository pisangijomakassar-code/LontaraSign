import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDocuments } from "../features/documents/documentsApi";
import { getMe } from "../features/auth/authApi";
import { useAuthStore } from "../store/authStore";
import { STATUS_COLORS, STATUS_LABELS, formatDate, getErrorMessage } from "../lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, setUser } = useAuthStore();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const init = async () => {
      try {
        if (!user) {
          const meRes = await getMe();
          setUser(meRes.data);
        }
        const res = await listDocuments();
        setDocs(res.data.items);
      } catch (err) {
        if (err?.status === 401) { logout(); navigate("/login"); }
        else setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAuthenticated]);

  const handleDocClick = (doc) => {
    if (doc.status === "draft_uploaded" || doc.status === "needs_revision") {
      navigate(`/documents/${doc.id}/review`);
    } else if (doc.status === "reviewed_by_ai") {
      navigate(`/documents/${doc.id}/review`);
    } else if (doc.status === "pending_sign") {
      navigate(`/documents/${doc.id}/sign`);
    } else if (doc.status === "signed") {
      navigate(`/documents/${doc.id}/result`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">LontaraSign</h1>
              {user && <p className="text-xs text-slate-500">{user.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Upload CTA */}
        <button
          onClick={() => navigate("/upload")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 flex items-center gap-4 text-left transition-colors shadow-sm"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-base">Upload Dokumen Baru</p>
            <p className="text-blue-200 text-sm">PDF hingga 20 MB</p>
          </div>
        </button>

        {/* Document list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Dokumen Saya
          </h2>

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Memuat dokumen...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && docs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400 text-sm">Belum ada dokumen. Upload sekarang!</p>
            </div>
          )}

          <div className="space-y-3">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocClick(doc)}
                className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{doc.document_code}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[doc.status] || "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2.5">{formatDate(doc.uploaded_at)}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
