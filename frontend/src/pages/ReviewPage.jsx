import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { triggerReview, markRevision, approveDocument } from "../features/review/reviewApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage, formatDate } from "../lib/utils";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [doc, setDoc] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [deciding, setDeciding] = useState(null); // "revisi" | "approve"
  const [error, setError] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => {
    loadDoc();
  }, [id]);

  const loadDoc = async () => {
    setLoading(true);
    try {
      const res = await getDocument(id);
      setDoc(res.data);
      setReview(res.data.review);

      // Auto-trigger review if needed
      if (["draft_uploaded", "needs_revision"].includes(res.data.status)) {
        await doReview();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const doReview = async () => {
    setReviewing(true);
    try {
      const res = await triggerReview(id);
      setReview(res.data);
      const docRes = await getDocument(id);
      setDoc(docRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  const handleRevisi = async () => {
    setDeciding("revisi");
    try {
      await markRevision(id, "");
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeciding(null);
    }
  };

  const handleApprove = async () => {
    setDeciding("approve");
    try {
      await approveDocument(id, "");
      navigate(`/documents/${id}/sign`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeciding(null);
    }
  };

  if (loading || reviewing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{reviewing ? "LontaraAI sedang mereview dokumen..." : "Memuat..."}</p>
          <p className="text-sm text-slate-400 mt-1">{reviewing ? "Mohon tunggu sebentar" : ""}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">{doc?.title}</h1>
            <p className="text-xs text-slate-400 font-mono">{doc?.document_code}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* LONTARA AI REVIEW Badge */}
        {review && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs font-bold tracking-widest uppercase text-blue-200">LONTARA AI REVIEW</span>
            </div>
            <p className="font-semibold text-sm mb-0.5">{review.reviewed_by_system}</p>
            <p className="text-blue-200 text-xs">{formatDate(review.reviewed_at)}</p>
          </div>
        )}

        {/* Summary */}
        {review && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Ringkasan</h3>
              <p className="text-slate-800 text-sm leading-relaxed">{review.ai_summary}</p>
            </div>

            {/* Key Points */}
            {review.ai_points?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Poin Utama</h3>
                <ul className="space-y-2">
                  {review.ai_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {review.ai_notes?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Catatan</h3>
                <ul className="space-y-2">
                  {review.ai_notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {review.ai_recommendation && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Rekomendasi</h3>
                <p className="text-slate-800 text-sm leading-relaxed">{review.ai_recommendation}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-slate-400 text-center px-4">
              AI review adalah review awal, bukan keputusan final. Verifikasi manual tetap diperlukan.
            </p>

            {/* Decision buttons — only show when status is reviewed_by_ai */}
            {doc?.status === "reviewed_by_ai" && (
              <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
                <button
                  onClick={handleRevisi}
                  disabled={deciding !== null}
                  className="bg-amber-50 hover:bg-amber-100 disabled:opacity-60 border border-amber-200 text-amber-700 font-semibold rounded-xl py-3 text-sm transition-colors"
                >
                  {deciding === "revisi" ? "Memproses..." : "Perlu Revisi"}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={deciding !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-sm"
                >
                  {deciding === "approve" ? "Memproses..." : "Setujui & Tanda Tangani"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
