import type { ReadingState } from "../engine/storage";

export interface OriginalParagraph {
  text: string;
  pages: number[];
  underlines?: string[];
}

export type OriginalBlock = ({ type: "text" } & OriginalParagraph) | {
  type: "figure";
  page: number;
  top: number;
  bottom: number;
  caption: string;
};

export interface OriginalPassage {
  blocks: OriginalBlock[];
  context?: OriginalParagraph[];
}

export interface ReadingPart {
  id: string;
  title: string;
  lead: string;
  regions: { page: number; top: number; bottom: number }[];
  passage?: OriginalPassage;
  glossary?: { term: string; body: string }[];
  check: { prompt: string; choices: { text: string; ok: boolean; explain: string }[] };
}

export interface ReadingChapter {
  id: string;
  title: string;
  lead: string;
  targets: string[];
  parts: ReadingPart[];
}

export interface ReadingPlan {
  examKey: string;
  title: string;
  chapters: ReadingChapter[];
}

const modules = import.meta.glob("./readings/*.json", { eager: true }) as Record<string, { default: ReadingPlan }>;
const transcripts = import.meta.glob("./reading-transcripts/*.json", { eager: true }) as Record<string, { default: {
  examKey: string;
  parts?: Record<string, OriginalPassage>;
  questions?: Record<string, OriginalPassage>;
} }>;
const passagesFor = (examKey: string, kind: "parts" | "questions") => Object.assign({}, ...Object.values(transcripts).filter(module => module.default.examKey === examKey).map(module => module.default[kind])) as Record<string, OriginalPassage>;
export const questionPassageFor = (examKey: string, target: string) => passagesFor(examKey, "questions")[target];
export const READINGS = Object.values(modules).map(({ default: plan }) => {
  const passages = passagesFor(plan.examKey, "parts");
  return { ...plan, chapters: plan.chapters.map(chapter => ({ ...chapter, parts: chapter.parts.map(part => ({ ...part, passage: passages[part.id] })) })) };
});
export const readingFor = (examKey: string) => READINGS.find(plan => plan.examKey === examKey);
export function readingProgress(plan: ReadingPlan, state?: ReadingState) {
  const parts = plan.chapters.flatMap(chapter => chapter.parts);
  const answered = parts.filter(part => part.check.choices[state?.checks[part.id]?.choice ?? -1]);
  const correct = answered.filter(part => part.check.choices[state!.checks[part.id].choice].ok).length;
  return { total: parts.length, answered: answered.length, correct };
}
