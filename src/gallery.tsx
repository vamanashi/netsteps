/* 図のサンプル一覧(開発用) http://localhost:PORT/gallery.html */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { T, SANS, MONO, CSS } from "./design/tokens";
import { Fig } from "./components/figures";
import type { FigRef } from "./engine/types";

const SAMPLES: { title: string; note: string; fig: FigRef }[] = [
  {
    title: "カプセル化(encap)",
    note: "統一的な知識の中心。上の層のデータが、下の層でヘッダに包まれていく",
    fig: {
      kind: "encap",
      layers: [
        { label: "アプリケーション", parts: [{ t: "HTTPリクエスト(データ)", w: 100, role: "data" }] },
        { label: "トランスポート", parts: [{ t: "TCPヘッダ 20B", w: 22, role: "header" }, { t: "データ", w: 100, role: "data" }] },
        { label: "ネットワーク", parts: [{ t: "IPヘッダ 20B", w: 22, role: "header" }, { t: "TCPヘッダ", w: 22, role: "header" }, { t: "データ", w: 100, role: "data" }] },
        { label: "データリンク", parts: [{ t: "イーサヘッダ 14B", w: 24, role: "header" }, { t: "IPヘッダ", w: 20, role: "header" }, { t: "TCPヘッダ", w: 20, role: "header" }, { t: "データ", w: 88, role: "data" }, { t: "FCS 4B", w: 14, role: "trailer" }] },
      ],
      caption: "下の層へ渡すたびにヘッダが1つ増える。受信側は逆順に外す",
    },
  },
  {
    title: "ビット分解(bits)",
    note: "「IPv4アドレスは何バイトか」を、暗記でなく導出で示す",
    fig: {
      kind: "bits",
      cells: [
        { top: "255", steps: ["8ビット", "1バイト"] },
        { top: "255", steps: ["8ビット", "1バイト"] },
        { top: "255", steps: ["8ビット", "1バイト"] },
        { top: "255", steps: ["8ビット", "1バイト"] },
      ],
      sep: ".",
      total: "合計 4バイト",
      note: "各ブロックは0〜255の256個の値をとる。256 = 2の8乗なので8ビット",
    },
  },
  {
    title: "ヘッダ構造(header)",
    note: "32ビット幅で描く。午後で問われるフィールドだけ濃く強調できる",
    fig: {
      kind: "header",
      rows: [
        { fields: [{ t: "バージョン", bits: 4 }, { t: "IHL", bits: 4 }, { t: "TOS", bits: 8 }, { t: "全長", bits: 16, hi: true }] },
        { fields: [{ t: "識別子", bits: 16 }, { t: "フラグ", bits: 3, hi: true }, { t: "フラグメントオフセット", bits: 13, hi: true }] },
        { fields: [{ t: "TTL", bits: 8, hi: true }, { t: "プロトコル", bits: 8, hi: true }, { t: "ヘッダチェックサム", bits: 16 }] },
        { fields: [{ t: "送信元IPアドレス", bits: 32, hi: true }] },
        { fields: [{ t: "宛先IPアドレス", bits: 32, hi: true }] },
      ],
      caption: "IPv4ヘッダ(20バイト)。濃い枠は午後で問われやすいフィールド",
    },
  },
  {
    title: "実機の出力(console)",
    note: "手を動かす前提の導入。該当行を赤枠でハイライトする",
    fig: {
      kind: "console",
      lines: [
        "C:\\>ipconfig",
        "",
        "イーサネット アダプター イーサネット:",
        "   接続固有の DNS サフィックス . . . :",
        "   リンクローカル IPv6 アドレス. . . : fe80::1a2b:3c4d%12",
        "   IPv4 アドレス . . . . . . . . . . : 192.168.1.100",
        "   サブネット マスク . . . . . . . . : 255.255.255.0",
        "   デフォルト ゲートウェイ . . . . . : 192.168.1.1",
      ],
      highlight: [5, 6],
      caption: "自分のPCで ipconfig を実行して確かめる",
    },
  },
  {
    title: "構成図(topo)",
    note: "機器アイコン付き。ゾーン枠・回線ラベルも描ける",
    fig: {
      kind: "topo",
      height: 226,
      zones: [
        { x: 6, y: 108, w: 150, h: 106, label: "本社LAN" },
        { x: 214, y: 108, w: 120, h: 106, label: "DMZ", dashed: true },
      ],
      nodes: [
        { id: "pc1", x: 36, y: 136, label: "PC", icon: "pc" },
        { id: "pc2", x: 36, y: 186, label: "PC", icon: "pc" },
        { id: "sw", x: 112, y: 161, label: "L2SW", icon: "l2sw" },
        { id: "l3", x: 185, y: 161, label: "L3SW", icon: "l3sw", hi: true },
        { id: "fw", x: 185, y: 78, label: "FW", icon: "fw", hi: true },
        { id: "net", x: 185, y: 24, label: "インターネット", icon: "internet" },
        { id: "web", x: 272, y: 136, label: "Webサーバ", icon: "server" },
        { id: "dns", x: 272, y: 186, label: "DNSサーバ", icon: "server" },
      ],
      links: [
        { from: "pc1", to: "sw" },
        { from: "pc2", to: "sw" },
        { from: "sw", to: "l3", label: "トランク" },
        { from: "l3", to: "fw" },
        { from: "fw", to: "net", label: "NAPT" },
        { from: "fw", to: "web" },
        { from: "fw", to: "dns" },
      ],
      caption: "凡例: L2SW=レイヤ2スイッチ、L3SW=レイヤ3スイッチ、FW=ファイアウォール",
    },
  },
  {
    title: "構成図(topo) — 無線と音声",
    note: "AP・IP電話のアイコンもある。章に応じて機器を替える",
    fig: {
      kind: "topo",
      height: 166,
      nodes: [
        { id: "pc", x: 36, y: 42, label: "PC", icon: "pc" },
        { id: "ap", x: 36, y: 116, label: "AP", icon: "ap", hi: true },
        { id: "sw", x: 124, y: 79, label: "L2SW", icon: "l2sw" },
        { id: "pbx", x: 212, y: 42, label: "IP-PBX", icon: "server" },
        { id: "ipt", x: 212, y: 122, label: "IP電話機", icon: "phone" },
        { id: "wan", x: 296, y: 79, label: "広域イーサ網", icon: "cloud" },
      ],
      links: [
        { from: "pc", to: "sw" },
        { from: "ap", to: "sw", label: "PoE" },
        { from: "sw", to: "pbx" },
        { from: "sw", to: "ipt" },
        { from: "sw", to: "wan", label: "1Gbps", double: true },
      ],
    },
  },
];

function App() {
  const only = new URLSearchParams(location.search).get("only");
  const list = only ? SAMPLES.filter((_, i) => String(i) === only) : SAMPLES;
  return (
    <div style={{ minHeight: "100vh", background: T.paper, padding: "28px 20px 60px" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: T.sub }}>FIGURE SAMPLES</div>
        <h1 style={{ fontFamily: SANS, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: T.ink, margin: "6px 0 24px" }}>
          解説向けの図(サンプル)
        </h1>
        {list.map((s, i) => (
          <div key={i} style={{ marginBottom: 30 }}>
            <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 700, color: T.ink }}>{s.title}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: T.sub, lineHeight: 1.7, margin: "3px 0 8px" }}>{s.note}</div>
            <Fig fig={s.fig} />
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
