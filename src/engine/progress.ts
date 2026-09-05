import type { Unit } from "../content/units";
import type { EngineState, Step, StepRecord } from "./types";
import type { UnitState } from "./storage";

export const isQuestion = (step: Step) => !["goal", "info", "viz", "original"].includes(step.type);

export function freshEngine(pool: Step[]): EngineState {
  return { queue: pool.map((_, poolIdx) => ({ poolIdx, again: false })), cursor: 0, answered: 0, byId: {}, stepIds: pool.map(step => step.id) };
}

export function recordAnswer(engine: EngineState, id: string, ok: boolean | null, data?: unknown): EngineState {
  const previous = engine.byId?.[id];
  const submittedAt = new Date().toISOString();
  const history = previous?.history ?? (previous ? [{ ok: previous.ok, data: previous.data, submittedAt: previous.submittedAt ?? "" }] : []);
  const record: StepRecord = { ok, data, submittedAt, firstTryOk: previous ? previous.firstTryOk : ok, attempts: (previous?.attempts ?? 0) + 1, history: [...history, { ok, data, submittedAt }] };
  const byId = { ...engine.byId, [id]: record };
  return { ...engine, byId, answered: Object.keys(byId).length };
}

export function progress(unit: Unit, state?: UnitState) {
  const records = state?.engine.byId ?? {};
  const completed = unit.pool.filter(step => !!records[step.id]).length;
  const questions = unit.pool.filter(isQuestion);
  const answered = questions.filter(step => typeof records[step.id]?.ok === "boolean");
  const correct = answered.filter(step => records[step.id].ok === true).length;
  const firstCorrect = answered.filter(step => records[step.id].firstTryOk === true).length;
  return { completed, total: unit.pool.length, answered: answered.length, questionTotal: questions.length, correct, firstCorrect, percent: unit.pool.length ? Math.round(100 * completed / unit.pool.length) : 0, finished: completed === unit.pool.length, records };
}

export function migrateEngine(engine: EngineState, pool: Step[], previousSize?: number): EngineState {
  const byId = { ...engine.byId };
  const ids = engine.stepIds ?? (previousSize === pool.length ? pool.map(step => step.id) : []);
  for (const [index, record] of Object.entries(engine.records ?? {})) {
    const id = ids[Number(index)];
    if (id && !byId[id]) byId[id] = { ...record, firstTryOk: record.firstTryOk === undefined ? record.ok : record.firstTryOk };
  }
  const oldId = ids[engine.queue?.[engine.cursor]?.poolIdx ?? engine.cursor];
  const cursor = Math.max(0, pool.findIndex(step => step.id === oldId));
  const legacyRecords = { ...engine.legacyRecords };
  for (const [index, record] of Object.entries(engine.records ?? {})) {
    if (!ids[Number(index)]) legacyRecords[Number(index)] = record;
  }
  return { ...freshEngine(pool), ...engine, records: undefined, legacyRecords, queue: pool.map((_, poolIdx) => ({ poolIdx, again: false })), cursor, byId, stepIds: pool.map(step => step.id) };
}
