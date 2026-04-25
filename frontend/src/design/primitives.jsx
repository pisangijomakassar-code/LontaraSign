import { LS } from "./tokens";
import { Ic } from "./icons";

// ─────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────
export function Btn({
  children, variant = "primary", size = "md", icon, iconR,
  onClick, disabled, full, style, type = "button", className = "",
}) {
  const sizes = {
    sm: { h: 32, px: 12, fs: 13, gap: 6 },
    md: { h: 38, px: 16, fs: 14, gap: 8 },
    lg: { h: 46, px: 20, fs: 15, gap: 10 },
  }[size];

  const variants = {
    primary: {
      background: LS.brand, color: "#fff", border: `1px solid ${LS.brand}`,
      boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 2px rgba(29,78,216,0.3)",
    },
    ok: {
      background: LS.ok, color: "#fff", border: `1px solid ${LS.ok}`,
      boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 2px rgba(4,120,87,0.3)",
    },
    warn: { background: "#fff", color: LS.warn, border: `1px solid ${LS.warn}` },
    ghost: { background: "transparent", color: LS.inkSoft, border: "1px solid transparent" },
    outline: { background: "#fff", color: LS.ink, border: `1px solid ${LS.border}` },
    subtle: { background: LS.surfaceMuted, color: LS.ink, border: `1px solid ${LS.border}` },
    danger: { background: "#fff", color: LS.danger, border: `1px solid ${LS.border}` },
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ls-btn ls-ripple ${className}`}
      style={{
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        fontSize: sizes.fs,
        gap: sizes.gap,
        fontFamily: LS.font,
        fontWeight: 500,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        width: full ? "100%" : "auto",
        ...variants,
        ...style,
      }}
    >
      {icon && <Ic name={icon} size={sizes.fs + 2} />}
      {children}
      {iconR && <Ic name={iconR} size={sizes.fs + 2} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
export function Card({ children, style, pad = 20, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: LS.surface,
        border: `1px solid ${LS.border}`,
        borderRadius: LS.rLg,
        padding: pad,
        boxShadow: LS.shadowSm,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip
// ─────────────────────────────────────────────────────────────
export function Chip({ children, tone = "slate", icon, size = "sm" }) {
  const tones = {
    slate: { bg: LS.surfaceMuted, fg: LS.inkSoft, bd: LS.border },
    blue: { bg: LS.brandSoft, fg: LS.brandInk, bd: "#BFDBFE" },
    ok: { bg: LS.okSoft, fg: LS.ok, bd: "#A7F3D0" },
    warn: { bg: LS.warnSoft, fg: LS.warn, bd: "#FDE68A" },
    danger: { bg: LS.dangerSoft, fg: LS.danger, bd: "#FECACA" },
    ai: { bg: LS.aiSoft, fg: LS.ai, bd: "#DDD6FE" },
    ink: { bg: LS.ink, fg: "#fff", bd: LS.ink },
  }[tone];

  const s = size === "md"
    ? { h: 26, fs: 12, px: 10, gap: 6 }
    : { h: 22, fs: 11, px: 8, gap: 4 };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs,
      fontWeight: 600, borderRadius: 999, letterSpacing: 0.1,
      background: tones.bg, color: tones.fg, border: `1px solid ${tones.bd}`,
      fontFamily: LS.font,
    }}>
      {icon && <Ic name={icon} size={s.fs + 2} />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusChip — maps document status enum
// ─────────────────────────────────────────────────────────────
export function StatusChip({ status, size = "sm" }) {
  const map = {
    draft_uploaded: { tone: "slate", label: "Draft" },
    reviewed_by_ai: { tone: "ai", label: "AI Reviewed", icon: "sparkle" },
    needs_revision: { tone: "warn", label: "Perlu Revisi", icon: "alert" },
    approved: { tone: "blue", label: "Disetujui", icon: "check" },
    pending_sign: { tone: "blue", label: "Menunggu Tanda Tangan", icon: "pen" },
    signed: { tone: "ok", label: "Ditandatangani", icon: "checkCircle" },
  }[status] || { tone: "slate", label: status };

  return <Chip tone={map.tone} icon={map.icon} size={size}>{map.label}</Chip>;
}

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────
export function Input({
  label, value, onChange, type = "text", placeholder, icon, hint,
  full = true, required, style, autoFocus,
}) {
  return (
    <label style={{ display: "block", fontFamily: LS.font, width: full ? "100%" : "auto", ...style }}>
      {label && (
        <div style={{
          fontSize: 12, fontWeight: 600, color: LS.inkSoft, marginBottom: 6,
          letterSpacing: 0.2, textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: LS.muteSoft, display: "flex",
          }}>
            <Ic name={icon} size={16} />
          </span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          onChange={(e) => onChange && onChange(e.target.value)}
          style={{
            height: 42, width: "100%", boxSizing: "border-box",
            padding: icon ? "0 14px 0 38px" : "0 14px",
            fontSize: 14, fontFamily: LS.font, color: LS.ink,
            border: `1px solid ${LS.border}`, borderRadius: 10, background: "#fff",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = LS.brand;
            e.target.style.boxShadow = `0 0 0 3px ${LS.brandRing}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = LS.border;
            e.target.style.boxShadow = "none";
          }}
        />
      </div>
      {hint && <div style={{ fontSize: 12, color: LS.mute, marginTop: 6 }}>{hint}</div>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// LontaraMark — brand mark, sulapa' eppa + aksara glyph
// ─────────────────────────────────────────────────────────────
export function LontaraMark({ size = 28, color = LS.brand, accent = LS.bugisGold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 4 L36 20 L20 36 L4 20 Z" fill={color} fillOpacity="0.08"
            stroke={color} strokeWidth="1.2" />
      <path d="M14 14 Q 20 10, 26 14 Q 30 20, 26 26 Q 20 30, 14 26"
            stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="1.6" fill={accent} />
      <circle cx="26" cy="26" r="1.6" fill={accent} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Wordmark
// ─────────────────────────────────────────────────────────────
export function Wordmark({ size = 18, color = LS.ink }) {
  return (
    <span style={{
      fontFamily: LS.font, fontWeight: 700, fontSize: size,
      letterSpacing: -0.5, color,
      display: "inline-flex", alignItems: "baseline", gap: 2,
    }}>
      <span>Lontara</span>
      <span style={{ color: LS.brand, fontWeight: 600 }}>Sign</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// LontaraTag — aksara decorative label
// ─────────────────────────────────────────────────────────────
export function LontaraTag({ children = "ᨒᨚᨉᨈᨑ", size = 12, color = LS.bugisGold, style }) {
  return (
    <span style={{
      fontFamily: LS.fontBugis,
      fontSize: size, color, letterSpacing: 2, lineHeight: 1,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// BugisRibbon — decorative divider
// ─────────────────────────────────────────────────────────────
export function BugisRibbon({ color = LS.bugisGold, height = 10, opacity = 0.5 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 120 10" preserveAspectRatio="none"
         style={{ display: "block", opacity }}>
      <pattern id="bgrib" x="0" y="0" width="12" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 L6 1 L12 5 L6 9 Z" fill="none" stroke={color} strokeWidth="0.8" />
        <circle cx="6" cy="5" r="0.8" fill={color} />
      </pattern>
      <rect width="120" height="10" fill="url(#bgrib)" />
    </svg>
  );
}
