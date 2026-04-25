import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { adminListDocuments, adminGetTimeline } from "../features/admin/adminApi";
import { formatDate, getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Chip, StatusChip, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { ModalShell } from "../design/ui-pieces";

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [timelineDoc, setTimelineDoc] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  if (!isAuthenticated) { navigate("/login"); return null; }
  if (user && user.role !== "admin") { navigate("/"); return null; }

  useEffect(() => {
    adminListDocuments()
      .then((res) => setDocs(res.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const openTimeline = async (doc) => {
    setTimelineDoc(doc);
    setLoadingTimeline(true);
    setTimeline([]);
    try {
      const res = await adminGetTimeline(doc.id);
      setTimeline(res.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setLoadingTimeline(false); }
  };

  const filtered = docs.filter((d) =>
    !search ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.document_code?.toLowerCase().includes(search.toLowerCase()) ||
    d.uploaded_by_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        Admin Panel <LontaraTag size={14} />
      </span>}
      subtitle={`Pantau semua dokumen dalam organisasi${user?.organization ? ` ${user.organization.name}` : ""}.`}
    >
      {error && (
        <div style={{
          background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
          color: LS.danger, borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      <Card pad={0} style={{ overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${LS.border}`,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: LS.muteSoft, display: "flex" }}>
              <Ic name="search" size={16} />
            </span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, kode, atau pengunggah..."
              style={{
                width: "100%", height: 38, padding: "0 12px 0 34px",
                border: `1px solid ${LS.border}`, borderRadius: 10,
                fontSize: 13, fontFamily: LS.font, outline: "none",
                background: LS.surfaceMuted, boxSizing: "border-box",
              }} />
          </div>
          <div style={{ fontSize: 12, color: LS.mute }}>
            {filtered.length} dokumen
          </div>
        </div>

        {/* Doc list — card style, mobile-friendly */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: LS.mute, fontSize: 13 }}>Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: LS.mute, fontSize: 13 }}>Tidak ada dokumen.</div>
        ) : (
          <div>
            {filtered.map((d) => (
              <div key={d.id} style={{
                padding: "14px 18px", borderBottom: `1px solid ${LS.border}`,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 38, height: 44, borderRadius: 6, flexShrink: 0,
                  background: LS.surfaceMuted, border: `1px solid ${LS.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: LS.mute,
                }}>
                  <Ic name="doc" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: LS.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: LS.mute, fontFamily: LS.fontMono, marginTop: 2 }}>
                    {d.document_code}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <StatusChip status={d.status} />
                    <span style={{ fontSize: 11, color: LS.muteSoft }}>·</span>
                    <span style={{ fontSize: 11, color: LS.mute }}>{d.uploaded_by_name || "—"}</span>
                    <span style={{ fontSize: 11, color: LS.muteSoft }}>·</span>
                    <span style={{ fontSize: 11, color: LS.mute }}>{formatDate(d.uploaded_at)}</span>
                  </div>
                </div>
                <button onClick={() => openTimeline(d)} style={{
                  flexShrink: 0, padding: "6px 10px", borderRadius: 8,
                  border: `1px solid ${LS.border}`, background: "none",
                  fontSize: 11, fontWeight: 600, color: LS.inkSoft,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "inherit",
                }}>
                  <Ic name="history" size={13} />
                  Log
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Timeline modal */}
      <ModalShell
        open={!!timelineDoc}
        onClose={() => { setTimelineDoc(null); setTimeline([]); }}
        title={`Timeline — ${timelineDoc?.title || ""}`}
        width={600}
      >
        {loadingTimeline ? (
          <div style={{ textAlign: "center", color: LS.mute, fontSize: 13 }}>Memuat...</div>
        ) : timeline.length === 0 ? (
          <div style={{ textAlign: "center", color: LS.mute, fontSize: 13 }}>Belum ada aktivitas.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {timeline.map((log, i) => (
              <div key={log.id} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: LS.brand, marginTop: 4,
                    boxShadow: `0 0 0 3px ${LS.brand}22`,
                  }} />
                  {i < timeline.length - 1 && (
                    <div style={{ width: 2, background: LS.border, flex: 1, marginTop: 4 }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Chip tone="slate" size="sm">{log.action}</Chip>
                    <div style={{ fontSize: 12, color: LS.mute }}>{formatDate(log.created_at)}</div>
                  </div>
                  {log.description && (
                    <div style={{ fontSize: 13, color: LS.ink, marginTop: 6 }}>{log.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: LS.mute, marginTop: 3 }}>
                    {log.actor_name} · {log.actor_role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalShell>
    </AppShell>
  );
}
