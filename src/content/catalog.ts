import data from "./originals.json";
import { UNITS, THEMES } from "./units";
import { WORKSHOPS } from "./workshops";
import type { ExamAttempt } from "../engine/storage";

export const ORIGINALS = data.map(exam => ({ ...exam, coverage: WORKSHOPS.some(workshop => workshop.examKey === exam.key) ? "individual" : exam.coverage }));
export type Original = typeof ORIGINALS[number];
export type OriginalItem = Original["items"][number];
export const themeName = (id: string) => THEMES.find(theme => theme.id === id)?.name ?? id;
export const courseFor = (exam: Original) => UNITS.find(unit => unit.id === exam.courseId);
export const basicsFor = (exam: Original) => UNITS.find(unit => unit.theme === exam.theme && unit.kind === "basics");
export function examProgress(exam: Original, attempts: ExamAttempt[] = []) {
  const attempt = attempts[attempts.length - 1];
  const answered = exam.items.filter(item => attempt?.answers[item.id]?.trim()).length;
  const judged = exam.items.filter(item => attempt?.answers[item.id]?.trim() && attempt.judgments[item.id]);
  const complete = attempts.some(entry => !!entry.submittedAt && exam.items.every(item => entry.answers[item.id]?.trim() && entry.judgments[item.id]));
  const correct = judged.filter(item => attempt.judgments[item.id] === "correct").length;
  const label = complete ? attempt?.submittedAt ? "全設問に解答済み" : "解答済み・再挑戦中" : judged.length ? "自己採点中" : answered ? "解答中" : "未解答";
  return { answered, judged: judged.length, correct, complete, label, total: exam.items.length, attempt };
}
