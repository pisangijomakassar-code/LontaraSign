import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDocuments } from "../features/documents/documentsApi";
import { getMe } from "../features/auth/authApi";
import { useAuthStore } from "../store/authStore";
import { formatDate, getErrorMessage } from "../lib/utils";
import { LS, greetByTime } from "../design/tokens";
import { Btn, Card, StatusChip, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { EmptyStateIllustration } from "../design/illustrations";

function StatCard({ icon, label, value, tone = "brand", active, onClick }) {
  const accent = {
    brand: LS.brand, ai: LS.ai, ok: LS.ok, warn: LS.warn,
  }[tone];
  return (
    <Card pad={14} onClick={onClick} style={{
      cursor: "pointer",
      outline: active ? `2px solid ${accent}` : "none",
      outlineOffset: -2,
      transition: "outline 0.15s",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: `${accent}14`, color: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10,
      }}>
        <Ic name={icon} size={18} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: LS.ink, letterSpacing: -0.5, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: LS.mute, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase", marginTop: 4 }}>
        {label}
      </div>
    </Card>
  );
}

function DocRow({ doc, onClick, i = 0 }) {
  return (
    <div onClick={onClick} className="ls-card-hover" style={{
      background: LS.surface, border: `1px solid ${LS.border}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      animationDelay: `${i * 30}ms`,
    }}>
      <div style={{
        width: 40, height: 48, borderRadius: 6,
        background: LS.surfaceMuted, border: `1px solid ${LS.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: LS.mute, flexShrink: 0,
      }}>
        <Ic name={doc.status === "signed" ? "docSigned" : "doc"} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: LS.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: LS.mute, fontFamily: LS.fontMono, marginTop: 3 }}>
          {doc.document_code}
        </div>
        <div style={{ fontSize: 11, color: LS.mute, marginTop: 1 }}>
          {formatDate(doc.uploaded_at)}
        </div>
      </div>
      <StatusChip status={doc.status} />
      <Ic name="chevronR" size={16} color={LS.muteSoft} />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setUser, logout } = useAuthStore();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    (async () => {
      try {
        if (!user) {
          const meRes = await getMe();
          setUser(meRes.data);
        }
        const res = await listDocuments();
        setDocs(res.data.items);
      } catch (err) {
        if (err?.status === 401 || err?.detail?.message) { /* ignore transient */ }
        if (err?.status === 401) { logout(); navigate("/login"); }
        else setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleDocClick = (doc) => {
    if (["draft_uploaded", "needs_revision", "reviewed_by_ai"].includes(doc.status)) {
      navigate(`/documents/${doc.id}/review`);
    } else if (doc.status === "pending_sign") {
      navigate(`/documents/${doc.id}/sign`);
    } else if (doc.status === "signed" || doc.status === "approved") {
      navigate(`/documents/${doc.id}/result`);
    } else {
      navigate(`/documents/${doc.id}/review`);
    }
  };

  const stats = useMemo(() => {
    const total = docs.length;
    const signed = docs.filter((d) => d.status === "signed").length;
    const pending = docs.filter((d) => ["pending_sign", "approved"].includes(d.status)).length;
    const reviewing = docs.filter((d) => ["draft_uploaded", "reviewed_by_ai", "needs_revision"].includes(d.status)).length;
    return { total, signed, pending, reviewing };
  }, [docs]);

  const greeting = greetByTime();

  const filterMap = {
    total: null,
    signed: ["signed"],
    pending: ["pending_sign", "approved"],
    reviewing: ["draft_uploaded", "reviewed_by_ai", "needs_revision"],
  };

  const visibleDocs = activeFilter
    ? docs.filter((d) => filterMap[activeFilter]?.includes(d.status))
    : docs;

  const toggleFilter = (key) => setActiveFilter((prev) => (prev === key ? null : key));

  return (
    <AppShell
      title={
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color: LS.bugisGold, fontSize: 18, fontWeight: 600 }}>{greeting.bugis},</span>
          <span>{user?.name?.split(" ")[0] || "Tamu"}.</span>
          <LontaraTag size={14} />
        </span>
      }
      subtitle={`${greeting.indo}. Berikut ringkasan dokumen Anda hari ini.`}
      headerRight={
        <Btn variant="primary" icon="plus" onClick={() => navigate("/upload")}>
          Unggah Dokumen
        </Btn>
      }
    >
      {/* Stats */}
      <div className="ls-stagger" style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12, marginBottom: 24,
      }}>
        <div style={{ "--i": 0 }}><StatCard icon="doc" label="Total Dokumen" value={stats.total} tone="brand" active={activeFilter === "total"} onClick={() => toggleFilter("total")} /></div>
        <div style={{ "--i": 1 }}><StatCard icon="checkCircle" label="Ditandatangani" value={stats.signed} tone="ok" active={activeFilter === "signed"} onClick={() => toggleFilter("signed")} /></div>
        <div style={{ "--i": 2 }}><StatCard icon="pen" label="Menunggu TTD" value={stats.pending} tone="brand" active={activeFilter === "pending"} onClick={() => toggleFilter("pending")} /></div>
        <div style={{ "--i": 3 }}><StatCard icon="sparkle" label="Dalam Review" value={stats.reviewing} tone="ai" active={activeFilter === "reviewing"} onClick={() => toggleFilter("reviewing")} /></div>
      </div>

      {/* Document list */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: LS.inkSoft,
                     letterSpacing: 0.3, textTransform: "uppercase", margin: 0 }}>
          Dokumen Saya
        </h2>
        <div style={{ fontSize: 12, color: LS.mute }}>{visibleDocs.length} dokumen{activeFilter ? " (difilter)" : ""}</div>
      </div>

      {error && (
        <div style={{
          background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
          color: LS.danger, borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 14,
        }}>{error}</div>
      )}

      {loading ? (
        <Card pad={32}>
          <div style={{ textAlign: "center", color: LS.mute, fontSize: 14 }}>
            Memuat dokumen...
          </div>
        </Card>
      ) : docs.length === 0 ? (
        <Card pad={40}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <EmptyStateIllustration size={220} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: LS.ink, marginBottom: 4 }}>
                Belum ada dokumen
              </div>
              <div style={{ fontSize: 13, color: LS.mute, maxWidth: 360, margin: "0 auto 16px" }}>
                Unggah PDF untuk di-review AI, lalu tanda tangani dengan aman. Setiap dokumen akan dapat diverifikasi melalui QR publik.
              </div>
              <Btn variant="primary" icon="upload" onClick={() => navigate("/upload")}>
                Unggah Dokumen Pertama
              </Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div className="ls-stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visibleDocs.map((doc, i) => (
            <div key={doc.id} style={{ "--i": i }}>
              <DocRow doc={doc} onClick={() => handleDocClick(doc)} i={i} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
