import { Link } from "react-router-dom";
import { LS, bugisLatticeSvg } from "../design/tokens";
import { Btn, LontaraMark, Wordmark } from "../design/primitives";
import { Ic } from "../design/icons";
import { LoginHeroIllustration } from "../design/illustrations";

function FeatureCard({ icon, tone, title, body }) {
  const accent = { brand: LS.brand, ai: LS.ai, ok: LS.ok, warn: LS.warn, gold: LS.bugisGold }[tone] || LS.brand;
  return (
    <div style={{
      background: LS.surface,
      border: `1px solid ${LS.border}`,
      borderRadius: LS.rLg,
      padding: 24,
      boxShadow: LS.shadowSm,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${accent}14`, color: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        <Ic name={icon} size={22} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: LS.ink, marginBottom: 6, letterSpacing: -0.2 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: LS.mute, lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        flexShrink: 0,
        width: 36, height: 36, borderRadius: "50%",
        background: LS.brand, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 15,
        boxShadow: `0 4px 12px ${LS.brandRing}`,
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: LS.ink, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: LS.mute, lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: LS.bg, fontFamily: LS.font, color: LS.ink }}>
      {/* Top bar */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 32px",
        borderBottom: `1px solid ${LS.border}`,
        background: LS.surface,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LontaraMark size={36} />
          <Wordmark size={20} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Btn variant="ghost" size="md">Masuk</Btn>
          </Link>
          <Link to="/register" style={{ textDecoration: "none" }}>
            <Btn variant="primary" size="md">Daftar Gratis</Btn>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        position: "relative", overflow: "hidden",
        backgroundImage: bugisLatticeSvg,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "72px 32px 80px",
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 56,
          alignItems: "center",
        }} className="ls-hero-grid">
          <div className="ls-fade-up">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 99,
              background: LS.aiSoft, color: LS.ai,
              fontSize: 12, fontWeight: 600, marginBottom: 18,
              border: `1px solid ${LS.ai}22`,
            }}>
              <Ic name="sparkle" size={13} />
              Diawal AI · Diakhir Tanda Tangan
            </div>
            <h1 style={{
              fontSize: 48, fontWeight: 800, color: LS.ink,
              letterSpacing: -1.4, lineHeight: 1.05,
              margin: "0 0 16px",
            }}>
              Tanda tangan digital,<br />
              <span style={{ color: LS.brand }}>dengan pengawal AI.</span>
            </h1>
            <p style={{
              fontSize: 16.5, color: LS.mute, lineHeight: 1.6,
              maxWidth: 520, margin: "0 0 32px",
            }}>
              LontaraSign menggabungkan kearifan kerja dokumen tradisional dengan kecepatan AI —
              setiap dokumen di-review, ditanda tangani, dan diarsipkan dengan jejak digital yang
              dapat diverifikasi.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <Btn variant="primary" size="lg">
                  Mulai Gratis
                </Btn>
              </Link>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Btn variant="outline" size="lg">
                  Sudah Punya Akun
                </Btn>
              </Link>
            </div>
            <div style={{
              marginTop: 22, fontSize: 12.5, color: LS.muteSoft,
              display: "flex", gap: 18, flexWrap: "wrap",
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ic name="checkCircle" size={14} color={LS.ok} /> Tanpa kartu kredit
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ic name="checkCircle" size={14} color={LS.ok} /> Bahasa Indonesia
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ic name="checkCircle" size={14} color={LS.ok} /> Verifikasi publik
              </span>
            </div>
          </div>

          {/* Hero illustration card */}
          <div style={{
            position: "relative",
            background: `linear-gradient(135deg, ${LS.bugisIndigo} 0%, ${LS.brand} 60%, ${LS.ai} 100%)`,
            borderRadius: LS.rXl,
            overflow: "hidden",
            aspectRatio: "1.1 / 1",
            boxShadow: LS.shadowLg,
          }} className="ls-hero-card">
            <LoginHeroIllustration />
            <div style={{
              position: "absolute", left: 28, bottom: 28, right: 28,
              color: "#fff",
            }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4, letterSpacing: 0.4 }}>
                ᨒᨚᨉᨈᨑ · LontaraSign
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                Resopa temmangingngi<br />namalomo naletei pammase Dewata
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 8 }}>
                Ketekunan akan membuka jalan restu.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "72px 32px", background: LS.surface, borderTop: `1px solid ${LS.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: LS.brand, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              Fitur
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: LS.ink, letterSpacing: -0.8, margin: 0 }}>
              Semua yang dibutuhkan untuk dokumen tepercaya
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}>
            <FeatureCard
              icon="sparkle" tone="ai"
              title="Review AI Otomatis"
              body="Sebelum ditanda tangani, dokumen di-scan AI untuk temukan masalah kritis: nomor dokumen, tanggal, pihak, klausa, scope, dan risiko."
            />
            <FeatureCard
              icon="pen" tone="brand"
              title="Tanda Tangan Cepat"
              body="Gambar langsung di canvas, upload PNG/JPG, atau pakai signature tersimpan. Tempel ke posisi mana saja di halaman PDF."
            />
            <FeatureCard
              icon="checkCircle" tone="ok"
              title="Verifikasi Publik"
              body="Bagikan link verifikasi yang dapat diakses kapan saja untuk membuktikan keaslian dan integritas dokumen."
            />
            <FeatureCard
              icon="user" tone="gold"
              title="Kontrol Admin"
              body="Persetujuan akun baru oleh admin, batas dokumen per pengguna, dan konfigurasi AI provider — semua via panel admin."
            />
            <FeatureCard
              icon="history" tone="warn"
              title="Audit Trail Lengkap"
              body="Setiap aktivitas pada dokumen tercatat — dari upload, review AI, revisi, hingga tanda tangan dan share."
            />
            <FeatureCard
              icon="doc" tone="brand"
              title="Penyimpanan Aman"
              body="File asli dan versi tertanda disimpan dengan struktur yang jelas, bisa di-download kapan saja oleh pemilik."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "72px 32px", background: LS.bg }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: LS.brand, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              Cara Kerja
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: LS.ink, letterSpacing: -0.8, margin: 0 }}>
              Empat langkah, dokumen siap disebarkan
            </h2>
          </div>
          <div style={{ display: "grid", gap: 26 }}>
            <Step n="1" title="Daftar & menunggu aktivasi"
              body="Isi form pendaftaran. Akun akan diaktifkan oleh administrator organisasi sebelum bisa digunakan." />
            <Step n="2" title="Unggah dokumen PDF"
              body="Upload file (max 20 MB). Sistem ekstrak teks otomatis dan kirim ke AI untuk review." />
            <Step n="3" title="Review & tanda tangan"
              body="Lihat temuan AI, lakukan revisi jika perlu, lalu tempelkan tanda tangan di posisi yang diinginkan." />
            <Step n="4" title="Bagikan link verifikasi"
              body="Generate link share — penerima dapat verifikasi dokumen tanpa login." />
          </div>
        </div>
      </section>

      {/* CTA bar */}
      <section style={{
        padding: "60px 32px",
        background: `linear-gradient(135deg, ${LS.bugisIndigo} 0%, ${LS.brand} 100%)`,
        color: "#fff",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, margin: "0 0 12px" }}>
            Siap mulai mengamankan dokumen Anda?
          </h2>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.55, margin: "0 0 24px" }}>
            Daftar gratis hari ini. Akun pertama dapat aktivasi dari administrator dalam hitungan jam kerja.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <Btn variant="ok" size="lg">Daftar Sekarang</Btn>
            </Link>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <Btn variant="outline" size="lg" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                Masuk
              </Btn>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "32px",
        background: LS.surface,
        borderTop: `1px solid ${LS.border}`,
        textAlign: "center",
        fontSize: 12.5,
        color: LS.mute,
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <LontaraMark size={20} />
          <Wordmark size={13} />
        </div>
        <div>© {new Date().getFullYear()} LontaraSign — Diawal AI · Diakhir Tanda Tangan</div>
      </footer>

      <style>{`
        @media (max-width: 880px) {
          .ls-hero-grid { grid-template-columns: 1fr !important; }
          .ls-hero-card { aspect-ratio: 1.4 / 1 !important; }
        }
      `}</style>
    </div>
  );
}
