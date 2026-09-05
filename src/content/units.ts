import type { ExamDef, Step } from "../engine/types";
import themesJson from "./themes.json";
import originals from "./originals.json";
import learningPaths from "./learning-paths.json";
import { WORKSHOPS, workshopSteps } from "./workshops";

export interface UnitDone {
  tag: string;
  title: string;
  sub: string;
  showCounter: boolean;
  pdfHref?: string;
}

export interface Unit {
  id: string;
  theme: string;
  chip: string;
  title: string;
  desc: string;
  /** basics: 基礎コース(プール完走で修了) / exam: 過去問コース(最終記述の合格で制覇) */
  kind: "basics" | "exam";
  order: number;
  pool: Step[];
  done: UnitDone;
  /** 過去問コースが持つゴール模擬問題 */
  exam?: ExamDef;
}

interface CourseJson {
  id: string;
  theme: string;
  chip: string;
  title: string;
  desc: string;
  kind: "basics" | "exam";
  order: number;
  done?: Partial<UnitDone>;
  steps: unknown[];
  exam?: ExamDef;
}

const doneDefaults = (c: CourseJson): UnitDone =>
  c.kind === "basics"
    ? {
        tag: "+ solved · コース修了",
        title: `${c.title.split("—")[0].trim()}、修了です`,
        sub: "このテーマの語彙が手に入りました。つぎのコースへ。",
        showCounter: false,
      }
    : {
        tag: "+ solved · 完答",
        title: "冒頭では解けなかった1問が、解けました",
        sub: "仕上げは、この章に対応する本試験の過去問です。ホームの一覧から公式PDFを開けます。",
        showCounter: true,
      };

/* コンテンツは src/content/courses/*.json で管理する(コードに直書きしない) */
const modules = import.meta.glob("./courses/*.json", { eager: true }) as Record<
  string,
  { default: CourseJson }
>;

const authoredUnits: Unit[] = Object.values(modules)
  .map((m) => m.default)
  .map((c) => ({
    id: c.id,
    theme: c.theme,
    chip: c.chip,
    title: c.title,
    desc: c.desc,
    kind: c.kind,
    order: c.order,
    pool: c.steps as Step[],
    done: { ...doneDefaults(c), ...(c.done ?? {}) },
    exam: c.exam,
  }))
  .sort((a, b) => a.order - b.order);

const linkedUnits: Unit[] = authoredUnits.map(unit => {
  const original = originals.find(exam => exam.courseId === unit.id);
  return original && unit.exam ? { ...unit, exam: { ...unit.exam, official: original.official } } : unit;
});

const sourceUnits: Unit[] = learningPaths.paths.filter(path => !WORKSHOPS.some(workshop => workshop.examKey === path.key)).map((path, index) => {
  const original = originals.find(exam => exam.key === path.key)!;
  const preparation: Step[] = path.foundation.flatMap(theme => {
    const base = authoredUnits.find(unit => unit.kind === "basics" && unit.theme === theme)!;
    return base.pool.map(step => ({ ...step, id: `prepare:${base.id}:${step.id}` }));
  });
  const originalSteps: Step[] = original.items.map(item => ({ id: `original:${item.id}`, type: "original", title: `${item.label}を原文で解く`, format: "原問の一部分", scaffold: 1, theme: original.theme, examKey: path.key, itemId: item.id }));
  const mid = Math.ceil(preparation.length * .55);
  const shared = { scaffold: 5, theme: original.theme };
  return {
    id: original.courseId!, theme: original.theme, chip: "基礎＋原問分割", title: original.title,
    desc: path.focus, kind: "exam", order: 1000 + index,
    pool: [
      { ...shared, id: "goal", type: "goal", format: "ゴール", ...learningPaths.intro },
      ...preparation.slice(0, mid),
      { ...shared, id: "bridge", type: "info", format: "読む", ...learningPaths.bridge, body: `${path.focus}\n\n${learningPaths.bridge.body}` },
      ...originalSteps.slice(0, 2),
      ...preparation.slice(mid),
      ...originalSteps.slice(2),
      { ...shared, id: "return", type: "info", format: "原問へ", ...learningPaths.finish }
    ],
    done: { tag: "練習の実施を記録", title: "最後は原問へ", sub: "原問の答案は別に記録します。", showCounter: false },
    exam: { label: original.title, title: original.title, body: [], questions: [], note: "公式の原文・原図を使用。基礎は共通教材を参照しています。", official: original.official }
  };
});

const workshopUnits: Unit[] = WORKSHOPS.map(workshop => {
  const original = originals.find(exam => exam.key === workshop.examKey)!;
  return {
    id: original.courseId, theme: original.theme, chip: "設問別ステップ学習", title: original.title,
    desc: workshop.title, kind: "exam", order: 1000 + originals.indexOf(original),
    pool: [
      { id: "workshop:goal", type: "goal", title: "最後に解く原問を眺める", lead: "いまは読む必要はありません。この問題に必要な知識と考え方を、一つずつ練習します。最後は補助を閉じて、自分で答案を組み立てます。", scaffold: 5, format: "ゴール", theme: original.theme },
      ...workshopSteps(workshop),
      { id: "workshop:finish", type: "info", title: "補助を閉じて原問へ", body: "練習で確かめたのは、条件の読み取り、判断の理由、答案の組み立てです。最後は原文・原図を見て、解答例を開く前に自分で考えます。\n\n分からない設問があれば、その設問につながる節へ戻れます。一度の正解を暗記の完成とはせず、時間を置いて条件から考え直してください。", scaffold: 0, format: "原問へ", theme: original.theme }
    ],
    done: { tag: "練習を記録", title: "最後は原問へ", sub: "原問の答案は別に記録します。", showCounter: false },
    exam: { label: original.title, title: original.title, body: [], questions: [], note: "原問の本文・図は公式PDFを使用しています。", official: original.official }
  };
});

export const UNITS: Unit[] = [...linkedUnits.filter(unit => !workshopUnits.some(workshop => workshop.id === unit.id)), ...sourceUnits, ...workshopUnits].sort((left, right) => left.order - right.order);

export const getUnit = (id: string): Unit => UNITS.find((u) => u.id === id) ?? UNITS[0];

export interface ThemeDef {
  id: string;
  name: string;
  order: number;
  /** この単元で学ぶこと(スラッシュ区切り) */
  learn?: string;
}
export const THEMES: ThemeDef[] = (themesJson.themes as ThemeDef[]).slice().sort((a, b) => a.order - b.order);
export const THEME_TOTAL = THEMES.length;
export const QUESTION_THEME_MAP: Record<string, string> = themesJson.map as Record<string, string>;
