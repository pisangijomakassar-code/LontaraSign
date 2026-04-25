import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { triggerReview, markRevision, approveDocument } from "../features/review/reviewApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { formatDate, getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Chip, StatusChip, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { Stepper, ModalShell } from "../design/ui-pieces";
import { AnimatedSparkle, AnimatedCheck } from "../design/illustrations";

const SEV_META = {
  critical: { label: "Critical", tone: "#B91C1C", soft: "#FEE2E2", border: "#FECACA", dot: "🔴" },
  warning:  { label: "Perlu Perhatian", tone: "#B45309", soft: "#FEF3C7", border: "#FDE68A", dot: "🟡" },
  minor:    { label: "Minor", tone: "#047857", soft: "#D1FAE5", border: "#A7F3D0", dot: "🟢" },
};

// Derive sev from level (normalize legacy data)
const getSev = (item) => {
  const l = typeof item === "string" ? "warning" : (item.level || "warning");
  return l in SEV_META ? l : "warning";
};

function FindingCard({ f, i, expanded, resolved, active, onToggle, onResolve }) {
  const sev = getSev(f);
  const meta = SEV_META[sev];
  const title = typeof f === "string" ? f : (f.title || f.text || "—");
  const detail = typeof f === "string" ? "" : (f.text || "");
  const category = typeof f === "string" ? "" : (f.category || "");
  const evidence = typeof f === "string" ? null : f.evidence;
  const cta = typeof f === "string" ? "" : (f.cta || "");

  return (
    <div
      className="ls-card-hover ls-point"
      data-finding={f.id || i}
      style={{
        background: resolved ? LS.okSoft : "#fff",
        border: `1.5px solid ${active ? meta.tone : resolved ? "#A7F3D0" : LS.border}`,
        borderRadius: 12, overflow: "hidden",
        opacity: resolved ? 0.75 : 1,
        "--i": i,
      }}
    >
      <div onClick={onToggle} style={{
        padding: "14px 16px", cursor: "pointer",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: meta.soft,
            border: `1px solid ${meta.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>
            {meta.dot}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: meta.tone, letterSpacing: 0.8, textTransform: "uppercase",
              padding: "2px 6px", background: meta.soft, borderRadius: 4,
            }}>
              {meta.label}
            </span>
            {category && (
              <span style={{ fontSize: 10, color: LS.mute, fontWeight: 500 }}>· {category}</span>
            )}
            <span style={{
              fontSize: 10, color: LS.muteSoft, marginLeft: "auto", fontFamily: LS.fontMono,
            }}>
              #{String(i + 1).padStart(2, "0")}
              {evidence?.page ? ` · Hal. ${evidence.page}` : ""}
            </span>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: resolved ? LS.mute : LS.ink,
            textDecoration: resolved ? "line-through" : "none",
            lineHeight: 1.4,
          }}>
            {title}
          </div>
          {!expanded && detail && detail !== title && (
            <div style={{
              fontSize: 12, color: LS.mute, marginTop: 4, lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
              WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
            }}>
              {detail}
            </div>
          )}
        </div>
        <Ic name="chevronD" size={16} color={LS.muteSoft}
            style={{ transform: expanded ? "rotate(180deg)" : "", transition: "transform .2s" }} />
      </div>

      {expanded && (
        <div className="ls-fade-down" style={{ padding: "0 16px 16px 56px" }}>
          {detail && (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: LS.inkSoft, lineHeight: 1.6 }}>
              {detail}
            </p>
          )}
          {evidence?.quote && (
            <div style={{
              background: LS.surfaceMuted, borderLeft: `3px solid ${meta.tone}`,
              padding: "10px 12px", borderRadius: "0 8px 8px 0", marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: LS.mute,
                letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4,
              }}>
                Kutipan{evidence.page ? ` · halaman ${evidence.page}` : ""}
              </div>
              <div style={{
                fontSize: 12, color: LS.inkSoft, fontFamily: LS.fontMono,
                lineHeight: 1.5, fontStyle: "italic",
              }}>
                "{evidence.quote}"
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant={resolved ? "outline" : "primary"} size="sm"
                 icon={resolved ? "undo" : "check"}
                 onClick={(e) => { e.stopPropagation(); onResolve(); }}>
              {resolved ? "Batalkan tanda" : "Tandai sudah diperbaiki"}
            </Btn>
            {cta && <Btn variant="outline" size="sm" icon="edit">{cta}</Btn>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [doc, setDoc] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [deciding, setDeciding] = useState(null);
  const [error, setError] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevModal, setShowRevModal] = useState(false);
  const [showSignGate, setShowSignGate] = useState(false);

  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [resolved, setResolved] = useState({});
  const [activeId, setActiveId] = useState(null);

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => { loadDoc(); /* eslint-disable-next-line */ }, [id]);

  const loadDoc = async () => {
    setLoading(true);
    try {
      const res = await getDocument(id);
      setDoc(res.data);
      setReview(res.data.review);
      const needsReview = !res.data.review && ["draft_uploaded", "needs_revision"].includes(res.data.status);
      if (needsReview) await doReview();
      else if (res.data.review) setRevealedCount(999); // already loaded, show all
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const doReview = async () => {
    setReviewing(true);
    setRevealedCount(0);
    try {
      const res = await triggerReview(id);
      setReview(res.data);
      setDoc((prev) => ({ ...prev, status: "reviewed_by_ai" }));
      // streaming reveal: tampilkan poin satu per satu
      setStreaming(true);
      const total = (res.data?.ai_points || []).length;
      for (let i = 1; i <= total; i++) {
        await new Promise((r) => setTimeout(r, 160));
        setRevealedCount(i);
      }
      setStreaming(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewing(false);
    }
  };

  const handleRevisi = async () => {
    setDeciding("revisi");
    try {
      await markRevision(id, revisionNote);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeciding(null);
      setShowRevModal(false);
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

  const items = useMemo(() => {
    const raw = review?.ai_points || [];
    return raw.map((p, idx) => (typeof p === "string"
      ? { id: idx, level: "warning", title: p, text: p, category: "", evidence: null, cta: "" }
      : { id: idx, ...p }
    ));
  }, [review]);

  const stats = useMemo(() => ({
    total: items.length,
    critical: items.filter((f) => getSev(f) === "critical").length,
    warning: items.filter((f) => getSev(f) === "warning").length,
    minor: items.filter((f) => getSev(f) === "minor").length,
  }), [items]);

  const filtered = useMemo(() => {
    const base = filter === "all" ? items : items.filter((f) => getSev(f) === filter);
    return base.slice(0, streaming ? revealedCount : base.length);
  }, [items, filter, streaming, revealedCount]);

  const resolvedCount = Object.values(resolved).filter(Boolean).length;
  const criticalItems = items.filter((f) => getSev(f) === "critical");
  const criticalResolved = criticalItems.filter((f) => resolved[f.id]).length;
  const canSign = stats.critical === 0 || criticalResolved === stats.critical;

  const filters = [
    { k: "all", label: "Semua", count: stats.total, tone: LS.ink },
    { k: "critical", label: "🔴 Critical", count: stats.critical, tone: SEV_META.critical.tone },
    { k: "warning", label: "🟡 Perlu Perhatian", count: stats.warning, tone: SEV_META.warning.tone },
    { k: "minor", label: "🟢 Minor", count: stats.minor, tone: SEV_META.minor.tone },
  ];

  const tryApprove = () => {
    if (canSign) handleApprove();
    else setShowSignGate(true);
  };

  if (loading || reviewing) {
    return (
      <AppShell title="Review Dokumen">
        <Card pad={48}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              margin: "0 auto 18px", width: 56, height: 56, borderRadius: "50%",
              background: `linear-gradient(135deg, ${LS.ai}, ${LS.brand})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "lsPulse 2.2s infinite",
            }}>
              <AnimatedSparkle size={28} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: LS.ink }}>
              {reviewing ? "LontaraAI sedang mereview dokumen" : "Memuat"}
              <span className="ls-dot" /><span className="ls-dot" /><span className="ls-dot" />
            </div>
            <div style={{ fontSize: 13, color: LS.mute, marginTop: 6 }}>
              {reviewing ? "Analisis mendalam sedang berjalan — ini bisa 15-60 detik..." : ""}
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  const stepIdx = {
    draft_uploaded: 1, reviewed_by_ai: 1, needs_revision: 1,
    approved: 2, pending_sign: 2, signed: 4,
  }[doc?.status] ?? 1;

  const worstLevel = stats.critical > 0 ? "critical" : stats.warning > 0 ? "warning" : "minor";
  const verdictBg = {
    critical: "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)",
    warning: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    minor: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
  }[worstLevel];
  const verdictBorder = SEV_META[worstLevel].border;
  const verdictIcon = stats.critical > 0 ? "⚠️" : stats.warning > 0 ? "🟡" : "✅";
  const verdictLabel = stats.critical > 0
    ? "Ditemukan temuan critical"
    : stats.warning > 0
      ? "Perlu perhatian sebelum lanjut"
      : "Dokumen terlihat baik";

  return (
    <AppShell
      title={doc?.title || "Review Dokumen"}
      subtitle={<span style={{ fontFamily: LS.fontMono }}>{doc?.document_code}</span>}
      headerRight={doc && <StatusChip status={doc.status} size="md" />}
    >
      <div style={{ marginBottom: 20 }}>
        <Stepper steps={["Unggah", "Review AI", "Tanda Tangan", "Selesai"]} current={stepIdx} />
      </div>

      {error && (
        <div style={{
          background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
          color: LS.danger, borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
        {/* Verdict banner */}
        {review && stats.total > 0 && (
          <div className="ls-scale-in" style={{
            background: verdictBg, border: `1.5px solid ${verdictBorder}`,
            borderRadius: 16, padding: 20,
            display: "flex", gap: 16, alignItems: "flex-start",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "#fff",
              border: `1.5px solid ${verdictBorder}`, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
            }}>{verdictIcon}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: LS.ai, letterSpacing: 1.4,
                textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
              }}>
                <AnimatedSparkle size={14} /> LontaraAI Review · verdict
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700, color: SEV_META[worstLevel].tone,
                letterSpacing: -0.3, lineHeight: 1.2,
              }}>
                {verdictLabel}
              </div>
              {review.ai_summary && (
                <div style={{ fontSize: 14, color: LS.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
                  {review.ai_summary}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {stats.critical > 0 && (
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: SEV_META.critical.soft,
                                fontSize: 12, fontWeight: 600, color: SEV_META.critical.tone }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{stats.critical}</span>
                    <span style={{ marginLeft: 6, opacity: 0.85 }}>Critical</span>
                  </div>
                )}
                {stats.warning > 0 && (
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: SEV_META.warning.soft,
                                fontSize: 12, fontWeight: 600, color: SEV_META.warning.tone }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{stats.warning}</span>
                    <span style={{ marginLeft: 6, opacity: 0.85 }}>Perlu Perhatian</span>
                  </div>
                )}
                {stats.minor > 0 && (
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: SEV_META.minor.soft,
                                fontSize: 12, fontWeight: 600, color: SEV_META.minor.tone }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{stats.minor}</span>
                    <span style={{ marginLeft: 6, opacity: 0.85 }}>Minor</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress + sign gate */}
        {review && doc?.status === "reviewed_by_ai" && stats.total > 0 && (
          <Card pad={16} className="ls-fade-up">
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 10, gap: 12, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: LS.ink }}>
                  Progres perbaikan: <span style={{ color: LS.brand }}>{resolvedCount}</span> dari {stats.total} temuan
                </div>
                <div style={{ fontSize: 12, color: LS.mute, marginTop: 2 }}>
                  Critical: {criticalResolved}/{stats.critical}
                  {canSign ? " ✓ siap untuk ditandatangani" : " — selesaikan dulu untuk bisa sign"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="warn" icon="undo"
                     onClick={() => setShowRevModal(true)} disabled={deciding !== null}>
                  Perlu Revisi
                </Btn>
                <Btn variant={canSign ? "ok" : "subtle"}
                     icon={canSign ? "check" : "alert"}
                     onClick={tryApprove} disabled={deciding !== null}>
                  {deciding === "approve"
                    ? "Memproses..."
                    : canSign
                      ? "Setujui & Tanda Tangani"
                      : `Perbaiki ${stats.critical - criticalResolved} critical dulu`}
                </Btn>
              </div>
            </div>
            <div style={{ height: 6, background: LS.surfaceMuted, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: `${stats.total > 0 ? (resolvedCount / stats.total) * 100 : 0}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${LS.brand}, ${LS.ok})`,
                transition: "width .35s cubic-bezier(.2,.7,.2,1)",
              }} />
            </div>
          </Card>
        )}

        {/* Filter chips */}
        {stats.total > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.map((f) => {
              const on = filter === f.k;
              const dim = f.count === 0;
              return (
                <button key={f.k}
                  onClick={() => !dim && setFilter(f.k)}
                  className="ls-btn"
                  disabled={dim}
                  style={{
                    padding: "7px 12px", borderRadius: 999,
                    border: `1px solid ${on ? f.tone : LS.border}`,
                    background: on ? f.tone : "#fff",
                    color: on ? "#fff" : dim ? LS.muteSoft : LS.inkSoft,
                    fontFamily: LS.font, fontSize: 12, fontWeight: 600,
                    cursor: dim ? "not-allowed" : "pointer",
                    opacity: dim ? 0.5 : 1,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                  {f.label}
                  <span style={{
                    fontSize: 11, padding: "1px 6px", borderRadius: 999,
                    background: on ? "rgba(255,255,255,0.22)" : LS.surfaceMuted,
                    color: on ? "#fff" : LS.mute, fontWeight: 700,
                  }}>{f.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Findings */}
        {filtered.length === 0 && stats.total > 0 && (
          <div style={{ padding: 32, textAlign: "center", color: LS.mute, fontSize: 13 }}>
            Tidak ada temuan untuk filter ini.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((f, i) => (
            <FindingCard key={f.id ?? i} f={f} i={i}
              expanded={!!expanded[f.id ?? i]}
              resolved={!!resolved[f.id ?? i]}
              active={activeId === (f.id ?? i)}
              onToggle={() => {
                setExpanded((e) => ({ ...e, [f.id ?? i]: !e[f.id ?? i] }));
                setActiveId(f.id ?? i);
              }}
              onResolve={() => setResolved((r) => ({ ...r, [f.id ?? i]: !r[f.id ?? i] }))}
            />
          ))}
          {streaming && filtered.length < items.length && (
            <div style={{ padding: 14, textAlign: "center", color: LS.ai, fontSize: 13 }}>
              <AnimatedSparkle size={14} color={LS.ai} /> streaming temuan...
              <span className="ls-dot" /><span className="ls-dot" /><span className="ls-dot" />
            </div>
          )}
        </div>

        {/* Recommendation */}
        {review?.ai_recommendation && (
          <Card pad={18} style={{ background: LS.aiSoft, border: `1px solid #DDD6FE` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <AnimatedSparkle size={14} />
              <div style={{
                fontSize: 11, fontWeight: 700, color: LS.ai,
                letterSpacing: 1.2, textTransform: "uppercase",
              }}>
                Rekomendasi AI
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: LS.inkSoft, lineHeight: 1.6 }}>
              {review.ai_recommendation}
            </p>
          </Card>
        )}

        {review && (
          <div style={{
            padding: "10px 14px", background: LS.aiSoft, border: `1px solid ${LS.ai}22`,
            borderRadius: 10, fontSize: 12, color: LS.ai,
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <LontaraTag size={14} color={LS.ai} />
            AI review adalah analisis awal otomatis — bukan keputusan final. Validasi oleh penyetuju tetap diperlukan.
          </div>
        )}
      </div>

      {/* Revision modal */}
      <ModalShell
        open={showRevModal}
        onClose={() => setShowRevModal(false)}
        title="Tandai Perlu Revisi"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowRevModal(false)}>Batal</Btn>
            <Btn variant="warn" onClick={handleRevisi} disabled={deciding !== null}>
              {deciding === "revisi" ? "Memproses..." : "Kirim Revisi"}
            </Btn>
          </>
        }
      >
        <div style={{ fontSize: 13, color: LS.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
          Dokumen akan dikembalikan ke status <Chip tone="warn">Perlu Revisi</Chip>. Pengunggah dapat
          memperbaiki dan mengunggah ulang versi baru.
        </div>
        <textarea
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
          placeholder="Catatan revisi (opsional)"
          rows={4}
          style={{
            width: "100%", border: `1px solid ${LS.border}`, borderRadius: 10,
            padding: 12, fontSize: 13, fontFamily: LS.font, resize: "vertical",
            outline: "none", color: LS.ink, boxSizing: "border-box",
          }}
        />
      </ModalShell>

      {/* Sign gate modal (if critical unresolved) */}
      <ModalShell
        open={showSignGate}
        onClose={() => setShowSignGate(false)}
        title="Belum bisa ditandatangani"
        footer={
          <Btn variant="primary" onClick={() => setShowSignGate(false)} full>
            Kembali ke daftar temuan
          </Btn>
        }
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🚫</div>
          <p style={{ fontSize: 13, color: LS.inkSoft, lineHeight: 1.55, margin: 0 }}>
            Masih ada <b style={{ color: LS.danger }}>
              {stats.critical - criticalResolved} temuan critical
            </b> yang harus diperbaiki (atau ditandai "sudah diperbaiki") sebelum dokumen bisa
            disetujui dan ditandatangani.
          </p>
        </div>
      </ModalShell>
    </AppShell>
  );
}
