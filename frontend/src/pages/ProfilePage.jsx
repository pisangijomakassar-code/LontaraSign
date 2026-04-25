import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { updateMe } from "../features/auth/authApi";
import { getErrorMessage } from "../lib/utils";
import { LS } from "../design/tokens";
import { Btn, Card, Input, LontaraTag } from "../design/primitives";
import { Ic } from "../design/icons";
import { AppShell } from "../design/shell";

function Section({ title, children }) {
  return (
    <Card pad={20} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: LS.inkSoft, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </Card>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, setUser, logout } = useAuthStore();

  const [form, setForm] = useState({ name: user?.name || "", title: user?.title || "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const [successProfile, setSuccessProfile] = useState("");
  const [successPw, setSuccessPw] = useState("");
  const [errorProfile, setErrorProfile] = useState("");
  const [errorPw, setErrorPw] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorProfile(""); setSuccessProfile("");
    setLoadingProfile(true);
    try {
      const res = await updateMe({ name: form.name, title: form.title });
      setUser(res.data);
      setSuccessProfile("Profil berhasil disimpan.");
    } catch (err) {
      setErrorProfile(getErrorMessage(err));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    setErrorPw(""); setSuccessPw("");
    if (pw.new_password !== pw.confirm) {
      setErrorPw("Konfirmasi password tidak cocok."); return;
    }
    setLoadingPw(true);
    try {
      await updateMe({ current_password: pw.current_password, new_password: pw.new_password });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setSuccessPw("Password berhasil diubah.");
    } catch (err) {
      setErrorPw(getErrorMessage(err));
    } finally {
      setLoadingPw(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const roleLabel = user?.role === "admin" ? "Administrator" : "Pengguna";

  return (
    <AppShell
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        Profil Saya <LontaraTag size={14} />
      </span>}
      subtitle="Kelola informasi akun dan keamanan Anda."
    >
      {/* Avatar + info */}
      <Card pad={20} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${LS.bugisGold}, ${LS.bugisRed})`,
          color: "#fff", fontSize: 22, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: LS.ink }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: LS.mute, marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
              background: user?.role === "admin" ? `${LS.brand}18` : `${LS.ai}18`,
              color: user?.role === "admin" ? LS.brand : LS.ai,
            }}>{roleLabel}</span>
            {user?.organization?.name && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                background: LS.brandSoft, color: LS.inkSoft,
              }}>{user.organization.name}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Edit profil */}
      <Section title="Informasi Akun">
        {errorProfile && (
          <div style={{ background: LS.dangerSoft, color: LS.danger, borderRadius: 9, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>
            {errorProfile}
          </div>
        )}
        {successProfile && (
          <div style={{ background: `${LS.ok}14`, color: LS.ok, borderRadius: 9, padding: "9px 12px", fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Ic name="checkCircle" size={15} /> {successProfile}
          </div>
        )}
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon="user" required />
          <Input label="Jabatan" value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="pen" placeholder="Contoh: Staff Administrasi" />
          <div>
            <Input label="Email" value={user?.email || ""} onChange={() => {}} icon="mail" disabled />
            <div style={{ fontSize: 11, color: LS.mute, marginTop: 4 }}>Email tidak dapat diubah.</div>
          </div>
          <Btn type="submit" variant="primary" disabled={loadingProfile}>
            {loadingProfile ? "Menyimpan..." : "Simpan Perubahan"}
          </Btn>
        </form>
      </Section>

      {/* Ganti password */}
      <Section title="Keamanan">
        {errorPw && (
          <div style={{ background: LS.dangerSoft, color: LS.danger, borderRadius: 9, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>
            {errorPw}
          </div>
        )}
        {successPw && (
          <div style={{ background: `${LS.ok}14`, color: LS.ok, borderRadius: 9, padding: "9px 12px", fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Ic name="checkCircle" size={15} /> {successPw}
          </div>
        )}
        <form onSubmit={handleSavePw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Password Lama" type="password" value={pw.current_password}
            onChange={(v) => setPw({ ...pw, current_password: v })} icon="lock" required />
          <Input label="Password Baru" type="password" value={pw.new_password}
            onChange={(v) => setPw({ ...pw, new_password: v })} icon="lock" placeholder="Minimal 6 karakter" required />
          <Input label="Konfirmasi Password Baru" type="password" value={pw.confirm}
            onChange={(v) => setPw({ ...pw, confirm: v })} icon="lock" required />
          <Btn type="submit" variant="outline" disabled={loadingPw}>
            {loadingPw ? "Menyimpan..." : "Ganti Password"}
          </Btn>
        </form>
      </Section>

      {/* Logout */}
      <Card pad={16} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: LS.ink }}>Keluar dari akun</div>
          <div style={{ fontSize: 12, color: LS.mute, marginTop: 2 }}>Sesi Anda akan dihapus dari perangkat ini.</div>
        </div>
        <Btn variant="danger" icon="logout" onClick={handleLogout}>Keluar</Btn>
      </Card>
    </AppShell>
  );
}
