import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../features/auth/authApi";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Input, LontaraMark, Wordmark, LontaraTag } from "../design/primitives";
import { LoginHeroIllustration } from "../design/illustrations";

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveAuth, isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(form);
      saveAuth(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            fontSize: 30, fontWeight: 700, color: LS.ink, letterSpacing: -0.8,
            marginBottom: 8, lineHeight: 1.15,
          }}>
            Tabe', masuk ke akun Anda
          </h1>
          <p style={{ fontSize: 14, color: LS.mute, marginBottom: 32, lineHeight: 1.55 }}>
            <em style={{ fontStyle: "normal", color: LS.bugisGold, fontWeight: 600 }}>
              Resopa temmangingngi namalomo naletei pammase Dewata
            </em><br />
            <span style={{ fontSize: 12 }}>— Ketekunan akan membuka jalan restu.</span>
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="nama@contoh.com"
              icon="mail"
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
              icon="lock"
              required
            />
            <Btn type="submit" variant="primary" size="lg" full disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </Btn>
          </form>

          <div style={{
            marginTop: 24, padding: "12px 14px", background: LS.bugisGoldSoft,
            border: `1px solid ${LS.bugisGold}22`, borderRadius: 10, fontSize: 12,
            color: LS.inkSoft, display: "flex", gap: 10, alignItems: "center",
          }}>
            <LontaraTag size={16} />
            <div>
              <div style={{ fontWeight: 600 }}>Akun demo</div>
              <div style={{ color: LS.mute, marginTop: 2 }}>
                nadia@lontarasign.local / password123
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — hero (shown on wide screens) */}
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
          <LontaraTag size={18} color="rgba(255,255,255,0.6)" />
          <h2 style={{
            fontSize: 38, fontWeight: 800, letterSpacing: -1.2,
            margin: "12px 0 10px", lineHeight: 1.1,
          }}>
            Tanda tangan digital<br />dengan pengawal AI.
          </h2>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.55, maxWidth: 480 }}>
            LontaraSign memadukan kearifan kerja dengan kecepatan AI — setiap
            dokumen di-review dan diarsipkan dengan jejak digital yang dapat diverifikasi.
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
