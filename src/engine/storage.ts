import type { EngineState, Mistake } from "./types";
import { migrateEngine } from "./progress";
import type { Unit } from "../content/units";

const KEY = "netsteps-v3";
export interface ExamAttempt {
  answers: Record<string, string>;
  judgments: Record<string, "correct" | "partial" | "incorrect">;
  updatedAt: string;
  submittedAt?: string;
  assisted?: boolean;
}
export interface UnitState { engine: EngineState; solved: boolean }
export interface ReadingState {
  cursor: string;
  answerTarget?: string;
  checks: Record<string, { choice: number; order: number[]; firstCorrect: boolean }>;
}
export interface Persisted {
  version: 3;
  currentUnit: string;
  units: Record<string, UnitState>;
  mistakes: Mistake[];
  selfCheck: string | null;
  poolSizes: Record<string, number>;
  exams: Record<string, ExamAttempt[]>;
  readings?: Record<string, ReadingState>;
}

export function parseBackup(raw: string, units: Unit[]): Persisted {
  const data = JSON.parse(raw);
  if (![2, 3].includes(data.version) || !data.units || typeof data.units !== "object" || Array.isArray(data.units) || !Array.isArray(data.mistakes)) throw new Error("NetStepsのバックアップではありません。");
  for (const state of Object.values(data.units) as UnitState[]) {
    if (!state?.engine || !Array.isArray(state.engine.queue)) throw new Error("学習記録の形式が不正です。");
  }
  if (data.mistakes.some((item: Mistake) => !item || ![item.key, item.title, item.your, item.correct, item.explain].every(value => typeof value === "string"))) throw new Error("復習記録の形式が不正です。");
  if (data.exams && (typeof data.exams !== "object" || Array.isArray(data.exams))) throw new Error("原問記録の形式が不正です。");
  for (const attempts of Object.values(data.exams ?? {}) as ExamAttempt[][]) {
    if (!Array.isArray(attempts) || attempts.some(attempt => !attempt?.answers || !attempt.judgments || typeof attempt.answers !== "object" || typeof attempt.judgments !== "object" || Object.values(attempt.answers).some(value => typeof value !== "string") || Object.values(attempt.judgments).some(value => !["correct", "partial", "incorrect"].includes(value)))) throw new Error("原問の解答形式が不正です。");
  }
  if (data.readings != null && (typeof data.readings !== "object" || Array.isArray(data.readings))) throw new Error("読解記録の形式が不正です。");
  for (const state of Object.values(data.readings ?? {}) as ReadingState[]) {
    if (!state || typeof state.cursor !== "string" || state.answerTarget != null && typeof state.answerTarget !== "string" || !state.checks || typeof state.checks !== "object" || Array.isArray(state.checks)) throw new Error("読解位置の形式が不正です。");
    for (const check of Object.values(state.checks)) {
      if (!check || !Number.isInteger(check.choice) || check.choice < 0 || typeof check.firstCorrect !== "boolean" || !Array.isArray(check.order) || !check.order.includes(check.choice) || new Set(check.order).size !== check.order.length || check.order.some(value => !Number.isInteger(value) || value < 0 || value >= check.order.length)) throw new Error("理解チェックの記録が不正です。");
    }
  }
  for (const unit of units) {
    if (!data.units[unit.id]) continue;
    data.units[unit.id].engine = migrateEngine(data.units[unit.id].engine, unit.pool, data.poolSizes?.[unit.id]);
    for (const step of unit.pool) {
      const record = data.units[unit.id].engine.byId?.[step.id];
      if (!record) continue;
      if (record.ok !== null && typeof record.ok !== "boolean") throw new Error("判定記録の形式が不正です。");
      const answer = record.data;
      if (step.type === "quiz" && (!Number.isInteger(answer?.picked) || !step.choices[answer.picked])) throw new Error("選択肢の記録が教材と一致しません。");
      if (step.type === "quiz" && answer?.order && (!Array.isArray(answer.order) || answer.order.length !== step.choices.length || new Set(answer.order).size !== step.choices.length || answer.order.some((value: number) => !Number.isInteger(value) || !step.choices[value]))) throw new Error("選択肢の表示順が不正です。");
      if (step.type === "blank" && (!Array.isArray(answer?.sel) || answer.sel.length !== step.blanks.length || answer.sel.some((value: number, index: number) => !Number.isInteger(value) || !step.blanks[index].choices[value]))) throw new Error("穴埋めの記録が教材と一致しません。");
      if (step.type === "blank" && answer?.orders && (!Array.isArray(answer.orders) || answer.orders.length !== step.blanks.length || answer.orders.some((order: number[], index: number) => !Array.isArray(order) || order.length !== step.blanks[index].choices.length || new Set(order).size !== order.length || order.some(value => !Number.isInteger(value) || !step.blanks[index].choices[value])))) throw new Error("穴埋めの表示順が不正です。");
      if (step.type === "parsons" && (!Array.isArray(answer?.order) || answer.order.length !== step.lines.length || new Set(answer.order).size !== step.lines.length || answer.order.some((value: number) => !Number.isInteger(value) || !step.lines[value]))) throw new Error("並べ替えの記録が教材と一致しません。");
      if (record.history && !Array.isArray(record.history)) throw new Error("解答履歴の形式が不正です。");
    }
  }
  return { ...data, version: 3, exams: data.exams ?? {}, poolSizes: Object.fromEntries(units.map(unit => [unit.id, unit.pool.length])) };
}

export function load(units: Unit[]): Persisted | null {
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem("netsteps-v2");
  return raw ? parseBackup(raw, units) : null;
}

export function save(data: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
