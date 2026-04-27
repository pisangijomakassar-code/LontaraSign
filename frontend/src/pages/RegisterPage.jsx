import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../features/auth/authApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Input, LontaraMark, Wordmark } from "../design/primitives";
import { LoginHeroIllustration } from "../design/illustrations";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { saveAuth, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password });
      saveAuth(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="ls-page" style={{ minHeight: "100vh", display: "flex", fontFamily: LS.font }}>
      {/* Left — form */}
      <div style={{
        flex: "1 1 500px", maxWidth: 560, padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        background: LS.bg,
      }}>
        <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <LontaraMark size={42} />
            <div>
              <Wordmark size={22} />
              <div style={{ fontSize: 12, color: LS.mute, marginTop: 2, letterSpacing: 0.3 }}>
                Review & tanda tangan dokumen
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 700, color: LS.ink, letterSpacing: -0.8,
            marginBottom: 8, lineHeight: 1.15,
          }}>
            Buat akun baru
          </h1>
          <p style={{ fontSize: 14, color: LS.mute, marginBottom: 28, lineHeight: 1.55 }}>
            Bergabung dan mulai kelola dokumen dengan tanda tangan digital.
          </p>

          {error && (
            <div className="ls-fade-in" style={{
              background: LS.dangerSoft, border: `1px solid ${LS.danger}33`,
              color: LS.danger, borderRadius: 12, padding: "10px 14px",
              fontSize: 13, marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nama Lengkap"
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Nama Anda"
              icon="user"
              required
              autoFocus
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="nama@contoh.com"
              icon="mail"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Minimal 6 karakter"
              icon="lock"
              required
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="Ulangi password"
              icon="lock"
              required
            />
            <Btn type="submit" variant="primary" size="lg" full disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </Btn>
          </form>

          <div style={{
            marginTop: 20, textAlign: "center", fontSize: 13, color: LS.mute,
          }}>
            Sudah punya akun?{" "}
            <Link to="/login" style={{ color: LS.brand, fontWeight: 600, textDecoration: "none" }}>
              Masuk
            </Link>
          </div>
        </div>
      </div>

      {/* Right — hero */}
      <div className="login-hero" style={{
        flex: "1 1 600px", position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${LS.bugisIndigo} 0%, ${LS.brand} 60%, ${LS.ai} 100%)`,
        display: "none",
      }}>
        <LoginHeroIllustration />
        <div style={{
          position: "absolute", left: 48, bottom: 48, right: 48,
          color: "#fff", zIndex: 2,
        }}>
          <h2 style={{
            fontSize: 36, fontWeight: 800, letterSpacing: -1.2,
            margin: "0 0 10px", lineHeight: 1.1,
          }}>
            Mulai perjalanan<br />dokumen digital Anda.
          </h2>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.55, maxWidth: 480 }}>
            LontaraSign menjaga setiap dokumen Anda tetap aman, terstruktur,
            dan siap ditandatangani kapan saja.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-hero { display: block !important; }
        }
      `}</style>
    </div>
  );
}
