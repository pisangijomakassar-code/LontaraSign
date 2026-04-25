import { Link, useLocation, useNavigate } from "react-router-dom";
import { LS, LONTARA_GLYPHS } from "./tokens";
import { Ic } from "./icons";
import { LontaraMark, Wordmark, LontaraTag } from "./primitives";
import { useAuthStore } from "../store/authStore";

// ──────────────────────────────────────────────────────────────
// AppShell — sidebar (desktop) + top bar (mobile), with org header
// ──────────────────────────────────────────────────────────────
export function AppShell({ children, title, subtitle, headerRight }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const loc = useLocation();

  const onLogout = () => { logout(); navigate("/login"); };

  const navItems = [
    { label: "Beranda", to: "/", icon: "dashboard" },
    { label: "Unggah", to: "/upload", icon: "upload" },
    ...(user?.role === "admin" ? [{ label: "Admin", to: "/admin", icon: "shield" }] : []),
  ];

  const mobileNavItems = [
    { k: "dashboard", label: "Beranda", icon: "dashboard", to: "/" },
    { k: "upload", label: "Unggah", icon: "upload", to: "/upload" },
    ...(user?.role === "admin"
      ? [{ k: "admin", label: "Admin", icon: "shield", to: "/admin" }]
      : [{ k: "docs", label: "Dokumen", icon: "doc", to: "/" }]),
    { k: "profile", label: "Saya", icon: "user", to: "/profile" },
  ];

  const org = user?.organization;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: LS.bg, fontFamily: LS.font, overflowX: "hidden" }}>
      {/* Sidebar (desktop) */}
      <aside className="ls-sidebar" style={{
        width: 248, background: LS.surface, borderRight: `1px solid ${LS.border}`,
        display: "none", flexDirection: "column", position: "sticky", top: 0,
        height: "100vh", flexShrink: 0,
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${LS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LontaraMark size={32} />
            <Wordmark size={16} />
          </div>
          <div style={{
            marginTop: 4, fontSize: 11, color: LS.bugisGold, letterSpacing: 3,
            fontFamily: LS.fontBugis,
          }}>
            {LONTARA_GLYPHS}
          </div>
        </div>

        {/* Org chip */}
        {org && (
          <div style={{ padding: "12px 20px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 10,
              background: LS.brandSoft, border: `1px solid ${LS.brand}22`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: `linear-gradient(135deg, ${LS.brand}, ${LS.bugisIndigo})`,
                color: "#fff", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{org.name?.[0] || "O"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: LS.ink,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {org.name}
                </div>
                <div style={{ fontSize: 10, color: LS.mute }}>Organisasi</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: "8px 12px", flex: 1 }}>
          {navItems.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link key={item.to + item.label} to={item.to} className="ls-nav-item" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                fontSize: 14, fontWeight: 500,
                color: active ? LS.brand : LS.inkSoft,
                background: active ? LS.brandSoft : "transparent",
                marginBottom: 2,
              }}>
                <Ic name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{
          padding: 16, borderTop: `1px solid ${LS.border}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${LS.bugisGold}, ${LS.bugisRed})`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{user?.name?.[0] || "?"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: LS.ink,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "—"}
            </div>
            <div style={{ fontSize: 11, color: LS.mute,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.title || user?.role}
            </div>
          </div>
          <button onClick={onLogout} title="Keluar" style={{
            padding: 6, background: "none", border: "none", cursor: "pointer",
            color: LS.mute, borderRadius: 6, display: "flex",
          }} className="ls-nav-item">
            <Ic name="logout" size={16} />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile topbar */}
        <header className="ls-mobile-topbar" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 14px", background: LS.surface,
          borderBottom: `1px solid ${LS.border}`,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <LontaraMark size={24} />
          <Wordmark size={14} />
          {org && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: LS.mute,
              padding: "2px 7px", background: LS.brandSoft, borderRadius: 999,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 90, flexShrink: 1,
            }}>{org.name}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }} />
          <button onClick={onLogout} title="Keluar" style={{
            background: "none", border: "none", padding: 6, cursor: "pointer",
            color: LS.mute, display: "flex", flexShrink: 0,
          }}>
            <Ic name="logout" size={18} />
          </button>
        </header>

        {/* Page header */}
        {(title || headerRight) && (
          <div className="ls-page-header" style={{
            borderBottom: `1px solid ${LS.border}`,
            background: LS.surface,
            display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h1 style={{
                fontSize: 20, fontWeight: 700, color: LS.ink, letterSpacing: -0.5,
                margin: 0,
              }}>{title}</h1>}
              {subtitle && <div style={{ fontSize: 13, color: LS.mute, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>}
            </div>
            {headerRight}
          </div>
        )}

        <main className="ls-page" style={{ flex: 1 }}>
          {children}
        </main>

        {/* Mobile bottom nav — hide on desktop */}
        <nav className="ls-mobile-bottomnav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: LS.surface, borderTop: `1px solid ${LS.border}`,
          padding: "6px 4px 14px", display: "flex",
          justifyContent: "space-around", zIndex: 20,
          boxShadow: "0 -2px 12px rgba(15,23,42,0.06)",
        }}>
          {mobileNavItems.map((it) => {
            const active = loc.pathname === it.to && it.k !== "profile";
            return (
              <button
                key={it.k}
                onClick={() => {
                  if (it.onClick) it.onClick();
                  else navigate(it.to);
                }}
                style={{
                  background: "none", border: "none",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "6px 8px", cursor: "pointer",
                  color: active ? LS.brand : LS.muteSoft,
                  fontFamily: LS.font, flex: 1,
                }}>
                <Ic name={it.icon} size={22} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{it.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <style>{`
        @media (min-width: 960px) {
          .ls-sidebar { display: flex !important; }
          .ls-mobile-topbar { display: none !important; }
          .ls-mobile-bottomnav { display: none !important; }
          .ls-page-header { padding: 24px 28px 18px !important; }
          .ls-page { padding: 24px 28px 40px !important; }
        }
        @media (max-width: 959px) {
          .ls-page-header { padding: 16px 16px 14px !important; }
          .ls-page { padding: 16px 16px 96px !important; }
        }
      `}</style>
    </div>
  );
}
