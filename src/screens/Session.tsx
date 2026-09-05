import { useRef, useState } from "react";
import { GoalStep, QuizStep, InfoStep, VizStep, type OnDone } from "../steps/BasicSteps";
import { ParsonsStep, BlankStep, CalcStep, WriteStep } from "../steps/FormSteps";
import { ExamContext } from "../components/ExamSheet";
import { SubmissionContext } from "../engine/Submission";
import { OriginalStep } from "../steps/OriginalStep";
import { recordAnswer } from "../engine/progress";
import { SourceRegion } from "../components/OfficialExam";
import type { Unit } from "../content/units";
import type { EngineState, Mistake } from "../engine/types";
import { LessonActionContext } from "../engine/LessonAction";
import { Attribution } from "../components/Attribution";

export function Session({ unit, engine, setEngine, onSolved, onClose, addMistake, onSelf, onOriginal }: {
  unit: Unit; engine: EngineState; setEngine: (engine: EngineState) => void;
  onSolved: () => void; onClose: () => void; addMistake: (mistake: Mistake) => void;
  onSelf: (value: string | null) => void; onOriginal?: () => void;
}) {
  const position = Math.min(engine.cursor, unit.pool.length - 1);
  const item = unit.pool[position];
  const current = useRef(engine);
  current.current = engine;
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(false);
  const [actionTarget, setActionTarget] = useState<HTMLDivElement | null>(null);
  const submitted = useRef(false);
  const record = retry ? undefined : engine.byId?.[item.id];
  const completed = unit.pool.filter(step => engine.byId?.[step.id]).length;
  const excerpt = item.originalExcerpt;
  const excerptSource = excerpt && unit.exam?.official?.pages.find(path => path.endsWith(`/${String(excerpt.page).padStart(2, "0")}.jpg`));
  const update = (value: EngineState) => { current.current = value; setEngine(value); };
  const navigate = (cursor: number) => {
    update({ ...current.current, cursor });
    setRetry(false); submitted.current = false;
    requestAnimationFrame(() => {
      const main = document.getElementById("main");
      main?.focus({ preventScroll: true });
      main?.scrollIntoView({ block: "start" });
    });
  };
  const submit: OnDone = (ok, data) => {
    update(recordAnswer(current.current, item.id, ok, data));
    submitted.current = true;
    requestAnimationFrame(() => document.querySelector(".lesson-judgment")?.scrollIntoView({ block: "center" }));
  };
  const onDone: OnDone = (ok, data) => {
    if (!submitted.current && (!record || retry)) submit(ok, data);
    if (position < unit.pool.length - 1) navigate(position + 1);
    else if (unit.pool.every(step => current.current.byId?.[step.id])) onSolved();
    else if (onOriginal) onOriginal();
    else onClose();
  };
  const recordMistake = (mistake: Omit<Mistake, "key" | "reviewed">) => addMistake({ ...mistake, key: `${unit.id}/${item.id}/${Date.now()}`, reviewed: false });
  const props = { record, onDone, recordMistake };
  return <ExamContext.Provider value={unit.exam}>
    <div className="lesson-layout session-layout">
      <main className="lesson-main" id="main" tabIndex={-1}>
        <div className="session-heading"><button className="text-button" onClick={onClose}>閉じる</button></div>
        <h1 className="session-title">{unit.title}</h1>
        <div className="lesson-toolbar"><span>{position + 1} / {unit.pool.length} ステップ</span>
          <span>{record ? record.ok === null ? "確認済み" : record.ok ? "正解済み" : "回答済み・要復習" : "未回答"}</span>
        </div>
        <progress className="session-progress" aria-label="実施済みステップ" value={completed} max={unit.pool.length} />
        <details className="mobile-outline"><summary>目次</summary><select aria-label="移動先のステップ" value={position} onChange={event => navigate(Number(event.target.value))}>{unit.pool.map((step,index) => <option key={step.id} value={index}>{index+1}. {step.title}</option>)}</select>
          {record && <button className="text-button" onClick={() => { setRetry(true); submitted.current = false; setRevision(value => value + 1); }}>解き直す</button>}
          {item.type !== "quiz" && position < unit.pool.length - 1 && !record && <button className="text-button" onClick={() => navigate(position + 1)}>スキップ</button>}
          {onOriginal && <button className="text-button" onClick={onOriginal}>過去問</button>}
        </details>
        <SubmissionContext.Provider value={submit}>
          <LessonActionContext.Provider value={actionTarget}>
          <div key={`${unit.id}/${item.id}/${revision}`} className="lesson-step">
            {unit.exam?.official && !item.source && <Attribution label={unit.exam.official.label} url={unit.exam.official.url} mode={item.type === "original" ? "original" : "adapted"} />}
            {item.source && item.type !== "quiz" && <Attribution {...item.source} mode="past" figures={!!item.fig} />}
            {item.section && <div className="workshop-section"><span>{item.section.index + 1} / {item.section.total} 節</span><strong>{item.section.title}</strong><small>つながる原問：{item.section.targets.map(target => target.replace(/^s(\d+)(?:-(\d+))?$/, (_, section, part) => `設問${section}${part ? `(${part})` : ""}`)).join("・")}</small></div>}
            {excerpt && excerptSource && <SourceRegion region={{ ...excerpt, src: excerptSource }} label={excerpt.label} />}
            {item.type === "goal" && <GoalStep step={item} {...props} onSelf={onSelf} />}
            {item.type === "quiz" && <QuizStep step={item} {...props} />}
            {item.type === "info" && <InfoStep step={item} onDone={onDone} />}
            {item.type === "viz" && <VizStep step={item} {...props} />}
            {item.type === "parsons" && <ParsonsStep step={item} {...props} />}
            {item.type === "blank" && <BlankStep step={item} {...props} />}
            {item.type === "calc" && <CalcStep step={item} {...props} />}
            {item.type === "write" && <WriteStep step={item} {...props} />}
            {item.type === "original" && <OriginalStep step={item} {...props} />}
          </div>
          </LessonActionContext.Provider>
        </SubmissionContext.Provider>
        <div className="session-actionbar" aria-label="レッスンの操作">
          <button className="button" disabled={position === 0} onClick={() => navigate(position - 1)}>前へ</button>
          <div className="session-action-target" ref={setActionTarget} />
          {item.type === "quiz" && !record && !submitted.current && <button className="button" onClick={() => position < unit.pool.length - 1 ? navigate(position + 1) : onClose()}>スキップ</button>}
          {item.type === "original" && <button className="button" disabled={position === unit.pool.length - 1} onClick={() => navigate(position + 1)}>次へ →</button>}
        </div>
      </main>
    </div>
  </ExamContext.Provider>;
}
