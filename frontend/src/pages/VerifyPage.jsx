import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LS } from "../design/tokens";
import { LontaraMark, Wordmark } from "../design/primitives";

const API = "/api/v1";

async function fetchVerify(code) {
  const r = await fetch(`${API}/verify/${code}`);
  const j = await r.json();
  if (!r.ok) throw new Error(j?.message || "Dokumen tidak ditemukan");
  return j.data;
}

function fmt(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar",
  }) + " WITA";
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ fontSize: 12, color: LS.mute, minWidth: 140, paddingTop: 1 }}>{label}</div>
      <div style={{
        fontSize: mono ? 11 : 13, color: LS.ink, fontWeight: 500, flex: 1,
        fontFamily: mono ? LS.fontMono : LS.font, wordBreak: "break-all",
      }}>
        {value || "-"}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerify(code)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div style={{ minHeight: "100vh", background: LS.bg, fontFamily: LS.font, display: "flex", flexDirection: "column" }}>
      <div style={{ background: LS.bugisIndigo, padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <LontaraMark size={32} />
        <div>
          <Wordmark size={18} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Verifikasi Dokumen Digital</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>

          {loading && <div style={{ textAlign: "center", color: LS.mute, fontSize: 15 }}>Memverifikasi dokumen...</div>}

          {err && (
            <div style={{ background: LS.dangerSoft, border: `1px solid ${LS.danger}44`, borderRadius: LS.rLg, padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: LS.danger, marginBottom: 8 }}>Dokumen Tidak Ditemukan</div>
              <div style={{ fontSize: 13, color: LS.mute }}>{err}</div>
              <div style={{ fontSize: 12, color: LS.mute, marginTop: 12 }}>
                Kode: <code style={{ fontFamily: LS.fontMono }}>{code}</code>
              </div>
            </div>
          )}

          {data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                background: data.is_signed ? LS.okSoft : LS.warnSoft,
                border: `1.5px solid ${data.is_signed ? LS.ok : LS.warn}44`,
                borderRadius: LS.rLg, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: data.is_signed ? LS.ok : LS.warn,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: "#fff", flexShrink: 0,
                }}>
                  {data.is_signed ? "✓" : "○"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: data.is_signed ? LS.ok : LS.warn }}>
                    {data.is_signed ? "Dokumen Sah & Terverifikasi" : "Dokumen Belum Ditandatangani"}
                  </div>
                  <div style={{ fontSize: 13, color: LS.mute, marginTop: 3 }}>
                    {data.is_signed ? "Tanda tangan elektronik valid sesuai UU ITE Pasal 11" : "Dokumen ini belum melewati proses penandatanganan"}
                  </div>
                </div>
              </div>

              <div style={{ background: LS.surface, border: `1px solid ${LS.border}`, borderRadius: LS.rLg, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${LS.border}`, background: LS.surfaceMuted }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: LS.mute, letterSpacing: 0.8, textTransform: "uppercase" }}>Informasi Dokumen</div>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <Row label="Judul" value={data.title} />
                  <Row label="Kode Dokumen" value={data.document_code} mono />
                  <Row label="Diunggah oleh" value={data.uploaded_by} />
                  <Row label="Tanggal Unggah" value={fmt(data.uploaded_at)} />
                </div>
              </div>

              {data.is_signed && (
                <div style={{ background: LS.surface, border: `1px solid ${LS.border}`, borderRadius: LS.rLg, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${LS.border}`, background: LS.surfaceMuted }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: LS.mute, letterSpacing: 0.8, textTransform: "uppercase" }}>Penanda Tangan</div>
                  </div>
                  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <Row label="Nama" value={data.signer_name} />
                    {data.signer_title && <Row label="Jabatan" value={data.signer_title} />}
                    <Row label="Waktu Tanda Tangan" value={fmt(data.signed_at)} />
                  </div>
                </div>
              )}

              {data.document_hash && (
                <div style={{ background: LS.brandSoft, border: `1px solid ${LS.brand}22`, borderRadius: LS.rMd, padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: LS.brand, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>SHA-256 Fingerprint</div>
                  <div style={{ fontFamily: LS.fontMono, fontSize: 11, color: LS.bugisIndigo, wordBreak: "break-all", lineHeight: 1.7 }}>
                    {data.document_hash}
                  </div>
                  <div style={{ fontSize: 11, color: LS.mute, marginTop: 8 }}>Hash unik dokumen asli. Jika dokumen dimodifikasi, hash akan berbeda.</div>
                </div>
              )}

              <div style={{ fontSize: 11, color: LS.mute, textAlign: "center", lineHeight: 1.7, padding: "0 8px" }}>
                Verifikasi ini dilakukan oleh LontaraSign. Tanda tangan elektronik sah berdasarkan UU No. 11 Tahun 2008 tentang ITE Pasal 11.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
