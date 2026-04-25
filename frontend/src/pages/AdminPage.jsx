import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  adminStats, adminListDocuments, adminGetTimeline,
  adminListUsers, adminPatchUser,
} from "../features/admin/adminApi";
import { formatDate, getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Chip, StatusChip, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { ModalShell } from "../design/ui-pieces";

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, tone = "brand" }) {
  const accent = { brand: LS.brand, ai: LS.ai, ok: LS.ok, warn: LS.warn, slate: LS.inkSoft }[tone];
  return (
    <Card pad={14}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, marginBottom: 8,
        background: `${accent}14`, color: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Ic name={icon} size={16} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: LS.ink, letterSpacing: -0.5, lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 11, color: LS.mute, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase", marginTop: 4 }}>
        {label}
      </div>
    </Card>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { key: "docs", label: "Dokumen", icon: "doc" },
    { key: "users", label: "Pengguna", icon: "user" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${LS.border}`, paddingBottom: 0 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", border: "none", background: "none",
          fontFamily: LS.font, fontSize: 13, fontWeight: 600, cursor: "pointer",
          color: active === t.key ? LS.brand : LS.mute,
          borderBottom: active === t.key ? `2px solid ${LS.brand}` : "2px solid transparent",
          marginBottom: -1,
        }}>
          <Ic name={t.icon} size={14} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Dokumen tab ───────────────────────────────────────────────────────────────
function DocsTab({ onOpenTimeline }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    adminListDocuments()
      .then((res) => setDocs(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_OPTIONS = [
    { value: "", label: "Semua Status" },
    { value: "draft_uploaded", label: "Diunggah" },
    { value: "reviewed_by_ai", label: "AI Reviewed" },
    { value: "needs_revision", label: "Perlu Revisi" },
    { value: "pending_sign", label: "Menunggu TTD" },
    { value: "signed", label: "Ditandatangani" },
  ];

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      d.title?.toLowerCase().includes(q) ||
      d.document_code?.toLowerCase().includes(q) ||
      d.uploaded_by_name?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${LS.border}`,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: LS.muteSoft, display: "flex" }}>
            <Ic name="search" size={15} />
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, kode, pengunggah..."
            style={{
              width: "100%", height: 36, padding: "0 10px 0 32px",
              border: `1px solid ${LS.border}`, borderRadius: 9,
              fontSize: 13, fontFamily: LS.font, background: LS.surfaceMuted,
              outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{
          height: 36, padding: "0 10px", border: `1px solid ${LS.border}`,
          borderRadius: 9, fontSize: 12, fontFamily: LS.font,
          background: LS.surfaceMuted, color: LS.ink, cursor: "pointer",
        }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ fontSize: 12, color: LS.mute, whiteSpace: "nowrap" }}>{filtered.length} dokumen</div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: LS.mute, fontSize: 13 }}>Memuat...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: LS.mute, fontSize: 13 }}>Tidak ada dokumen.</div>
      ) : (
        <div>
          {filtered.map((d) => (
            <div key={d.id} style={{
              padding: "12px 16px", borderBottom: `1px solid ${LS.border}`,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 42, borderRadius: 6, flexShrink: 0,
                background: LS.surfaceMuted, border: `1px solid ${LS.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", color: LS.mute,
              }}>
                <Ic name="doc" size={15} />
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
              <button onClick={() => onOpenTimeline(d)} style={{
                flexShrink: 0, padding: "5px 10px", borderRadius: 8,
                border: `1px solid ${LS.border}`, background: "none",
                fontSize: 11, fontWeight: 600, color: LS.inkSoft,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                fontFamily: "inherit",
              }}>
                <Ic name="history" size={13} /> Log
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    adminListUsers()
      .then((res) => setUsers(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const patch = async (userId, payload) => {
    setSaving(userId);
    try {
      const res = await adminPatchUser(userId, payload);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...res.data } : u));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <Card pad={40}>
      <div style={{ textAlign: "center", color: LS.mute, fontSize: 13 }}>Memuat...</div>
    </Card>
  );

  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${LS.border}`,
        fontSize: 12, color: LS.mute,
      }}>
        {users.length} pengguna dalam organisasi
      </div>
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        const isDisabled = saving === u.id || isSelf;
        return (
          <div key={u.id} style={{
            padding: "14px 16px", borderBottom: `1px solid ${LS.border}`,
            display: "flex", alignItems: "center", gap: 12,
            opacity: u.is_active ? 1 : 0.5,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: u.role === "admin" ? `${LS.brand}18` : `${LS.ai}18`,
              color: u.role === "admin" ? LS.brand : LS.ai,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 15,
            }}>
              {u.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: LS.ink }}>{u.name}</span>
                {isSelf && <Chip tone="slate" size="sm">Anda</Chip>}
                {!u.is_active && <Chip tone="danger" size="sm">Nonaktif</Chip>}
              </div>
              <div style={{ fontSize: 12, color: LS.mute, marginTop: 2 }}>{u.email}</div>
              {u.title && <div style={{ fontSize: 11, color: LS.muteSoft, marginTop: 1 }}>{u.title}</div>}
              <div style={{ fontSize: 11, color: LS.mute, marginTop: 4 }}>
                {u.document_count} dokumen · bergabung {formatDate(u.created_at)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
              <select
                value={u.role}
                disabled={isDisabled}
                onChange={(e) => patch(u.id, { role: e.target.value })}
                style={{
                  height: 30, padding: "0 8px", border: `1px solid ${LS.border}`,
                  borderRadius: 7, fontSize: 11, fontFamily: LS.font,
                  background: LS.surfaceMuted, color: LS.ink,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                disabled={isDisabled}
                onClick={() => patch(u.id, { is_active: !u.is_active })}
                style={{
                  padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${u.is_active ? LS.danger + "55" : LS.ok + "55"}`,
                  color: u.is_active ? LS.danger : LS.ok,
                  background: u.is_active ? LS.dangerSoft : `${LS.ok}12`,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {u.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ── Timeline modal ────────────────────────────────────────────────────────────
function TimelineModal({ doc, onClose }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doc) return;
    adminGetTimeline(doc.id)
      .then((res) => setTimeline(res.data.items))
      .finally(() => setLoading(false));
  }, [doc]);

  return (
    <ModalShell open={!!doc} onClose={onClose} title={`Timeline — ${doc?.title || ""}`} width={600}>
      {loading ? (
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
                  background: LS.brand, marginTop: 4, boxShadow: `0 0 0 3px ${LS.brand}22`,
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
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [tab, setTab] = useState("docs");
  const [stats, setStats] = useState(null);
  const [timelineDoc, setTimelineDoc] = useState(null);

  if (!isAuthenticated) { navigate("/login"); return null; }
  if (user && user.role !== "admin") { navigate("/"); return null; }

  useEffect(() => {
    adminStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <AppShell
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        Admin Panel <LontaraTag size={14} />
      </span>}
      subtitle={`Pantau semua dokumen dan pengguna dalam organisasi${user?.organization ? ` ${user.organization.name}` : ""}.`}
    >
      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10, marginBottom: 24,
      }}>
        <StatCard icon="doc" label="Total Dok" value={stats?.total_documents} tone="brand" />
        <StatCard icon="checkCircle" label="Ditandatangani" value={stats?.signed} tone="ok" />
        <StatCard icon="sparkle" label="Dalam Review" value={stats?.in_review} tone="ai" />
        <StatCard icon="pen" label="Menunggu TTD" value={stats?.pending_sign} tone="warn" />
        <StatCard icon="user" label="Total User" value={stats?.total_users} tone="slate" />
        <StatCard icon="checkCircle" label="User Aktif" value={stats?.active_users} tone="ok" />
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "docs" && <DocsTab onOpenTimeline={setTimelineDoc} />}
      {tab === "users" && <UsersTab currentUserId={user?.id} />}

      <TimelineModal doc={timelineDoc} onClose={() => setTimelineDoc(null)} />
    </AppShell>
  );
}
