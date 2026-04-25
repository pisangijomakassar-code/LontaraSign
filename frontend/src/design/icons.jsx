// Line icons, 24×24 viewBox, stroke=currentColor
const paths = {
  upload: '<path d="M12 3v12M7 8l5-5 5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>',
  doc: '<path d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M14 3v5h5"/>',
  docSigned: '<path d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M14 3v5h5"/><path d="M8 15l2 2 5-5" stroke="#047857"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="8" r="0.8" fill="currentColor"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 4l.6 1.4L21 6l-1.4.6L19 8l-.6-1.4L17 6l1.4-.6L19 4z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v3M14 20h7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevronR: '<path d="M9 5l7 7-7 7"/>',
  chevronL: '<path d="M15 5l-7 7 7 7"/>',
  chevronD: '<path d="M5 9l7 7 7-7"/>',
  home: '<path d="M3 12l9-8 9 8v8a2 2 0 01-2 2h-3v-6h-8v6H5a2 2 0 01-2-2v-8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  logout: '<path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M16 16l4-4-4-4M20 12H10"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pen: '<path d="M4 20l1-4L16 5l4 4L9 20H4z"/><path d="M14 7l3 3"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M3 18l5-5 4 4 3-3 6 5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12l2-1-1-3-2 .5-1.5-1.5L17 5l-3-1-1 2h-2l-1-2-3 1 .5 2.5L5 9l-2-.5-1 3 2 1v2l-2 1 1 3 2-.5L6.5 19 7 21l3-1 1-2h2l1 2 3-1-.5-2.5L18 15l2-.5 1-3-2-1v-2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  trash: '<path d="M4 7h16M10 7V4h4v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/>',
  filter: '<path d="M3 5h18l-7 9v5l-4-2v-3L3 5z"/>',
  refresh: '<path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/>',
  dashboard: '<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
  book: '<path d="M4 4h7a4 4 0 014 4v12a3 3 0 00-3-3H4V4zM20 4h-7a4 4 0 00-4 4v12a3 3 0 013-3h8V4z"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  arrowR: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  arrowL: '<path d="M19 12H5M11 5l-7 7 7 7"/>',
  undo: '<path d="M9 14l-4-4 4-4"/><path d="M5 10h9a5 5 0 010 10h-2"/>',
  history: '<path d="M3 12a9 9 0 109-9 9 9 0 00-7 3L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
};

export function Ic({ name, size = 20, color, style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      dangerouslySetInnerHTML={{ __html: paths[name] || "" }}
    />
  );
}

export const iconNames = Object.keys(paths);
