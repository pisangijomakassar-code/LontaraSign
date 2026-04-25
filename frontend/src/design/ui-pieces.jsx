import { useRef, useEffect, useState } from "react";
import { LS } from "./tokens";
import { Ic } from "./icons";

// ─────────────────────────────────────────────────────────────
// SignaturePad — canvas, returns dataURL via onChange
// ─────────────────────────────────────────────────────────────
export function SignaturePad({ value, onChange, height = 180, placeholder = "Tanda tangani di sini" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(!value);

  const getCtx = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== c.offsetWidth * dpr) {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
      const ctx = c.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 2.2;
    }
    return c.getContext("2d");
  };

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (value) {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.offsetWidth, c.offsetHeight);
      };
      img.src = value;
      setEmpty(false);
    } else {
      const c = canvasRef.current;
      ctx.clearRect(0, 0, c.width, c.height);
      setEmpty(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    setEmpty(false);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = getCtx();
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current;
    const data = c.toDataURL("image/png");
    onChange && onChange(data);
  };

  const clear = () => {
    const ctx = getCtx();
    const c = canvasRef.current;
    ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange && onChange(null);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        position: "relative",
        border: `1.5px dashed ${LS.borderStrong}`,
        borderRadius: LS.rMd, background: LS.surfaceMuted,
        height, overflow: "hidden",
      }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "crosshair" }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        {empty && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            color: LS.muteSoft, fontSize: 14, fontFamily: LS.font, pointerEvents: "none", gap: 8,
          }}>
            <Ic name="pen" size={18} />
            {placeholder}
          </div>
        )}
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 36, borderTop: `1px solid ${LS.borderStrong}`, opacity: 0.7 }} />
        <div style={{ position: "absolute", left: 24, bottom: 12, fontSize: 11, color: LS.muteSoft, letterSpacing: 0.4 }}>× Tanda tangan di atas garis</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <div style={{ fontSize: 12, color: LS.mute }}>
          Disarankan gunakan stylus atau mouse untuk hasil terbaik.
        </div>
        <button onClick={clear} disabled={empty}
          style={{
            fontSize: 13, fontFamily: LS.font, fontWeight: 500,
            color: empty ? LS.muteSoft : LS.inkSoft,
            background: "none", border: "none",
            cursor: empty ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
          <Ic name="refresh" size={14} /> Hapus
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PdfPreview — real PDF page preview with signature overlay
// Uses pagePreviewUrl from backend; falls back to faux page if not provided.
// ─────────────────────────────────────────────────────────────
export function PdfPreview({
  title = "Dokumen",
  pageLabel = "Hal. terakhir",
  pagePreviewUrl,
  signature, signerName, signerTitle, signedAt,
  compact = false, style,
}) {
  const pagePad = compact ? 18 : 28;
  const lineColor = "#E5E7EB";
  const lines = compact ? 14 : 22;

  return (
    <div style={{
      width: "100%", aspectRatio: "1 / 1.3", background: "#fff",
      border: `1px solid ${LS.border}`, borderRadius: 8,
      boxShadow: LS.shadowMd, position: "relative", overflow: "hidden",
      fontFamily: LS.font, ...style,
    }}>
      {pagePreviewUrl ? (
        <img src={pagePreviewUrl} alt={title}
             style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      ) : (
        <div style={{ padding: pagePad }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                        paddingBottom: 8, borderBottom: `1px solid ${LS.border}`, marginBottom: 12 }}>
            <div style={{ fontSize: compact ? 10 : 11, fontWeight: 600, color: LS.ink,
                          letterSpacing: 0.3, textTransform: "uppercase" }}>{title}</div>
            <div style={{ fontSize: compact ? 9 : 10, color: LS.mute }}>{pageLabel}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 8 }}>
            {Array.from({ length: lines }).map((_, i) => {
              const w = [100, 94, 88, 97, 92, 76, 98, 85, 90, 100, 80, 95, 88, 70, 92, 84, 98, 90, 100, 82, 88, 74][i % 22];
              const isHeading = [0, 6, 14].includes(i);
              return (
                <div key={i} style={{
                  height: isHeading ? (compact ? 6 : 8) : (compact ? 3.5 : 5),
                  width: `${isHeading ? 40 : w}%`,
                  background: isHeading ? LS.inkSoft : lineColor,
                  borderRadius: 2, opacity: isHeading ? 0.85 : 1,
                }} />
              );
            })}
          </div>
        </div>
      )}

      {(signature || signerName) && (
        <div style={{
          position: "absolute", right: pagePad, bottom: pagePad + 8,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: compact ? 6 : 8, minWidth: compact ? 120 : 160,
          background: "rgba(255,255,255,0.92)", borderRadius: 4,
        }}>
          {signature && (
            <img src={signature} alt="Tanda tangan"
              style={{ height: compact ? 40 : 54, maxWidth: "100%", objectFit: "contain",
                       mixBlendMode: "multiply", marginBottom: 4 }} />
          )}
          <div style={{ borderTop: `1px solid ${LS.muteSoft}`, width: "100%", paddingTop: 4,
                        textAlign: "center", fontSize: compact ? 8 : 10 }}>
            <div style={{ fontWeight: 600, color: LS.ink }}>{signerName || "—"}</div>
            {signerTitle && <div style={{ color: LS.mute, marginTop: 1 }}>{signerTitle}</div>}
            {signedAt && <div style={{ color: LS.muteSoft, marginTop: 1, fontSize: compact ? 7 : 9 }}>{signedAt}</div>}
          </div>
        </div>
      )}

      {signature && (
        <div style={{
          position: "absolute", left: pagePad, bottom: pagePad + 8,
          display: "flex", alignItems: "center", gap: 6,
          background: LS.aiSoft, border: "1px solid #DDD6FE", borderRadius: 6,
          padding: compact ? "4px 6px" : "6px 8px",
        }}>
          <div style={{ width: compact ? 18 : 24, height: compact ? 18 : 24, borderRadius: 4,
                        background: "#fff", border: `1px solid ${LS.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                          width: compact ? 12 : 16, height: compact ? 12 : 16 }}>
              {"1011011011011011".split("").map((c, i) =>
                <div key={i} style={{ background: c === "1" ? LS.ink : "#fff" }} />
              )}
            </div>
          </div>
          <div style={{ fontSize: compact ? 7 : 8, color: LS.ai, fontWeight: 600, letterSpacing: 0.4, lineHeight: 1.2 }}>
            LONTARA<br />AI REVIEW
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AIReviewBadge — premium gradient badge for AI review hero
// ─────────────────────────────────────────────────────────────
export function AIReviewBadge({ compact = false, confidence = 0.86, system = "LontaraAI Review" }) {
  const pct = Math.round(confidence * 100);
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${LS.ai} 0%, ${LS.brand} 100%)`,
      borderRadius: compact ? 12 : 16,
      padding: compact ? "12px 14px" : "18px 22px",
      color: "#fff", display: "flex", alignItems: "center", gap: compact ? 12 : 16,
      boxShadow: "0 8px 24px rgba(91,33,182,0.18)",
    }}>
      <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120,
                    borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", right: 30, bottom: -30, width: 80, height: 80,
                    borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{
        width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: 12,
        background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <Ic name="sparkle" size={compact ? 22 : 28} color="#fff" />
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ fontSize: compact ? 10 : 11, fontWeight: 700, opacity: 0.8,
                      letterSpacing: 1.2, textTransform: "uppercase" }}>{system}</div>
        <div style={{ fontSize: compact ? 14 : 17, fontWeight: 700, marginTop: 2, letterSpacing: -0.2 }}>
          Analisis otomatis selesai
        </div>
        <div style={{ fontSize: compact ? 11 : 12, opacity: 0.75, marginTop: 2 }}>
          Review awal — bukan keputusan final. Validasi oleh penyetuju tetap diperlukan.
        </div>
      </div>
      {!compact && (
        <div style={{ textAlign: "right", position: "relative" }}>
          <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase" }}>Confidence</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stepper — small N-step progress indicator
// ─────────────────────────────────────────────────────────────
export function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: LS.font }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const bg = done ? LS.ok : active ? LS.brand : LS.surfaceMuted;
        const color = done || active ? "#fff" : LS.muteSoft;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: bg, color, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${done ? LS.ok : active ? LS.brand : LS.border}`,
            }}>
              {done ? "✓" : i + 1}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: done || active ? LS.ink : LS.muteSoft,
              whiteSpace: "nowrap",
            }}>{s}</div>
            {i < steps.length - 1 && (
              <div style={{ width: 18, height: 1, background: LS.border, margin: "0 4px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────
export function ModalShell({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      padding: 20, animation: "lsFadeIn .2s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="ls-scale-in" style={{
        background: "#fff", borderRadius: LS.rLg, boxShadow: LS.shadowLg,
        width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column", fontFamily: LS.font,
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: `1px solid ${LS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: LS.ink }}>{title}</div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: LS.mute, padding: 4, display: "flex",
          }}>
            <Ic name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: `1px solid ${LS.border}`,
                        display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
