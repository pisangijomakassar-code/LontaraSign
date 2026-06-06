import { Link } from "react-router-dom";
import { LS } from "../design/tokens";
import { LontaraMark, Wordmark } from "../design/primitives";

const FEATURES = [
  ["Unggah Dokumen PDF", "Unggah dokumen untuk diproses, di-review, dan ditandatangani."],
  ["Review AI Otomatis", "Dokumen dianalisa AI sebelum tanda tangan — ringkasan + temuan penting."],
  ["Tanda Tangan Digital", "Tanda tangan dengan gambar di layar atau unggah gambar TTD."],
  ["Certificate of Completion", "Halaman audit di akhir PDF: ringkasan dokumen, sidik jari SHA-256, riwayat lengkap, QR verifikasi."],
  ["Verifikasi Publik", "Siapa pun bisa cek keaslian dokumen via halaman /verify atau scan QR."],
  ["Anti-Tamper (SHA-256)", "Setiap dokumen punya sidik jari unik. Jika diubah, sidik jari berbeda — ketahuan."],
  ["Audit Trail Lengkap", "Tercatat siapa, kapan, dan aksi apa pada tiap dokumen."],
  ["Bagikan Dokumen", "Bagikan via tautan, email, atau unduh PDF final."],
  ["Penyimpanan 10 Terbaru", "App menyimpan 10 dokumen terbaru per pengguna; yang lama otomatis dibersihkan."],
];

const TIERS = [
  { code: "Basah", title: "Tanda Tangan Basah", desc: "Coretan pena di kertas. Tradisional, sulit diverifikasi dari jauh.", active: false },
  { code: "SES", title: "Simple Electronic Signature", desc: "Tanda elektronik apa saja (nama diketik, gambar TTD, klik setuju). Tanpa verifikasi identitas & deteksi perubahan.", active: false },
  { code: "AES", title: "Advanced Electronic Signature", desc: "Unik & terikat ke penanda tangan, di bawah kendali tunggalnya (mis. OTP), perubahan dokumen terdeteksi.", active: false },
  { code: "QES", title: "Qualified Electronic Signature", desc: "AES + sertifikat dari penyelenggara terakreditasi pemerintah (PSrE Kominfo). Setara tanda tangan basah secara hukum.", active: false },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: LS.mute, letterSpacing: 0.8,
                    textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AboutSecurityPage() {
  return (
    <div style={{ minHeight: "100vh", background: LS.bg, fontFamily: LS.font }}>
      {/* Header */}
      <div style={{ background: LS.bugisIndigo, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <LontaraMark size={32} />
        <div>
          <Wordmark size={18} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Tentang &amp; Standar Keamanan</div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* Intro */}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: LS.ink, letterSpacing: -0.6, margin: "0 0 8px" }}>
          Tentang LontaraSign
        </h1>
        <p style={{ fontSize: 14, color: LS.inkSoft, lineHeight: 1.6, margin: "0 0 28px" }}>
          Platform internal untuk review &amp; tanda tangan dokumen secara digital, dengan
          pengawal AI dan jejak audit yang dapat diverifikasi.
        </p>

        {/* Fitur */}
        <Section title="Fitur yang Tersedia">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {FEATURES.map(([t, d]) => (
              <div key={t} style={{ background: LS.surface, border: `1px solid ${LS.border}`,
                                    borderRadius: LS.rMd, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ color: LS.ok, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: LS.ink }}>{t}</span>
                </div>
                <div style={{ fontSize: 12.5, color: LS.mute, lineHeight: 1.5, paddingLeft: 20 }}>{d}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Standar keamanan */}
        <Section title="Standar Tanda Tangan Elektronik">
          <p style={{ fontSize: 13, color: LS.inkSoft, lineHeight: 1.6, margin: "0 0 16px" }}>
            Tanda tangan elektronik punya tingkatan kekuatan hukum. Berikut posisinya:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIERS.map((tier) => (
              <div key={tier.code} style={{
                background: LS.surface, border: `1px solid ${LS.border}`,
                borderRadius: LS.rMd, padding: "12px 16px", display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{ minWidth: 52, fontSize: 12, fontWeight: 800, color: LS.bugisIndigo,
                              fontFamily: LS.fontMono }}>{tier.code}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: LS.ink }}>{tier.title}</div>
                  <div style={{ fontSize: 12.5, color: LS.mute, lineHeight: 1.5, marginTop: 2 }}>{tier.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Posisi LontaraSign */}
          <div style={{ marginTop: 16, background: LS.brandSoft, border: `1.5px solid ${LS.brand}33`,
                        borderRadius: LS.rLg, padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: LS.brandInk, marginBottom: 6 }}>
              📍 Posisi LontaraSign: SES menuju AES
            </div>
            <div style={{ fontSize: 13, color: LS.inkSoft, lineHeight: 1.6 }}>
              LontaraSign <strong>sudah</strong> memiliki sidik jari anti-tamper (SHA-256) dan jejak audit
              lengkap — perubahan dokumen pasti terdeteksi. Yang <strong>belum</strong>: verifikasi identitas
              saat menandatangani. Penambahan <strong>OTP saat tanda tangan</strong> akan menaikkannya menjadi
              <strong> AES penuh</strong>. Untuk <strong>QES</strong> (setara TTD basah), diperlukan integrasi
              dengan penyelenggara sertifikasi terakreditasi Kominfo (BSrE/Peruri/Privy).
            </div>
          </div>
        </Section>

        {/* Dasar hukum */}
        <Section title="Dasar Hukum">
          <div style={{ fontSize: 13, color: LS.inkSoft, lineHeight: 1.6 }}>
            Tanda tangan elektronik di LontaraSign sah berdasarkan
            <strong> Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE)
            Pasal 11</strong>, serta perubahannya pada UU No. 19 Tahun 2016.
          </div>
        </Section>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/" style={{ color: LS.brand, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
