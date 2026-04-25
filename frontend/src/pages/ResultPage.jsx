import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { downloadSignedDocument } from "../features/signature/signatureApi";
import { shareDocument, getLogs, getShareHistory } from "../features/share/shareApi";
import { getDocument } from "../features/documents/documentsApi";
import { useAuthStore } from "../store/authStore";
import { downloadBlob, formatDate, getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Chip, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";
import { ConfettiBurst, AnimatedCheck, BugisSeal } from "../design/illustrations";
import { Stepper, ModalShell } from "../design/ui-pieces";

function FauxQR({ value = "LS", size = 140 }) {
  // Deterministic pseudo-random grid derived from value
  const n = 16;
  const cells = [];
  let seed = value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  for (let i = 0; i < n * n; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    cells.push(seed / 233280 > 0.55 ? 1 : 0);
  }
  // Corner finders
  const isCorner = (r, c) =>
    (r < 3 && c < 3) || (r < 3 && c > n - 4) || (r > n - 4 && c < 3);
  return (
    <div style={{
      width: size, height: size, padding: 8, background: "#fff",
      border: `1px solid ${LS.border}`, borderRadius: 10,
      boxShadow: LS.shadowSm, position: "relative",
    }} className="ls-qr-scan">
      <div style={{
        width: "100%", height: "100%",
        display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 0,
      }}>
        {cells.map((c, i) => {
          const r = Math.floor(i / n), cc = i % n;
          const on = isCorner(r, cc)
            ? (r === 0 || r === n - 1 || r === 2 || cc === 0 || cc === n - 1 || cc === 2)
            : c;
          return <div key={i} style={{ background: on ? LS.ink : "transparent" }} />;
        })}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [doc, setDoc] = useState(null);
  const [logs, setLogs] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState("link");
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  useEffect(() => {
    Promise.all([getDocument(id), getLogs(id), getShareHistory(id).catch(() => null)])
      .then(([docRes, logsRes, sharesRes]) => {
        setDoc(docRes.data);
        setLogs(logsRes.data.items);
        if (sharesRes?.data?.items) setShares(sharesRes.data.items);
        if (docRes.data.status !== "signed") navigate(`/documents/${id}/review`);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line
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

  const handleShareNative = async () => {
    setSharing(true);
    setError("");
    try {
      const blob = await downloadSignedDocument(id);
      const fileName = `${doc.document_code}_signed.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      shareDocument(id, { share_method: "copy_file" }).catch(() => {});
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.title });
      } else {
        downloadBlob(blob, fileName);
      }
    } catch (err) {
      if (err?.name !== "AbortError") setError(getErrorMessage(err));
    } finally { setSharing(false); }
  };

  const copyVerifyUrl = () => {
    navigator.clipboard.writeText(verifyUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareSubmit = async () => {
    setShareMsg("");
    try {
      const payload =
        shareTab === "link" ? { share_method: "link" } :
        shareTab === "email" ? { share_method: "email", share_target: shareEmail } :
                              { share_method: "download" };
      const res = await shareDocument(id, payload);
      if (shareTab === "link") {
        const url = res.data?.verify_url || verifyUrl;
        navigator.clipboard.writeText(url).catch(() => {});
        setShareMsg("Link telah disalin ke clipboard.");
      } else if (shareTab === "email") {
        setShareMsg(`Permintaan kirim ke ${shareEmail} tercatat.`);
      } else {
        await handleDownload();
        setShareMsg("File sedang diunduh.");
      }
      // refresh share history
      getShareHistory(id).then((r) => setShares(r.data.items)).catch(() => {});
    } catch (err) {
      setShareMsg(getErrorMessage(err));
    }
  };

  const verifyUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/verify/${id}`;

  if (loading) {
    return (
      <AppShell title="Dokumen Selesai">
        <Card pad={48}><div style={{ textAlign: "center", color: LS.mute }}>Memuat...</div></Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={doc?.title || "Dokumen Selesai"}
              subtitle={<span style={{ fontFamily: LS.fontMono }}>{doc?.document_code}</span>}>
      <div style={{ marginBottom: 20 }}>
        <Stepper steps={["Unggah", "Review AI", "Tanda Tangan", "Selesai"]} current={4} />
      </div>

      {error && (
        <div style={{
          background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
          color: LS.danger, borderRadius: 12, padding: "10px 14px",
          fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 960 }}>
        {/* Celebration banner */}
        <div className="ls-fade-up" style={{
          position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, ${LS.ok} 0%, ${LS.bugisTeal} 100%)`,
          borderRadius: 20, padding: "28px 28px 24px", color: "#fff",
          boxShadow: "0 12px 30px rgba(4,120,87,0.22)",
        }}>
          <ConfettiBurst />
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <AnimatedCheck size={56} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.85 }}>
                Pura pakatinggi — Dokumen Disegel
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginTop: 2 }}>
                Dokumen berhasil ditandatangani
              </div>
              <div style={{ fontSize: 13, opacity: 0.92, marginTop: 4 }}>
                {doc?.signature?.signed_at ? formatDate(doc.signature.signed_at) : "—"}
              </div>
            </div>
            <LontaraTag size={30} color="rgba(255,255,255,0.7)" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {/* Doc info */}
          <Card pad={20}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LS.inkSoft,
                          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 }}>
              Detail Dokumen
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Judul" value={doc?.title} />
              <Field label="Kode" value={<span style={{ fontFamily: LS.fontMono }}>{doc?.document_code}</span>} />
              {doc?.signature?.signer_name && (
                <Field label="Ditandatangani oleh" value={
                  <span>{doc.signature.signer_name}
                    {doc.signature.signer_title && <span style={{ color: LS.mute }}> · {doc.signature.signer_title}</span>}
                  </span>
                } />
              )}
              <Field label="Waktu" value={formatDate(doc?.signature?.signed_at || doc?.updated_at)} />
            </div>
          </Card>

          {/* Verify QR */}
          <Card pad={20}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LS.inkSoft,
                          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 }}>
              Verifikasi Publik
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <FauxQR value={doc?.document_code || "LS"} size={130} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, color: LS.mute, marginBottom: 4 }}>URL Verifikasi:</div>
                <div style={{
                  fontSize: 11, fontFamily: LS.fontMono, color: LS.inkSoft,
                  padding: "6px 8px", background: LS.surfaceMuted,
                  border: `1px solid ${LS.border}`, borderRadius: 6,
                  wordBreak: "break-all",
                }}>
                  {verifyUrl}
                </div>
                <button onClick={copyVerifyUrl} style={{
                  marginTop: 8, background: "none", border: "none", cursor: "pointer",
                  color: LS.brand, fontSize: 12, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Ic name="copy" size={14} /> {copied ? "Tersalin!" : "Salin URL"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="primary" size="lg" icon="download" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Mengunduh..." : "Download PDF"}
          </Btn>
          <Btn variant="outline" size="lg" icon="share" onClick={() => setShowShareModal(true)}>
            Bagikan
          </Btn>
          <Btn variant="ghost" size="lg" icon="share" onClick={handleShareNative} disabled={sharing}>
            {sharing ? "Menyiapkan..." : "Bagikan via OS"}
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn variant="subtle" icon="home" onClick={() => navigate("/")}>
            Kembali ke Dashboard
          </Btn>
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <Card pad={20}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LS.inkSoft,
                          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 14 }}>
              Log Aktivitas
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: i < logs.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: LS.brand, marginTop: 4,
                      boxShadow: `0 0 0 3px ${LS.brand}22`,
                    }} />
                    {i < logs.length - 1 && (
                      <div style={{ width: 2, background: LS.border, flex: 1, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < logs.length - 1 ? 8 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: LS.ink }}>
                      {log.description || log.action}
                    </div>
                    <div style={{ fontSize: 11, color: LS.mute, marginTop: 2 }}>
                      {log.actor_name} · {log.actor_role} · {formatDate(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Share history (if any) */}
        {shares.length > 0 && (
          <Card pad={20}>
            <div style={{ fontSize: 11, fontWeight: 700, color: LS.inkSoft,
                          letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 }}>
              Riwayat Berbagi ({shares.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shares.map((s) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: LS.surfaceMuted,
                  border: `1px solid ${LS.border}`, borderRadius: 8,
                  fontSize: 12, color: LS.inkSoft,
                }}>
                  <Chip tone="blue" size="sm" icon={s.share_method === "email" ? "mail" : "link"}>
                    {s.share_method}
                  </Chip>
                  <span>{s.share_target || "—"}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: LS.mute }}>{formatDate(s.shared_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Share modal */}
      <ModalShell
        open={showShareModal}
        onClose={() => { setShowShareModal(false); setShareMsg(""); }}
        title="Bagikan Dokumen"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowShareModal(false)}>Tutup</Btn>
            <Btn variant="primary" onClick={handleShareSubmit}>Bagikan</Btn>
          </>
        }
      >
        <div style={{ display: "flex", gap: 6, padding: 4, background: LS.surfaceMuted,
                      border: `1px solid ${LS.border}`, borderRadius: 10, marginBottom: 16 }}>
          {[
            { k: "link", label: "Link", icon: "link" },
            { k: "email", label: "Email", icon: "mail" },
            { k: "download", label: "Unduh", icon: "download" },
          ].map((t) => {
            const active = shareTab === t.k;
            return (
              <button key={t.k} onClick={() => setShareTab(t.k)} style={{
                flex: 1, padding: "8px 10px", borderRadius: 7,
                background: active ? "#fff" : "transparent",
                color: active ? LS.brand : LS.inkSoft,
                border: active ? `1px solid ${LS.brand}33` : "1px solid transparent",
                cursor: "pointer", fontFamily: LS.font, fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Ic name={t.icon} size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        {shareTab === "link" && (
          <div>
            <div style={{ fontSize: 13, color: LS.inkSoft, marginBottom: 10 }}>
              Bagikan link verifikasi publik:
            </div>
            <div style={{
              padding: "10px 12px", background: LS.surfaceMuted, border: `1px solid ${LS.border}`,
              borderRadius: 8, fontSize: 12, fontFamily: LS.fontMono, color: LS.inkSoft,
              wordBreak: "break-all",
            }}>{verifyUrl}</div>
          </div>
        )}
        {shareTab === "email" && (
          <div>
            <div style={{ fontSize: 13, color: LS.inkSoft, marginBottom: 10 }}>
              Catat permintaan kirim ke email (placeholder — belum kirim aktual):
            </div>
            <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)}
              placeholder="penerima@contoh.com"
              style={{
                width: "100%", height: 40, padding: "0 12px",
                border: `1px solid ${LS.border}`, borderRadius: 8,
                fontSize: 13, fontFamily: LS.font, outline: "none",
                boxSizing: "border-box",
              }} />
          </div>
        )}
        {shareTab === "download" && (
          <div style={{ fontSize: 13, color: LS.inkSoft }}>
            Unduh salinan PDF bertanda tangan untuk dibagikan manual.
          </div>
        )}
        {shareMsg && (
          <div style={{
            marginTop: 14, padding: "10px 12px", background: LS.okSoft,
            border: `1px solid ${LS.ok}33`, color: LS.ok, borderRadius: 8,
            fontSize: 12,
          }}>{shareMsg}</div>
        )}
      </ModalShell>
    </AppShell>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: LS.mute,
                    letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, color: LS.ink, marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}
