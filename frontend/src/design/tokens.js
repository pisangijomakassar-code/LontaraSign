// LontaraSign design tokens — Bugis/Lontara-inspired warm palette
export const LS = {
  bg: "#F5F1EA",
  surface: "#FFFFFF",
  surfaceMuted: "#FAF7F1",
  border: "#E6DFD2",
  borderStrong: "#C9BFAB",
  ink: "#1A1410",
  inkSoft: "#3E342B",
  mute: "#7A6D5E",
  muteSoft: "#A89B89",

  brand: "#1D4ED8",
  brandInk: "#1E3A8A",
  brandSoft: "#EEF4FF",
  brandRing: "rgba(29,78,216,0.18)",

  bugisRed: "#8B1F1F",
  bugisGold: "#B8891E",
  bugisGoldSoft: "#FBF4E3",
  bugisTeal: "#0E6B63",
  bugisIndigo: "#2A3A7A",

  ok: "#047857",
  okSoft: "#ECFDF5",
  warn: "#B45309",
  warnSoft: "#FFFBEB",
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",

  ai: "#5B21B6",
  aiSoft: "#F5F3FF",

  shadowSm: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
  shadowMd: "0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)",
  shadowLg: "0 12px 32px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)",

  rSm: 8,
  rMd: 12,
  rLg: 16,
  rXl: 20,

  font: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  fontBugis: '"Noto Sans Buginese", "Noto Sans", serif',
};

export const LONTARA_GLYPHS = "ᨒᨚᨉᨈᨑ";
export const LONTARA_ORNAMENT = "ᨕ ᨒ ᨚ ᨉ ᨈ ᨑ ᨕ";

export const BUGIS_GREETINGS = {
  morning: { bugis: "Tabe'", indo: "Selamat pagi" },
  afternoon: { bugis: "Tabe'", indo: "Selamat siang" },
  evening: { bugis: "Tabe'", indo: "Selamat sore" },
};

export function greetByTime(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return BUGIS_GREETINGS.morning;
  if (h < 15) return BUGIS_GREETINGS.afternoon;
  return BUGIS_GREETINGS.evening;
}

// Bugis lattice svg (sulapa' eppa pattern)
export const bugisLatticeSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23B8891E' stroke-width='0.8' stroke-opacity='0.14'%3E%3Cpath d='M30 6 L54 30 L30 54 L6 30 Z'/%3E%3Cpath d='M30 18 L42 30 L30 42 L18 30 Z'/%3E%3Ccircle cx='30' cy='30' r='1.2' fill='%23B8891E' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`;

export const brandTextureSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%231D4ED8' stroke-width='0.6' stroke-opacity='0.05'%3E%3Cpath d='M10 40 Q 20 20, 40 20 Q 60 20, 60 40'/%3E%3Cpath d='M40 60 Q 30 40, 40 20'/%3E%3Ccircle cx='70' cy='10' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
