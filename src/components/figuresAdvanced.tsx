/* 解説向けの図(ネスペの基礎力のような図解)
   - encap  : カプセル化の入れ子
   - bits   : ビット/バイトへの分解
   - header : プロトコルヘッダの構造(32ビット幅)
   - console: 実機のコマンド出力(該当行をハイライト)
   - topo   : 機器アイコン付きのネットワーク構成図
   配色は patterns. のトークンに従い、モノクロ+アクセント1色に抑える。 */
import type { ReactNode } from "react";
import { T, MONO, SANS } from "../design/tokens";
import type { FigSpec } from "../engine/types";

const mono = (size: number) => ({ fontFamily: MONO, fontSize: size });
const sans = (size: number, w = 600) => ({ fontFamily: SANS, fontSize: size, fontWeight: w });

/** 帯の塗り分け。ヘッダは濃く、データは白、トレーラは薄く */
const FILL = { header: "#EDEDEA", data: "#FFFFFF", trailer: "#F6F6F4" } as const;

function Svg({ vb, children }: { vb: string; children: ReactNode }) {
  return (
    <svg viewBox={vb} style={{ display: "block", width: "100%", height: "auto" }}>
      <defs>
        <marker id="fa-ar" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill={T.ink} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

/* ---------------- encap: カプセル化 ---------------- */
export function FigEncap({ spec }: { spec: Extract<FigSpec, { kind: "encap" }> }) {
  const LEFT = 88, RIGHT = 336, ROW = 36, PAD = 10;
  const W = RIGHT - LEFT;
  const H = spec.layers.length * ROW + PAD + (spec.caption ? 16 : 4);
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {spec.layers.map((L, li) => {
        const total = L.parts.reduce((s, p) => s + p.w, 0);
        let x = LEFT;
        const y = PAD + li * ROW;
        return (
          <g key={li}>
            <text x={LEFT - 8} y={y + 15} textAnchor="end" style={sans(8, 600)} fill={T.sub}>{L.label}</text>
            {L.parts.map((p, pi) => {
              const w = (p.w / total) * W;
              /* 等幅の日本語は1文字≒1em。1行で入らなければ2行に折り返す */
              const fit = (len: number) => Math.min(7.4, (w - 5) / Math.max(1, len));
              let lines = [p.t];
              if (fit(p.t.length) < 5.6) {
                const sp = p.t.lastIndexOf(" ");
                const cut = sp > 0 ? sp : Math.ceil(p.t.length / 2);
                lines = [p.t.slice(0, cut).trim(), p.t.slice(cut).trim()].filter(Boolean);
              }
              const fs = Math.max(4.8, fit(Math.max(...lines.map((l) => l.length))));
              const cx = x + (w - 1.5) / 2;
              const el = (
                <g key={pi}>
                  <rect x={x} y={y} width={w - 1.5} height={22} rx={3}
                    fill={FILL[p.role ?? "data"]} stroke={p.role === "data" ? T.line : T.ink} strokeWidth={1.2} />
                  {lines.map((ln, i) => (
                    <text key={i} x={cx} y={y + (lines.length === 1 ? 14.5 : 11 + i * (fs + 1.5))}
                      textAnchor="middle" style={mono(fs)} fill={T.ink}>{ln}</text>
                  ))}
                </g>
              );
              x += w;
              return el;
            })}
            {li < spec.layers.length - 1 && (
              <line x1={LEFT - 4} y1={y + 25} x2={LEFT - 4} y2={y + 33} stroke={T.ink} strokeWidth={1.2} markerEnd="url(#fa-ar)" />
            )}
          </g>
        );
      })}
      {spec.caption && <text x={170} y={H - 4} textAnchor="middle" style={mono(8)} fill={T.faint}>{spec.caption}</text>}
    </Svg>
  );
}

/* ---------------- bits: ビット分解 ---------------- */
export function FigBits({ spec }: { spec: Extract<FigSpec, { kind: "bits" }> }) {
  const n = spec.cells.length;
  const stepN = spec.cells[0]?.steps.length ?? 0;
  const colW = 308 / n;
  const H = 40 + stepN * 30 + (spec.total ? 20 : 0) + (spec.note ? 14 : 0) + (spec.caption ? 14 : 6);
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {spec.cells.map((c, i) => {
        const cx = 16 + colW * i + colW / 2;
        return (
          <g key={i}>
            <text x={cx} y={26} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600 }} fill={T.ink}>{c.top}</text>
            {i < n - 1 && spec.sep && (
              <text x={16 + colW * (i + 1) - 3} y={26} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600 }} fill={T.sub}>{spec.sep}</text>
            )}
            {i < n - 1 && <line x1={16 + colW * (i + 1)} y1={10} x2={16 + colW * (i + 1)} y2={34 + stepN * 30} stroke={T.line} strokeWidth={1} />}
            {c.steps.map((s, si) => (
              <g key={si}>
                <line x1={cx} y1={32 + si * 30} x2={cx} y2={44 + si * 30} stroke={T.ink} strokeWidth={1.2} markerEnd="url(#fa-ar)" />
                <text x={cx} y={58 + si * 30} textAnchor="middle" style={mono(9)} fill={T.ink}>{s}</text>
              </g>
            ))}
          </g>
        );
      })}
      {spec.total && (
        <g>
          <line x1={16} y1={68 + (stepN - 1) * 30} x2={324} y2={68 + (stepN - 1) * 30} stroke={T.line} />
          <text x={324} y={82 + (stepN - 1) * 30} textAnchor="end" style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600 }} fill={T.ink}>{spec.total}</text>
        </g>
      )}
      {spec.note && <text x={170} y={H - (spec.caption ? 16 : 4)} textAnchor="middle" style={mono(8.2)} fill={T.sub}>{spec.note}</text>}
      {spec.caption && <text x={170} y={H - 3} textAnchor="middle" style={mono(8)} fill={T.faint}>{spec.caption}</text>}
    </Svg>
  );
}

/* ---------------- header: ヘッダ構造 ---------------- */
export function FigHeader({ spec }: { spec: Extract<FigSpec, { kind: "header" }> }) {
  const unit = spec.unit ?? 32;
  const LEFT = 8, W = 324, ROW = 24;
  const H = 20 + spec.rows.length * ROW + (spec.caption ? 16 : 6);
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {[0, 8, 16, 24, 32].map((b) => (
        <g key={b}>
          <text x={LEFT + (b / unit) * W} y={9} textAnchor={b === 0 ? "start" : b === unit ? "end" : "middle"} style={mono(7)} fill={T.faint}>{b}</text>
          <line x1={LEFT + (b / unit) * W} y1={12} x2={LEFT + (b / unit) * W} y2={15} stroke={T.line} />
        </g>
      ))}
      {spec.rows.map((r, ri) => {
        let x = LEFT;
        const y = 16 + ri * ROW;
        return (
          <g key={ri}>
            {r.fields.map((f, fi) => {
              const w = (f.bits / unit) * W;
              const el = (
                <g key={fi}>
                  <rect x={x} y={y} width={w - 1} height={ROW - 3} rx={2}
                    fill={f.hi ? "#EDEDEA" : "#fff"} stroke={f.hi ? T.ink : T.line} strokeWidth={f.hi ? 1.4 : 1} />
                  <text x={x + (w - 1) / 2} y={y + 13.5} textAnchor="middle" style={mono(Math.min(7.6, Math.max(5.6, w / 5)))} fill={f.hi ? T.ink : T.sub}>{f.t}</text>
                </g>
              );
              x += w;
              return el;
            })}
          </g>
        );
      })}
      {spec.caption && <text x={170} y={H - 3} textAnchor="middle" style={mono(8)} fill={T.faint}>{spec.caption}</text>}
    </Svg>
  );
}

/* ---------------- console: 実機の出力 ---------------- */
export function FigConsole({ spec }: { spec: Extract<FigSpec, { kind: "console" }> }) {
  const hi = new Set(spec.highlight ?? []);
  return (
    <div>
      <div style={{ background: T.codeBg, borderRadius: 10, padding: "12px 14px", overflowX: "auto" }}>
        {spec.lines.map((l, i) => (
          <div key={i} style={{
            fontFamily: MONO, fontSize: 10.5, lineHeight: 1.9, whiteSpace: "pre",
            color: hi.has(i) ? "#fff" : T.codeText,
            background: hi.has(i) ? "rgba(255,255,255,0.10)" : "transparent",
            border: hi.has(i) ? `1px solid ${T.ng}` : "1px solid transparent",
            borderRadius: 4, padding: hi.has(i) ? "1px 5px" : "1px 5px",
            margin: hi.has(i) ? "1px -5px" : "1px -5px",
          }}>{l || " "}</div>
        ))}
      </div>
      {spec.caption && <div style={{ fontFamily: MONO, fontSize: 8.5, color: T.faint, marginTop: 6, textAlign: "center" }}>{spec.caption}</div>}
    </div>
  );
}

/* ---------------- topo: 機器アイコン付き構成図 ---------------- */
function Icon({ kind, x, y, hi }: { kind: string; x: number; y: number; hi?: boolean }) {
  const s = hi ? T.ink : T.sub;
  const sw = 1.3;
  const g = (children: ReactNode) => <g transform={`translate(${x - 14},${y - 12})`} fill="none" stroke={s} strokeWidth={sw} strokeLinejoin="round">{children}</g>;
  switch (kind) {
    case "pc":
      return g(<>
        <rect x={2} y={2} width={24} height={16} rx={2} fill="#fff" />
        <line x1={6} y1={18} x2={22} y2={18} />
        <path d="M9 22 L19 22" />
        <line x1={14} y1={18} x2={14} y2={22} />
      </>);
    case "server":
      return g(<>
        <rect x={5} y={1} width={18} height={22} rx={2} fill="#fff" />
        <line x1={5} y1={8} x2={23} y2={8} />
        <line x1={5} y1={15} x2={23} y2={15} />
        <circle cx={9} cy={4.5} r={1.1} fill={s} stroke="none" />
        <circle cx={9} cy={11.5} r={1.1} fill={s} stroke="none" />
        <circle cx={9} cy={18.5} r={1.1} fill={s} stroke="none" />
      </>);
    case "router":
      return g(<>
        <ellipse cx={14} cy={12} rx={13} ry={8} fill="#fff" />
        <path d="M8 12 L20 12" markerEnd="url(#fa-ar)" />
        <path d="M11 8.5 L11 5.5 M11 5.5 L9 7 M11 5.5 L13 7" />
        <path d="M17 15.5 L17 18.5 M17 18.5 L15 17 M17 18.5 L19 17" />
      </>);
    case "l2sw":
      return g(<>
        <rect x={1} y={5} width={26} height={14} rx={2} fill="#fff" />
        <path d="M7 9 L21 9 M21 9 L18.5 7.2 M21 9 L18.5 10.8" />
        <path d="M21 15 L7 15 M7 15 L9.5 13.2 M7 15 L9.5 16.8" />
      </>);
    case "l3sw":
      return g(<>
        <rect x={1} y={4} width={26} height={16} rx={2} fill="#fff" />
        <path d="M6 9 L22 9 M22 9 L19.5 7.4 M22 9 L19.5 10.6" />
        <path d="M22 15 L6 15 M6 15 L8.5 13.4 M6 15 L8.5 16.6" />
        <text x={14} y={22.5} textAnchor="middle" style={mono(5.4)} fill={s} stroke="none">L3</text>
      </>);
    case "fw":
      return g(<>
        <rect x={3} y={2} width={22} height={20} rx={2} fill="#fff" />
        <line x1={3} y1={9} x2={25} y2={9} />
        <line x1={3} y1={16} x2={25} y2={16} />
        <line x1={11} y1={2} x2={11} y2={9} />
        <line x1={18} y1={9} x2={18} y2={16} />
        <line x1={11} y1={16} x2={11} y2={22} />
      </>);
    case "cloud":
    case "internet":
      return g(<>
        <path d="M7 19 C3 19 2 15.5 5 14 C4.4 9 10 6.5 13 10 C15 6 22 7.5 22 12 C26 12 26.5 19 22 19 Z" fill="#fff" />
      </>);
    case "ap":
      return g(<>
        <rect x={7} y={13} width={14} height={8} rx={2} fill="#fff" />
        <path d="M9 9 C11 6.5 17 6.5 19 9" />
        <path d="M6 6 C10 1.5 18 1.5 22 6" />
      </>);
    case "phone":
      return g(<>
        <rect x={4} y={7} width={20} height={14} rx={2} fill="#fff" />
        <path d="M8 7 L8 4 L20 4 L20 7" />
        <line x1={8} y1={12} x2={14} y2={12} />
        <line x1={8} y1={16} x2={14} y2={16} />
        <rect x={17} y={11} width={4} height={7} rx={1} />
      </>);
    default:
      return null;
  }
}

export function FigTopo({ spec }: { spec: Extract<FigSpec, { kind: "topo" }> }) {
  const H = spec.height ?? 170;
  const by = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {(spec.zones ?? []).map((z, i) => (
        <g key={i}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={10} fill="none" stroke={T.line} strokeWidth={1.2} strokeDasharray={z.dashed ? "4 3" : undefined} />
          <rect x={z.x + 6} y={z.y + 3} width={z.label.length * 7.6 + 8} height={12} rx={3} fill={T.paper} />
          <text x={z.x + 10} y={z.y + 12} style={mono(7.5)} fill={T.faint}>{z.label}</text>
        </g>
      ))}
      {(spec.links ?? []).map((l, i) => {
        const a = by[l.from], b = by[l.to];
        if (!a || !b) return null;
        /* アイコンの下に線が潜らないよう、両端を少し縮める */
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const GAP = 16;
        const ax = a.x + ux * GAP, ay = a.y + uy * GAP;
        const bx = b.x - ux * GAP, by2 = b.y - uy * GAP;
        const midX = (ax + bx) / 2, midY = (ay + by2) / 2;
        return (
          <g key={i}>
            {l.double ? (
              <>
                <line x1={ax} y1={ay - 1.6} x2={bx} y2={by2 - 1.6} stroke={T.ink} strokeWidth={1.2} />
                <line x1={ax} y1={ay + 1.6} x2={bx} y2={by2 + 1.6} stroke={T.ink} strokeWidth={1.2} />
              </>
            ) : (
              <line x1={ax} y1={ay} x2={bx} y2={by2} stroke={l.dash ? T.sub : T.ink} strokeWidth={1.2} strokeDasharray={l.dash ? "4 3" : undefined} />
            )}
            {l.label && (
              <>
                <rect x={midX - l.label.length * 2.6 - 3} y={midY - 12} width={l.label.length * 5.2 + 6} height={11} rx={2} fill={T.paper} />
                <text x={midX} y={midY - 3.5} textAnchor="middle" style={mono(7.2)} fill={T.sub}>{l.label}</text>
              </>
            )}
          </g>
        );
      })}
      {spec.nodes.map((n) => (
        <g key={n.id}>
          <Icon kind={n.icon} x={n.x} y={n.y} hi={n.hi} />
          <text x={n.x} y={n.y + 22} textAnchor="middle" style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600 }} fill={n.hi ? T.ink : T.sub}>{n.label}</text>
          {n.sub && <text x={n.x} y={n.y + 30} textAnchor="middle" style={mono(6.6)} fill={T.faint}>{n.sub}</text>}
        </g>
      ))}
      {spec.caption && <text x={170} y={H - 4} textAnchor="middle" style={mono(8)} fill={T.faint}>{spec.caption}</text>}
    </Svg>
  );
}
