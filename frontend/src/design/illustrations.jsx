import { useMemo } from "react";
import { LS } from "./tokens";

// ─── Empty state: perahu pinisi + dokumen mengambang ─────────────
export function EmptyStateIllustration({ size = 200 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 240 180" fill="none"
         style={{ animation: "lsFadeUp .6s cubic-bezier(.2,.7,.2,1) both" }}>
      <g stroke={LS.bugisTeal} strokeOpacity="0.15" strokeWidth="1" strokeLinecap="round">
        <path d="M20 140 Q 60 135, 100 140 T 180 140 T 230 138" />
        <path d="M10 150 Q 50 145, 90 150 T 170 150 T 230 148" />
        <path d="M30 160 Q 70 156, 110 160 T 190 160 T 230 158" />
      </g>
      <path d="M60 130 L180 130 L165 145 L75 145 Z" fill={LS.bugisRed} opacity="0.85" />
      <path d="M60 130 L180 130 L175 135 L65 135 Z" fill={LS.bugisGold} opacity="0.9" />
      <line x1="95" y1="130" x2="95" y2="60" stroke={LS.ink} strokeWidth="1.5" />
      <line x1="145" y1="130" x2="145" y2="50" stroke={LS.ink} strokeWidth="1.5" />
      <path d="M95 60 Q 115 75, 120 125 L 95 125 Z" fill="#fff" stroke={LS.border} strokeWidth="1" />
      <path d="M145 50 Q 170 68, 175 125 L 145 125 Z" fill="#fff" stroke={LS.border} strokeWidth="1" />
      <path d="M95 60 Q 80 78, 75 125 L 95 125 Z" fill="#FAF7F1" stroke={LS.border} strokeWidth="1" />
      <path d="M155 82 L165 92 L155 102 L145 92 Z" fill="none" stroke={LS.bugisGold} strokeWidth="1.2" />
      <g className="ls-drift" style={{ transformOrigin: "40px 50px" }}>
        <rect x="25" y="30" width="30" height="40" rx="2" fill="#fff" stroke={LS.border} />
        <line x1="30" y1="40" x2="48" y2="40" stroke={LS.muteSoft} strokeWidth="1" />
        <line x1="30" y1="46" x2="50" y2="46" stroke={LS.muteSoft} strokeWidth="1" />
        <line x1="30" y1="52" x2="45" y2="52" stroke={LS.muteSoft} strokeWidth="1" />
      </g>
      <g style={{ animation: "lsDrift 7s ease-in-out infinite", animationDelay: ".8s", transformOrigin: "200px 40px" }}>
        <rect x="188" y="20" width="26" height="35" rx="2" fill="#fff" stroke={LS.border} transform="rotate(8 201 37)" />
        <circle cx="205" cy="30" r="2" fill={LS.bugisGold} />
      </g>
      <circle cx="210" cy="60" r="1.5" fill={LS.bugisGold} className="ls-twinkle" />
      <circle cx="30" cy="95" r="1.5" fill={LS.bugisGold} className="ls-twinkle" style={{ animationDelay: "1s" }} />
      <circle cx="190" cy="95" r="1.2" fill={LS.bugisGold} className="ls-twinkle" style={{ animationDelay: "1.6s" }} />
    </svg>
  );
}

// ─── Login hero: aksara + sulapa' eppa constellation ─────────────
export function LoginHeroIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none"
         style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="loginGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#loginGlow)" />
      <g stroke="#fff" strokeWidth="1.2" strokeOpacity="0.3" fill="none">
        <path d="M200 80 L320 200 L200 320 L80 200 Z" />
        <path d="M200 120 L280 200 L200 280 L120 200 Z" />
        <path d="M200 160 L240 200 L200 240 L160 200 Z" />
      </g>
      <g stroke="#fff" strokeWidth="0.8" strokeOpacity="0.2" fill="none"
         style={{ transformOrigin: "200px 200px", animation: "lsSpin 60s linear infinite" }}>
        <path d="M200 40 L360 200 L200 360 L40 200 Z" />
      </g>
      {[[80, 70], [320, 80], [340, 310], [70, 320], [200, 60], [350, 200], [200, 340], [50, 200]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#fff" opacity="0.6" className="ls-twinkle"
                style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      <text x="200" y="215" fill="#fff" fillOpacity="0.25"
            style={{ fontFamily: LS.fontBugis, fontSize: 80, textAnchor: "middle", letterSpacing: 8 }}>
        ᨒᨚ
      </text>
    </svg>
  );
}

// ─── Upload illustration ────────────────────────────────────────
export function UploadIllustration({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="uploadPaper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FAF7F1" /><stop offset="100%" stopColor="#F5F1EA" />
        </linearGradient>
      </defs>
      <rect x="30" y="25" width="60" height="75" rx="3" fill="url(#uploadPaper)" stroke={LS.borderStrong} />
      <path d="M75 25 L90 40 L75 40 Z" fill={LS.border} stroke={LS.borderStrong} />
      <text x="38" y="50" fill={LS.bugisGold} fillOpacity="0.5"
            style={{ fontFamily: LS.fontBugis, fontSize: 11, letterSpacing: 2 }}>ᨒᨚᨉ</text>
      <line x1="38" y1="60" x2="82" y2="60" stroke={LS.muteSoft} strokeOpacity="0.4" strokeWidth="1" />
      <line x1="38" y1="68" x2="78" y2="68" stroke={LS.muteSoft} strokeOpacity="0.4" strokeWidth="1" />
      <line x1="38" y1="76" x2="82" y2="76" stroke={LS.muteSoft} strokeOpacity="0.4" strokeWidth="1" />
      <line x1="38" y1="84" x2="70" y2="84" stroke={LS.muteSoft} strokeOpacity="0.4" strokeWidth="1" />
      <g className="ls-drift">
        <circle cx="95" cy="30" r="12" fill={LS.brand} />
        <path d="M95 35 L95 25 M91 29 L95 25 L99 29" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// ─── Bugis seal (small decorative stamp) ─────────────────────────
export function BugisSeal({ size = 60, color = LS.bugisRed }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="27" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="30" cy="30" r="22" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M30 12 L42 30 L30 48 L18 30 Z" fill="none" stroke={color} strokeWidth="1" />
      <text x="30" y="35" fill={color}
            style={{ fontFamily: LS.fontBugis, fontSize: 16, textAnchor: "middle", letterSpacing: 1 }}>
        ᨒᨚ
      </text>
    </svg>
  );
}

// ─── Confetti burst for celebration ──────────────────────────────
export function ConfettiBurst() {
  const pieces = useMemo(() => {
    const out = [];
    const colors = [LS.bugisGold, LS.bugisRed, LS.ok, LS.brand, LS.bugisTeal];
    for (let i = 0; i < 18; i++) {
      out.push({
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 1.6 + Math.random() * 1.2,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        spin: `${Math.random() * 540 - 270}deg`,
      });
    }
    return out;
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute", left: `${p.x}%`, top: 0,
          width: p.size, height: p.size * 1.4,
          background: p.color, borderRadius: 1,
          animation: `lsConfetti ${p.duration}s ease-out ${p.delay}s infinite`,
          "--spin": p.spin,
        }} />
      ))}
    </div>
  );
}

// ─── AI Sparkle (animated) ───────────────────────────────────────
export function AnimatedSparkle({ size = 20, color = LS.ai }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L13.8 8.2 L19 10 L13.8 11.8 L12 17 L10.2 11.8 L5 10 L10.2 8.2 Z"
            fill={color} className="ls-twinkle" style={{ transformOrigin: "12px 10px" }} />
      <path d="M19 4 L19.6 5.4 L21 6 L19.6 6.6 L19 8 L18.4 6.6 L17 6 L18.4 5.4 Z"
            fill={color} className="ls-twinkle" style={{ transformOrigin: "19px 6px", animationDelay: ".5s" }} />
    </svg>
  );
}

// ─── Animated check (draws in) ───────────────────────────────────
export function AnimatedCheck({ size = 48, color = "#fff", strokeWidth = 3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke={color} strokeOpacity="0.3" strokeWidth={strokeWidth}
              strokeDasharray="126" style={{ animation: "lsCircleDraw .6s cubic-bezier(.2,.7,.2,1) both" }} />
      <path d="M16 24 L22 30 L32 18" stroke={color} strokeWidth={strokeWidth + 0.5}
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray="28" strokeDashoffset="28"
            style={{ animation: "lsCheckDraw .35s cubic-bezier(.2,.7,.2,1) .35s both" }} />
    </svg>
  );
}
