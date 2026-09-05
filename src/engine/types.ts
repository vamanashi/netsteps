/* 問題(ステップ)データのスキーマ — 引き継ぎ §4 */

export interface Choice {
  text: string;
  ok?: boolean;
  explain?: string;
}

interface StepBase {
  id: string;
  originalExcerpt?: { page: number; top: number; bottom: number; label: string };
  stage?: "concept" | "check" | "apply" | "reason" | "assemble" | "transfer";
  section?: { id: string; title: string; index: number; total: number; targets: string[] };
  /** 足場量 5→0 */
  scaffold: number;
  /** 表示ラベル(選択/読む/動かす/読解/並べ替え/穴埋め/計算/記述) */
  format: string;
  /** チップ表示 */
  theme: string;
  /** 実試験の設問番号("設問1(1)" など) */
  goalTag?: string;
  showCase?: boolean;
  showExam?: boolean;
  /** 事例文の抜粋(全文を読ませずに、必要な部分だけ切り出して見せる) */
  excerpt?: { label?: string; lines: string[] };
  /** 図1(公式の構成図)を表示 */
  showFigure?: boolean;
  /** 本物の過去問(公式ページ画像)を表示 */
  showOfficial?: boolean;
  /** 図版。レジストリID(string) または JSONで定義する汎用図(FigSpec)。
      infoでは配列だと段落の間に交互に挿入される */
  fig?: FigRef | FigRef[];
  /** IPA過去問の出典。指定すると「本試験の過去問」デザインで表示される */
  source?: { label: string; url?: string };
}

export type FigRef = string | FigSpec;

/** JSONコンテンツから定義できる汎用図 */
export type FigSpec =
  | {
      kind: "flow";
      /** 縦方向のステップフロー */
      steps: { t: string; d?: string }[];
      caption?: string;
    }
  | {
      kind: "net";
      /** ネットワーク図: 座標は viewBox 0 0 340 H (H=height, 既定140) */
      height?: number;
      nodes: { id: string; x: number; y: number; label: string; sub?: string; active?: boolean; dashed?: boolean }[];
      links: { from: string; to: string; label?: string; dash?: boolean; double?: boolean; arrow?: boolean }[];
      caption?: string;
    }
  | {
      kind: "table";
      /** 小さな比較表 */
      head: string[];
      rows: string[][];
      caption?: string;
    }
  /* ---- 以下、解説向けの図(ネスペの基礎力のような図解) ---- */
  | {
      kind: "encap";
      /** カプセル化の入れ子図。上の層から順に、下の層で包まれていく */
      layers: {
        label: string;
        parts: { t: string; w: number; role?: "header" | "data" | "trailer" }[];
      }[];
      caption?: string;
    }
  | {
      kind: "bits";
      /** 数値をビット/バイトに分解する図(255.255.255.255 → 8ビット → 1バイト) */
      cells: { top: string; steps: string[] }[];
      sep?: string;
      total?: string;
      note?: string;
      caption?: string;
    }
  | {
      kind: "header";
      /** プロトコルヘッダの構造図。1行=32ビット */
      rows: { fields: { t: string; bits: number; hi?: boolean }[] }[];
      unit?: number;
      caption?: string;
    }
  | {
      kind: "console";
      /** 実機のコマンド出力。指定行をハイライトする */
      lines: string[];
      highlight?: number[];
      caption?: string;
    }
  | {
      kind: "topo";
      /** 機器アイコン付きのネットワーク構成図 */
      height?: number;
      nodes: {
        id: string; x: number; y: number; label: string; sub?: string;
        icon: "pc" | "server" | "router" | "l2sw" | "l3sw" | "fw" | "cloud" | "internet" | "ap" | "phone";
        hi?: boolean;
      }[];
      links?: { from: string; to: string; label?: string; dash?: boolean; double?: boolean }[];
      zones?: { x: number; y: number; w: number; h: number; label: string; dashed?: boolean }[];
      caption?: string;
    };

export interface GoalStepT extends StepBase {
  type: "goal";
  title: string;
  lead: string;
}

export interface InfoStepT extends StepBase {
  type: "info";
  title: string;
  /** "\n\n" で段落 */
  body: string;
  /** 学習者の素朴な疑問と回答(吹き出し表示) */
  dialog?: { q: string; a: string }[];
}

export interface VizStepT extends StepBase {
  type: "viz";
  title: string;
  lead: string;
  nodes: string[];
  run1: { hl: number[]; log: string }[];
  run2: { hl: number[]; log: string }[];
  run2Label: string;
  cutLabel: string;
  goalNote: string;
}

export interface QuizStepT extends StepBase {
  type: "quiz";
  title: string;
  intro?: string;
  choices: Choice[];
}

export interface ParsonsStepT extends StepBase {
  type: "parsons";
  title: string;
  lead: string;
  lines: { code: string }[];
  shuffled: number[];
  okOrders: number[][];
  okExplain: string;
  ngExplain: string;
}

export interface BlankStepT extends StepBase {
  type: "blank";
  title: string;
  /** "...{a}...{b}..." */
  template: string;
  blanks: { key: string; label: string; choices: Choice[]; why: string }[];
}

export interface CalcStepT extends StepBase {
  type: "calc";
  title: string;
  given: string[];
  question: string;
  unit: string;
  answer: number;
  placeholder: string;
  success: string;
  fail: string;
}

export interface Kijutsu {
  title: string;
  lead: string;
  limit: number;
  model: string;
  alt: string;
  rubric: { label: string; pattern: string }[];
}

export interface WriteStepT extends StepBase {
  type: "write";
  title: string;
  kijutsu: Kijutsu;
  /** true なら合格でテーマ制覇(完了画面へ) */
  final?: boolean;
}

export interface OriginalStepT extends StepBase {
  type: "original";
  title: string;
  examKey: string;
  itemId: string;
}

export type Step =
  | GoalStepT
  | InfoStepT
  | VizStepT
  | QuizStepT
  | ParsonsStepT
  | BlankStepT
  | CalcStepT
  | WriteStepT
  | OriginalStepT;

/* エンジン状態 — 引き継ぎ §4/§5 */
export interface QueueEntry {
  poolIdx: number;
  again: boolean;
}
/** 提出済みの回答の記録(前後移動しても判定済み状態を保つ) */
export interface StepRecord {
  ok: boolean | null;
  submittedAt?: string;
  history?: { ok: boolean | null; data?: unknown; submittedAt: string }[];
  data?: unknown;
  /** 同じ問題の再出題を含む提出回数 */
  attempts?: number;
  /** 初回提出時の判定。再出題後の正解で上書きしない */
  firstTryOk?: boolean | null;
}
export interface EngineState {
  queue: QueueEntry[];
  cursor: number;
  answered: number;
  /** プール内の問題番号 → 回答記録。再出題でキュー位置が変わっても追跡できる */
  records?: Record<number, StepRecord>;
  legacyRecords?: Record<number, StepRecord>;
  byId?: Record<string, StepRecord>;
  drafts?: Record<string, unknown>;
  stepIds?: string[];
}

export interface Mistake {
  key: string;
  title: string;
  your: string;
  correct: string;
  explain: string;
  reviewed: boolean;
}

export const charCount = (s: string) => s.replace(/\s/g, "").length;

/* ゴール模擬問題(午後Ⅰ/Ⅱ形式) — 過去問コースが1つずつ持つ */
export type Seg = { t: string } | { blank: string } | { u: string; mark: string };

export interface ExamDef {
  /** アコーディオンの見出し(例: "goal · 模擬問題(午後Ⅰ形式)") */
  label: string;
  title: string;
  /** 事例文。段落 × セグメント。blankは空欄、uは下線部 */
  body: Seg[][];
  /** 表(更改手順など)。無い問題もある */
  procTitle?: string;
  procedure?: { no: string; segs: Seg[] }[];
  /** 構成図。公式PDFから抽出した画像か、JSONで定義した図 */
  figure?: { src: string; caption: string } | FigSpec;
  questions: string[];
  note: string;
  /** 本物の過去問。IPAは許諾・使用料不要で使用を認めている(出典明記が条件) */
  official?: {
    /** IPA指定の形式。例「出典：令和7年度 春期 ネットワークスペシャリスト試験 午後Ⅰ 問2」 */
    label: string;
    /** 問題冊子の該当ページ画像 */
    pages: string[];
    /** IPA公式のPDF */
    url: string;
    /** 解答例PDF */
    answerUrl?: string;
  };
}
