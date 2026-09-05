export const T = {
  paper: "#FAF8F3",
  card: "#FFFFFF",
  ink: "#223D35",
  sub: "#59675F",
  faint: "#6D796F",
  line: "#D9E2DB",
  ok: "#176B5A",
  okBg: "#E7F6F0",
  ng: "#A14030",
  ngBg: "#FDEBEB",
  codeBg: "#151517",
  codeText: "#E7E7EA",
};

export const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Hiragino Sans', sans-serif";
export const MONO =
  "ui-monospace, 'SF Mono', 'SFMono-Regular', Menlo, Consolas, monospace";
export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const CSS = `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
  html, body, #root { margin: 0; padding: 0; }
  button { font: inherit; }
  a { color: inherit; }
  @keyframes shakeX { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 50%{transform:translateX(5px)} 75%{transform:translateX(-3px)} }
  .shake { animation: shakeX 380ms ${EASE}; }
  @keyframes riseIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
  .riseIn { animation: riseIn 500ms ${EASE} both; }
  button:focus-visible, textarea:focus-visible, input:focus-visible { outline: 2px solid ${T.ink}; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .shake, .riseIn { animation: none !important; } * { transition: none !important; } }
`;
