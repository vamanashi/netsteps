import type { ReactNode } from "react";
import { T, MONO, SANS } from "../design/tokens";
import type { FigRef, FigSpec } from "../engine/types";
import { FigEncap, FigBits, FigHeader, FigConsole, FigTopo } from "./figuresAdvanced";

/* 図版レジストリ — 解説・問題のいたる所に置く小さなSVG図。
   patterns. のトーン(モノクロ+緑は成功時のみ)で統一する。 */

function Svg({ vb, h, children }: { vb: string; h?: number; children: ReactNode }) {
  return (
    <svg viewBox={vb} style={{ display: "block", width: "100%", height: h ?? "auto" }}>
      <defs>
        <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill={T.ink} />
        </marker>
        <marker id="ahs" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill={T.faint} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

const mono = (size: number) => ({ fontFamily: MONO, fontSize: size });
const sans = (size: number, w = 600) => ({ fontFamily: SANS, fontSize: size, fontWeight: w });

function Bx({ x, y, w, h, label, sub, active, dashed }: { x: number; y: number; w: number; h: number; label: string; sub?: string; active?: boolean; dashed?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} fill={active ? "#FBFBFA" : "#FFFFFF"} stroke={active ? T.ink : T.line} strokeWidth={1.4} strokeDasharray={dashed ? "4 3" : undefined} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -2 : 3.5)} textAnchor="middle" style={mono(10)} fontWeight={600} fill={active ? T.ink : T.sub}>{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" style={mono(7)} fill={T.faint}>{sub}</text>}
    </g>
  );
}

function Ln({ x1, y1, x2, y2, c = T.line, w = 1.4, dash, arrow, arrowFaint }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; dash?: string; arrow?: boolean; arrowFaint?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeDasharray={dash} markerEnd={arrow ? "url(#ah)" : arrowFaint ? "url(#ahs)" : undefined} />;
}

function Cap({ x, y, children, c = T.sub, size = 9, anchor = "middle" as const }: { x: number; y: number; children: ReactNode; c?: string; size?: number; anchor?: "middle" | "start" | "end" }) {
  return <text x={x} y={y} textAnchor={anchor} style={mono(size)} fill={c}>{children}</text>;
}

/* ---------- 個々の図 ---------- */

const FigRouteTable = () => (
  <Svg vb="0 0 340 130">
    <Bx x={10} y={50} w={62} h={26} label="パケット" sub="宛先 10.2.0.5" active />
    <Ln x1={72} y1={63} x2={102} y2={63} c={T.ink} arrow />
    {/* ルータと経路表 */}
    <rect x={106} y={14} width={150} height={102} rx={10} fill="#fff" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={181} y={28} c={T.ink} size={9.5}>ルータの経路表</Cap>
    <Ln x1={116} y1={34} x2={246} y2={34} />
    <Cap x={122} y={47} anchor="start" c={T.faint} size={8}>宛先ネットワーク → 次へ</Cap>
    <Cap x={122} y={63} anchor="start" c={T.sub} size={8.5}>10.1.0.0/16 → 直結</Cap>
    <rect x={116} y={70} width={130} height={14} rx={4} fill="#FBFBFA" stroke={T.ink} strokeWidth={1} />
    <Cap x={122} y={80} anchor="start" c={T.ink} size={8.5}>10.2.0.0/16 → R2 ✓</Cap>
    <Cap x={122} y={97} anchor="start" c={T.sub} size={8.5}>0.0.0.0/0 → R9</Cap>
    <Ln x1={256} y1={63} x2={286} y2={63} c={T.ink} arrow />
    <Bx x={288} y={50} w={42} h={26} label="R2" sub="へ渡す" />
    <Cap x={170} y={126} c={T.faint} size={8}>表を上から照合し、当たった行のネクストホップへ渡す</Cap>
  </Svg>
);

const FigNextHop = () => (
  <Svg vb="0 0 340 84">
    <Bx x={6} y={26} w={40} h={24} label="PC" />
    <Bx x={76} y={26} w={44} h={24} label="R1" active />
    <Bx x={150} y={26} w={44} h={24} label="R2" active />
    <Bx x={224} y={26} w={44} h={24} label="R3" active />
    <Bx x={296} y={26} w={40} h={24} label="サーバ" />
    <Ln x1={46} y1={38} x2={74} y2={38} c={T.ink} arrow />
    <Ln x1={120} y1={38} x2={148} y2={38} c={T.ink} arrow />
    <Ln x1={194} y1={38} x2={222} y2={38} c={T.ink} arrow />
    <Ln x1={268} y1={38} x2={294} y2={38} c={T.ink} arrow />
    <Cap x={134} y={18} size={8}>1ホップ</Cap>
    <Cap x={208} y={18} size={8}>1ホップ</Cap>
    <Cap x={170} y={72} c={T.faint} size={8}>各ルータは「次の1跳び先(ネクストホップ)」に渡すだけ。リレーの連続で届く</Cap>
  </Svg>
);

const FigDefaultRoute = () => (
  <Svg vb="0 0 340 108">
    <rect x={14} y={12} width={160} height={84} rx={10} fill="#fff" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={94} y={26} c={T.ink} size={9.5}>経路表</Cap>
    <Ln x1={24} y1={32} x2={164} y2={32} />
    <Cap x={30} y={46} anchor="start" c={T.sub} size={8.5}>10.1.0.0/16 → R2</Cap>
    <Cap x={30} y={60} anchor="start" c={T.sub} size={8.5}>10.2.0.0/16 → R3</Cap>
    <rect x={24} y={67} width={140} height={15} rx={4} fill="#FBFBFA" stroke={T.ink} strokeWidth={1} />
    <Cap x={30} y={78} anchor="start" c={T.ink} size={8.5}>0.0.0.0/0 → R9 (その他全部)</Cap>
    <Ln x1={174} y1={74} x2={230} y2={74} c={T.ink} arrow />
    <ellipse cx={276} cy={74} rx={52} ry={24} fill="#fff" stroke={T.line} strokeWidth={1.4} />
    <Cap x={276} y={71} c={T.sub} size={9}>インター</Cap>
    <Cap x={276} y={82} c={T.sub} size={9}>ネット</Cap>
    <Cap x={170} y={104} c={T.faint} size={8}>どの行にも当たらない宛先は、デフォルトルートの出口へ</Cap>
  </Svg>
);

const FigStaticDynamic = () => (
  <Svg vb="0 0 340 110">
    <rect x={8} y={8} width={156} height={82} rx={10} fill="none" stroke={T.line} />
    <Cap x={86} y={22} c={T.ink} size={9}>スタティック(静的)</Cap>
    <circle cx={40} cy={48} r={8} fill="none" stroke={T.sub} strokeWidth={1.4} />
    <path d="M32 70 q8 -12 16 0" fill="none" stroke={T.sub} strokeWidth={1.4} />
    <Cap x={40} y={84} size={7.5}>管理者</Cap>
    <Ln x1={56} y1={56} x2={92} y2={56} c={T.ink} arrow />
    <Cap x={74} y={50} size={7.5}>手で設定</Cap>
    <Bx x={96} y={42} w={52} h={26} label="ルータ" />
    <rect x={176} y={8} width={156} height={82} rx={10} fill="none" stroke={T.line} />
    <Cap x={254} y={22} c={T.ink} size={9}>ダイナミック(動的)</Cap>
    <Bx x={188} y={42} w={52} h={26} label="ルータ" active />
    <Bx x={268} y={42} w={52} h={26} label="ルータ" active />
    <Ln x1={240} y1={49} x2={266} y2={49} c={T.ink} arrow />
    <Ln x1={266} y1={61} x2={240} y2={61} c={T.ink} arrow />
    <Cap x={254} y={84} size={7.5}>経路を自動で教え合う</Cap>
    <Cap x={170} y={106} c={T.faint} size={8}>手書きは確実だが変化に弱い。教え合いは障害時も自動で追従する</Cap>
  </Svg>
);

const FigRipCount = () => (
  <Svg vb="0 0 340 96">
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <Bx x={10 + i * 62} y={30} w={34} h={22} label={`R${i + 1}`} />
        {i < 3 && <Ln x1={44 + i * 62} y1={41} x2={70 + i * 62} y2={41} c={T.sub} arrow={false} />}
        <Cap x={57 + i * 62} y={36} size={7.5}>{i + 1}</Cap>
      </g>
    ))}
    <Cap x={264} y={45} c={T.faint} size={11}>…</Cap>
    <Bx x={282} y={30} w={34} h={22} label="R16" />
    <Cap x={276} y={36} size={7.5}>15</Cap>
    <line x1={292} y1={26} x2={306} y2={56} stroke={T.ng} strokeWidth={1.6} />
    <line x1={306} y1={26} x2={292} y2={56} stroke={T.ng} strokeWidth={1.6} />
    <Cap x={170} y={74} c={T.sub} size={8.5}>RIPの距離=ホップ数(経由ルータ台数)。15が有効な上限</Cap>
    <Cap x={170} y={88} c={T.faint} size={8}>16は「無限大=到達不能」の印。経路情報が回り続ける事故を止めるための仕様</Cap>
  </Svg>
);

const FigDvVsLs = () => (
  <Svg vb="0 0 340 120">
    <rect x={8} y={8} width={156} height={92} rx={10} fill="none" stroke={T.line} />
    <Cap x={86} y={22} c={T.ink} size={9}>ディスタンスベクタ型</Cap>
    <Bx x={16} y={38} w={38} h={22} label="R1" />
    <Bx x={68} y={38} w={38} h={22} label="R2" />
    <Bx x={120} y={38} w={38} h={22} label="R3" />
    <Ln x1={54} y1={49} x2={66} y2={49} c={T.sub} arrowFaint />
    <Ln x1={106} y1={49} x2={118} y2={49} c={T.sub} arrowFaint />
    <Cap x={86} y={76} size={7.5}>「宛先Xまで距離2」と伝聞で伝える</Cap>
    <Cap x={86} y={90} c={T.faint} size={7.5}>各自は全体像を知らない(RIPなど)</Cap>
    <rect x={176} y={8} width={156} height={92} rx={10} fill="none" stroke={T.line} />
    <Cap x={254} y={22} c={T.ink} size={9}>リンクステート型</Cap>
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <Bx x={184 + i * 50} y={34} w={40} h={20} label={`R${i + 1}`} active />
        <rect x={192 + i * 50} y={58} width={24} height={18} rx={3} fill="#fff" stroke={T.ink} strokeWidth={1} />
        <Ln x1={196 + i * 50} y1={63} x2={212 + i * 50} y2={63} c={T.line} w={1} />
        <Ln x1={196 + i * 50} y1={67} x2={212 + i * 50} y2={67} c={T.line} w={1} />
        <Ln x1={196 + i * 50} y1={71} x2={208 + i * 50} y2={71} c={T.line} w={1} />
      </g>
    ))}
    <Cap x={254} y={90} size={7.5}>全員が同じ地図を持ち、各自で計算(OSPF)</Cap>
    <Cap x={170} y={114} c={T.faint} size={8}>伝聞に頼るか、一次情報で地図を作るか——ここが2方式の分かれ目</Cap>
  </Svg>
);

const STEPS5 = [
  { t: "① Hello", d: "あいさつを配り、隣のルータを見つける" },
  { t: "② ネイバー確立", d: "経路情報を交換する相手として認め合う" },
  { t: "③ LSA交換", d: "自分の回線情報を作り、フラッディングで全員へ" },
  { t: "④ LSDB完成", d: "集めたLSAで、全員が同じデータベースを持つ" },
  { t: "⑤ SPF計算", d: "ダイクストラ法で最短経路を各自計算" },
  { t: "⑥ 経路表完成", d: "収束。パケットを転送できる状態に" },
];
const FigOspfSteps = () => (
  <Svg vb="0 0 340 214">
    {STEPS5.map((s, i) => (
      <g key={i}>
        <rect x={14} y={8 + i * 34} width={110} height={26} rx={7} fill={i === 5 ? "#FBFBFA" : "#fff"} stroke={i === 5 ? T.ink : T.line} strokeWidth={1.4} />
        <text x={69} y={8 + i * 34 + 17} textAnchor="middle" style={mono(9.5)} fontWeight={600} fill={T.ink}>{s.t}</text>
        <text x={134} y={8 + i * 34 + 17} style={sans(9, 500)} fill={T.sub}>{s.d}</text>
        {i < 5 && <Ln x1={69} y1={34 + i * 34} x2={69} y2={41 + i * 34} c={T.ink} arrow />}
      </g>
    ))}
  </Svg>
);

const FigLsaFlood = () => (
  <Svg vb="0 0 340 130">
    <Bx x={148} y={10} w={44} h={24} label="R1" active />
    <Bx x={40} y={80} w={44} h={24} label="R2" />
    <Bx x={148} y={92} w={44} h={24} label="R3" />
    <Bx x={256} y={80} w={44} h={24} label="R4" />
    <Ln x1={152} y1={34} x2={78} y2={80} c={T.ink} arrow />
    <Ln x1={170} y1={34} x2={170} y2={90} c={T.ink} arrow />
    <Ln x1={188} y1={34} x2={262} y2={80} c={T.ink} arrow />
    <Ln x1={84} y1={97} x2={146} y2={101} c={T.sub} dash="4 3" arrowFaint />
    <Ln x1={194} y1={101} x2={254} y2={97} c={T.sub} dash="4 3" arrowFaint />
    <Cap x={110} y={52} size={8}>LSA</Cap>
    <Cap x={234} y={52} size={8}>LSA</Cap>
    <Cap x={170} y={126} c={T.faint} size={8}>実線: R1の広告 / 破線: 受け取ったルータがさらに隣へ転送(フラッディング)</Cap>
  </Svg>
);

const FigCostFormula = () => (
  <Svg vb="0 0 340 118">
    <rect x={30} y={10} width={280} height={26} rx={8} fill="#FBFBFA" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={170} y={27} c={T.ink} size={10}>コスト = 基準帯域 100Mbps ÷ 回線の帯域</Cap>
    {[
      ["10Mbps", "100÷10", "= 10"],
      ["100Mbps", "100÷100", "= 1"],
      ["1Gbps", "100÷1000", "= 0.1 → 1"],
    ].map((r, i) => (
      <g key={i}>
        <rect x={30 + i * 96} y={48} width={88} height={40} rx={7} fill="#fff" stroke={T.line} strokeWidth={1.4} />
        <Cap x={74 + i * 96} y={62} c={T.ink} size={9}>{r[0]}</Cap>
        <Cap x={74 + i * 96} y={76} c={T.sub} size={8}>{r[1]} {r[2]}</Cap>
      </g>
    ))}
    <Cap x={170} y={102} c={T.sub} size={8.5}>速い回線ほど小さい=選ばれやすい。1未満は1に切り上げ</Cap>
    <Cap x={170} y={114} c={T.faint} size={8}>基準帯域: 計算の分子となる値。既定は100Mbpsで、機器の設定で変更できる</Cap>
  </Svg>
);

const FigCostPath = () => (
  <Svg vb="0 0 340 120">
    <Bx x={14} y={48} w={44} h={24} label="R1" active />
    <Bx x={148} y={10} w={44} h={24} label="R2" active />
    <Bx x={282} y={48} w={44} h={24} label="R4" active />
    <Ln x1={58} y1={54} x2={146} y2={26} c={T.ink} w={1.6} />
    <Ln x1={192} y1={26} x2={280} y2={54} c={T.ink} w={1.6} arrow />
    <Ln x1={58} y1={66} x2={280} y2={66} c={T.faint} w={1.4} dash="5 4" />
    <Cap x={100} y={30} size={8}>cost 10</Cap>
    <Cap x={238} y={30} size={8}>cost 10</Cap>
    <Cap x={170} y={80} c={T.faint} size={8}>cost 100 (直通)</Cap>
    <Cap x={170} y={100} c={T.ok} size={8.5}>選ばれるのは上: 合計 10+10=20 &lt; 100</Cap>
    <Cap x={170} y={114} c={T.faint} size={8}>台数ではなく、通過コストの合計で比べる</Cap>
  </Svg>
);

const FigArea = () => (
  <Svg vb="0 0 340 150">
    <rect x={110} y={14} width={120} height={72} rx={14} fill="#FBFBFA" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={170} y={30} c={T.ink} size={9}>エリア0(バックボーン)</Cap>
    <Cap x={170} y={42} c={T.faint} size={7.5}>エリアID: 0.0.0.0</Cap>
    <rect x={8} y={64} width={100} height={64} rx={14} fill="#fff" stroke={T.line} strokeWidth={1.4} />
    <Cap x={58} y={80} c={T.sub} size={9}>エリア1</Cap>
    <Cap x={58} y={92} c={T.faint} size={7.5}>エリアID: 0.0.0.1</Cap>
    <rect x={232} y={64} width={100} height={64} rx={14} fill="#fff" stroke={T.line} strokeWidth={1.4} />
    <Cap x={282} y={80} c={T.sub} size={9}>エリア2</Cap>
    <Cap x={282} y={92} c={T.faint} size={7.5}>エリアID: 0.0.0.2</Cap>
    <Bx x={86} y={96} w={44} h={22} label="ABR" active />
    <Bx x={210} y={96} w={44} h={22} label="ABR" active />
    <Cap x={170} y={144} c={T.faint} size={8}>詳細な地図はエリア内だけ。境界のABRが要約を渡す。全エリアはエリア0に接続</Cap>
  </Svg>
);

const FigDrLan = () => (
  <Svg vb="0 0 340 132">
    <rect x={8} y={8} width={156} height={104} rx={10} fill="none" stroke={T.line} />
    <Cap x={86} y={22} c={T.ink} size={9}>DRなし: 全員どうし</Cap>
    {[[30, 40], [116, 40], [30, 88], [116, 88]].map(([x, y], i) => <Bx key={i} x={x} y={y - 10} w={30} h={20} label={`R${i + 1}`} />)}
    <Ln x1={60} y1={40} x2={116} y2={40} c={T.sub} w={1} />
    <Ln x1={60} y1={88} x2={116} y2={88} c={T.sub} w={1} />
    <Ln x1={45} y1={50} x2={45} y2={78} c={T.sub} w={1} />
    <Ln x1={131} y1={50} x2={131} y2={78} c={T.sub} w={1} />
    <Ln x1={60} y1={48} x2={116} y2={82} c={T.sub} w={1} />
    <Ln x1={116} y1={48} x2={60} y2={82} c={T.sub} w={1} />
    <Cap x={86} y={108} size={7.5}>組合せは n(n-1)/2 で爆発</Cap>
    <rect x={176} y={8} width={156} height={104} rx={10} fill="none" stroke={T.line} />
    <Cap x={254} y={22} c={T.ink} size={9}>DRあり: 代表に集約</Cap>
    <Bx x={239} y={34} w={32} h={20} label="DR" active />
    <Bx x={283} y={34} w={36} h={20} label="BDR" />
    {[[192, 88], [240, 88], [288, 88]].map(([x, y], i) => <Bx key={i} x={x} y={y - 10} w={30} h={20} label={`R${i + 3}`} />)}
    <Ln x1={207} y1={78} x2={250} y2={56} c={T.ink} w={1.2} />
    <Ln x1={255} y1={78} x2={255} y2={56} c={T.ink} w={1.2} />
    <Ln x1={303} y1={78} x2={260} y2={56} c={T.ink} w={1.2} />
    <Cap x={254} y={108} size={7.5}>みんなはDRとだけ交換</Cap>
    <Cap x={170} y={128} c={T.faint} size={8}>同じLANに多数のルータがいるときだけ登場する仕組み。DR障害時はBDRが昇格</Cap>
  </Svg>
);

const FigPassive = () => (
  <Svg vb="0 0 340 104">
    <Bx x={20} y={34} w={56} h={26} label="隣のルータ" />
    <Bx x={148} y={34} w={52} h={26} label="ルータ" active />
    <Bx x={262} y={22} w={40} h={20} label="PC" />
    <Bx x={262} y={54} w={40} h={20} label="PC" />
    <Ln x1={76} y1={43} x2={146} y2={43} c={T.ink} arrow />
    <Ln x1={146} y1={53} x2={76} y2={53} c={T.ink} arrow />
    <Cap x={111} y={32} size={7.5}>Hello ⇄ 経路交換</Cap>
    <Ln x1={200} y1={40} x2={260} y2={32} c={T.line} />
    <Ln x1={200} y1={54} x2={260} y2={62} c={T.line} />
    <Cap x={228} y={78} c={T.sub} size={8}>パッシブIF: Helloを出さない</Cap>
    <Cap x={170} y={98} c={T.faint} size={8}>PCしかいない側であいさつしても無駄+不正参加の入口になる。だから止める</Cap>
  </Svg>
);

const FigRedistribute = () => (
  <Svg vb="0 0 340 104">
    <ellipse cx={70} cy={46} rx={58} ry={32} fill="#fff" stroke={T.line} strokeWidth={1.4} />
    <Cap x={70} y={43} c={T.sub} size={9.5}>OSPFの世界</Cap>
    <Cap x={70} y={56} c={T.faint} size={7.5}>社内の経路</Cap>
    <ellipse cx={270} cy={46} rx={58} ry={32} fill="#fff" stroke={T.line} strokeWidth={1.4} />
    <Cap x={270} y={43} c={T.sub} size={9.5}>BGPの世界</Cap>
    <Cap x={270} y={56} c={T.faint} size={7.5}>外部との経路</Cap>
    <Bx x={144} y={32} w={52} h={28} label="ルータ" active />
    <Ln x1={196} y1={40} x2={230} y2={40} c={T.ink} arrow />
    <Ln x1={144} y1={52} x2={110} y2={52} c={T.ink} arrow />
    <Cap x={170} y={24} size={8}>再配布: 経路を翻訳して流し込む</Cap>
    <Cap x={170} y={98} c={T.faint} size={8}>双方向の再配布はループの危険。フィルタリングとセットで設計する</Cap>
  </Svg>
);

const FigAsIgpEgp = () => (
  <Svg vb="0 0 340 118">
    <rect x={10} y={16} width={140} height={76} rx={16} fill="#fff" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={80} y={34} c={T.ink} size={9.5}>AS 65001 (A社)</Cap>
    <Cap x={80} y={52} c={T.sub} size={8.5}>内側の経路制御 = IGP</Cap>
    <Cap x={80} y={66} c={T.sub} size={8.5}>OSPF / RIP</Cap>
    <rect x={190} y={16} width={140} height={76} rx={16} fill="#fff" stroke={T.ink} strokeWidth={1.4} />
    <Cap x={260} y={34} c={T.ink} size={9.5}>AS 65002 (ISP)</Cap>
    <Cap x={260} y={52} c={T.sub} size={8.5}>内側の経路制御 = IGP</Cap>
    <Cap x={260} y={66} c={T.sub} size={8.5}>OSPF / RIP</Cap>
    <Ln x1={150} y1={78} x2={188} y2={78} c={T.ink} w={1.6} arrow />
    <Ln x1={188} y1={86} x2={150} y2={86} c={T.ink} w={1.6} arrow />
    <Cap x={169} y={72} size={8}>EGP: BGP</Cap>
    <Cap x={170} y={112} c={T.faint} size={8}>AS=1つの管理方針で運用されるネットワークのまとまり。内はIGP、間はEGP</Cap>
  </Svg>
);

const REGISTRY: Record<string, () => ReactNode> = {
  "route-table": FigRouteTable,
  "next-hop": FigNextHop,
  "default-route": FigDefaultRoute,
  "static-dynamic": FigStaticDynamic,
  "rip-count": FigRipCount,
  "dv-vs-ls": FigDvVsLs,
  "ospf-steps": FigOspfSteps,
  "lsa-flood": FigLsaFlood,
  "cost-formula": FigCostFormula,
  "cost-path": FigCostPath,
  "area": FigArea,
  "dr-lan": FigDrLan,
  "passive-if": FigPassive,
  "redistribute": FigRedistribute,
  "as-igp-egp": FigAsIgpEgp,
};

/* ---------- JSONコンテンツから定義できる汎用図 ---------- */

function wrapFigureLabel(text: string, limit: number) {
  const lines: string[] = [];
  let line = "", width = 0;
  for (const character of text) {
    const size = character.charCodeAt(0) > 255 ? 1 : 0.6;
    if (character === "\n" || width + size > limit) {
      lines.push(line);
      line = ""; width = 0;
      if (character === "\n") continue;
    }
    line += character; width += size;
  }
  if (line) lines.push(line);
  return lines;
}

function SpecFlow({ spec }: { spec: Extract<FigSpec, { kind: "flow" }> }) {
  let offset = 8;
  const rows = spec.steps.map(step => {
    const title = wrapFigureLabel(step.t, 11);
    const description = wrapFigureLabel(step.d ?? "", 20);
    const height = Math.max(26, Math.max(title.length, description.length) * 13 + 10);
    const row = { title, description, top: offset, height };
    offset += height + 8;
    return row;
  });
  const caption = wrapFigureLabel(spec.caption ?? "", 38);
  const H = offset + caption.length * 12;
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {rows.map((row, i) => (
        <g key={i}>
          <rect x={14} y={row.top} width={116} height={row.height} rx={7} fill={i === rows.length - 1 ? "#FBFBFA" : "#fff"} stroke={i === rows.length - 1 ? T.ink : T.line} strokeWidth={1.4} />
          <text textAnchor="middle" style={mono(9)} fontWeight={600} fill={T.ink}>{row.title.map((line, index) => <tspan key={index} x={72} y={row.top + row.height / 2 + 3 - (row.title.length - 1) * 6.5 + index * 13}>{line}</tspan>)}</text>
          <text style={sans(9, 500)} fill={T.sub}>{row.description.map((line, index) => <tspan key={index} x={140} y={row.top + row.height / 2 + 3 - (row.description.length - 1) * 6.5 + index * 13}>{line}</tspan>)}</text>
          {i < rows.length - 1 && <Ln x1={72} y1={row.top + row.height} x2={72} y2={row.top + row.height + 7} c={T.ink} arrow />}
        </g>
      ))}
      {caption.map((line, index) => <Cap key={index} x={170} y={offset + index * 12 + 7} c={T.faint} size={8}>{line}</Cap>)}
    </Svg>
  );
}

function SpecNet({ spec }: { spec: Extract<FigSpec, { kind: "net" }> }) {
  const H = spec.height ?? 140;
  const byId = Object.fromEntries(spec.nodes.map((nd) => [nd.id, nd]));
  const NW2 = 56, NH2 = 26;
  return (
    <Svg vb={`0 0 340 ${H}`}>
      {spec.links.map((l, i) => {
        const a = byId[l.from], b = byId[l.to];
        if (!a || !b) return null;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len, uy = dy / len;
        const x1 = a.x + ux * (NW2 / 2 - 4), y1 = a.y + uy * (NH2 / 2 + 4);
        const x2 = b.x - ux * (NW2 / 2 - 4), y2 = b.y - uy * (NH2 / 2 + 4);
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
        return (
          <g key={i}>
            {l.double ? (
              <>
                <Ln x1={x1} y1={y1 - 2.5} x2={x2} y2={y2 - 2.5} c={T.ink} arrow={l.arrow} />
                <Ln x1={x1} y1={y1 + 2.5} x2={x2} y2={y2 + 2.5} c={T.ink} />
              </>
            ) : (
              <Ln x1={x1} y1={y1} x2={x2} y2={y2} c={l.dash ? T.sub : T.ink} dash={l.dash ? "5 4" : undefined} arrow={l.arrow} />
            )}
            {l.label && <Cap x={midX} y={midY - 6} size={8}>{l.label}</Cap>}
          </g>
        );
      })}
      {spec.nodes.map((nd) => <Bx key={nd.id} x={nd.x - NW2 / 2} y={nd.y - NH2 / 2} w={NW2} h={NH2} label={nd.label} sub={nd.sub} active={nd.active} dashed={nd.dashed} />)}
      {spec.caption && <Cap x={170} y={H - 6} c={T.faint} size={8}>{spec.caption}</Cap>}
    </Svg>
  );
}

function SpecTable({ spec }: { spec: Extract<FigSpec, { kind: "table" }> }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
        <thead>
          <tr>{spec.head.map((h, i) => <th key={i} style={{ textAlign: "left", fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: T.sub, padding: "6px 8px", borderBottom: `1px solid ${T.ink}` }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {spec.rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: "7px 8px", borderBottom: `1px solid ${T.line}`, color: j === 0 ? T.ink : T.sub, fontWeight: j === 0 ? 600 : 400, lineHeight: 1.6 }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {spec.caption && <div style={{ fontFamily: MONO, fontSize: 8.5, color: T.faint, marginTop: 6, textAlign: "center" }}>{spec.caption}</div>}
    </div>
  );
}

export function Fig({ fig }: { fig: FigRef }) {
  let inner: ReactNode = null;
  if (typeof fig === "string") {
    const F = REGISTRY[fig];
    if (!F) return null;
    inner = F();
  } else if (fig.kind === "flow") inner = <SpecFlow spec={fig} />;
  else if (fig.kind === "net") inner = <SpecNet spec={fig} />;
  else if (fig.kind === "table") inner = <SpecTable spec={fig} />;
  else if (fig.kind === "encap") inner = <FigEncap spec={fig} />;
  else if (fig.kind === "bits") inner = <FigBits spec={fig} />;
  else if (fig.kind === "header") inner = <FigHeader spec={fig} />;
  else if (fig.kind === "console") inner = <FigConsole spec={fig} />;
  else if (fig.kind === "topo") inner = <FigTopo spec={fig} />;
  if (!inner) return null;
  return (
    <div className="riseIn" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 8px 6px", margin: "0 0 14px" }}>
      {inner}
    </div>
  );
}

export const FIG_IDS = Object.keys(REGISTRY);

export function Figs({ fig }: { fig?: FigRef | FigRef[] }) {
  if (!fig) return null;
  const ids = Array.isArray(fig) ? fig : [fig];
  return <>{ids.map((f, i) => <Fig key={i} fig={f} />)}</>;
}
