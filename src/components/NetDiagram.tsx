import { T, MONO, EASE } from "../design/tokens";

/* A社トポロジの SVG 図(可視化ステップ用)
   nodes は [R10, R11, R20, R21] の順で、active のインデックスと対応する */
const POS = [
  { x: 78, y: 46 },   // R10 (大阪 · 広域イーサ側)
  { x: 78, y: 112 },  // R11 (大阪 · IPsec側)
  { x: 262, y: 46 },  // R20 (東京 · 広域イーサ側)
  { x: 262, y: 112 }, // R21 (東京 · IPsec側)
];
const NW = 52, NH = 26; // ノード矩形サイズ

function Node({ label, x, y, active }: { label: string; x: number; y: number; active: boolean }) {
  return (
    <g style={{ transition: `opacity 300ms ${EASE}` }}>
      <rect x={x - NW / 2} y={y - NH / 2} width={NW} height={NH} rx={7}
        fill={active ? "#FBFBFA" : "#FFFFFF"}
        stroke={active ? T.ink : T.line} strokeWidth={1.5}
        style={{ transition: `stroke 300ms ${EASE}, fill 300ms ${EASE}` }} />
      <text x={x} y={y + 4} textAnchor="middle"
        style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, transition: `fill 300ms ${EASE}` }}
        fill={active ? T.ink : T.faint}>{label}</text>
    </g>
  );
}

export function VizDiagram({ nodes, active, cut }: { nodes: string[]; active: number[]; cut: boolean }) {
  const [r10, r11, r20, r21] = POS;
  const topY = r10.y, botY = r11.y;
  const lx = r10.x + NW / 2, rx = r20.x - NW / 2; // リンクの左右端
  const midX = (lx + rx) / 2;
  const wanColor = cut ? T.faint : T.ink;
  return (
    <svg viewBox="0 0 340 158" style={{ display: "block", width: "100%", height: "auto" }} role="img" aria-label="A社ネットワーク構成図">
      {/* 拠点の枠 */}
      <rect x={38} y={16} width={80} height={126} rx={12} fill="none" stroke={T.line} strokeWidth={1} />
      <text x={46} y={153} style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.08em" }} fill={T.faint}>大阪本社</text>
      <rect x={222} y={16} width={80} height={126} rx={12} fill="none" stroke={T.line} strokeWidth={1} />
      <text x={230} y={153} style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.08em" }} fill={T.faint}>東京支社</text>

      {/* 拠点内の接続(R10—R11 / R20—R21) */}
      <line x1={r10.x} y1={topY + NH / 2} x2={r11.x} y2={botY - NH / 2} stroke={T.line} strokeWidth={1.5} />
      <line x1={r20.x} y1={topY + NH / 2} x2={r21.x} y2={botY - NH / 2} stroke={T.line} strokeWidth={1.5} />

      {/* 広域イーサ網(二重線) */}
      <line x1={lx} y1={topY - 3} x2={rx} y2={topY - 3} stroke={wanColor} strokeWidth={1.5} style={{ transition: `stroke 300ms ${EASE}` }} />
      <line x1={lx} y1={topY + 3} x2={rx} y2={topY + 3} stroke={wanColor} strokeWidth={1.5} style={{ transition: `stroke 300ms ${EASE}` }} />
      <text x={midX} y={topY - 12} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 9 }} fill={cut ? T.faint : T.sub}>広域イーサ網 · cost100</text>
      {cut && (
        <g>
          <circle cx={midX} cy={topY} r={9} fill="#FFFFFF" stroke={T.ink} strokeWidth={1.5} />
          <line x1={midX - 4} y1={topY - 4} x2={midX + 4} y2={topY + 4} stroke={T.ink} strokeWidth={1.5} />
          <line x1={midX - 4} y1={topY + 4} x2={midX + 4} y2={topY - 4} stroke={T.ink} strokeWidth={1.5} />
        </g>
      )}

      {/* IPsec VPN(破線) */}
      <line x1={lx} y1={botY} x2={rx} y2={botY} stroke={cut ? T.ink : T.sub} strokeWidth={1.5} strokeDasharray="5 4" style={{ transition: `stroke 300ms ${EASE}` }} />
      <text x={midX} y={botY + 18} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 9 }} fill={cut ? T.ink : T.sub}>IPsec VPN · cost1000</text>

      {/* ノード */}
      {nodes.map((n, i) => <Node key={n} label={n} x={POS[i].x} y={POS[i].y} active={active.includes(i)} />)}
    </svg>
  );
}
