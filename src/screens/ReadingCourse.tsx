import { useRef, useState } from "react";
import { SourceRegion, OfficialPeek } from "../components/OfficialExam";
import { examProgress, type Original } from "../content/catalog";
import { readingProgress, type ReadingPart, type ReadingPlan } from "../content/readings";
import type { ExamAttempt, ReadingState } from "../engine/storage";
import { seededOrder } from "../steps/StepParts";
import { AnswerWorkspace } from "./OriginalCourse";
import { OriginalPassage } from "../components/OriginalPassage";
import "../design/reading-course.css";

function Excerpts({ part, exam }: { part: ReadingPart; exam: Original }) {
  const [zoom, setZoom] = useState(false);
  if (part.passage) return <OriginalPassage passage={part.passage} exam={exam} original={part.regions.map((region, index) => <SourceRegion key={index} region={{ ...region, src: exam.official.pages[region.page - exam.startPage] }} label={part.title} />)} />;
  return <div className={`reading-excerpts ${zoom ? "is-zoomed" : ""}`}>
    <div className="reading-source-tools"><span className="source-label">IPA 原文・原図</span><button className="text-button" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? "幅に合わせる" : "原文を拡大"}</button></div>
    {part.regions.map((region,index) => <SourceRegion key={index} region={{ ...region, src: exam.official.pages[region.page - exam.startPage] }} label={part.title} />)}
  </div>;
}

function ReadingCard({ part, exam, record, onAnswer }: { part: ReadingPart; exam: Original; record?: ReadingState["checks"][string]; onAnswer: (choice: number, order: number[]) => void }) {
  const [retry, setRetry] = useState(false);
  const choicesRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [order] = useState(() => record?.order.length === part.check.choices.length ? record.order : seededOrder(`${part.id}-${Math.random()}`, part.check.choices.length));
  const answered = !!record && !retry;
  const correct = part.check.choices.find(choice => choice.ok)!;
  return <>
    <h2>{part.title}</h2><p className="reading-lead">{part.lead}</p>
    {!!part.glossary?.length && <details className="reading-glossary"><summary>用語（{part.glossary.length}語）</summary><dl>{part.glossary.map(entry => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.body}</dd></div>)}</dl></details>}
    <Excerpts part={part} exam={exam} />
    <section className="reading-check" aria-labelledby={`check-${part.id}`}><span className="eyebrow">確認問題 · 原文を基に作成</span><h3 id={`check-${part.id}`}>{part.check.prompt}</h3>
      <div className="reading-choices" ref={choicesRef}>{order.map(index => <button key={index} className={`reading-choice ${answered && record.choice === index ? "selected" : ""}`} aria-pressed={answered && record.choice === index} disabled={answered} onClick={() => { onAnswer(index, order); setRetry(false); requestAnimationFrame(() => feedbackRef.current?.scrollIntoView({ block: "center" })); }}>{part.check.choices[index].text}{answered && record.choice === index && <span>選択済み</span>}</button>)}</div>
      {answered && <div ref={feedbackRef} className={`reading-feedback ${part.check.choices[record.choice].ok ? "is-correct" : "needs-review"}`}>
        <p role="status"><strong>{part.check.choices[record.choice].ok ? "正解" : "不正解"}</strong></p>
        <p>{part.check.choices[record.choice].explain}</p>{!part.check.choices[record.choice].ok && <p><strong>正解：{correct.text}</strong><br />{correct.explain}</p>}
        <button className="text-button" onClick={() => { setRetry(true); requestAnimationFrame(() => choicesRef.current?.querySelector("button")?.focus()); }}>解き直す</button>
      </div>}
    </section>
  </>;
}

export function ReadingCourse({ exam, plan, state, onChange, attempts, onSave, onBack, onPracticeTarget }: {
  exam: Original; plan: ReadingPlan; state?: ReadingState; onChange: (state: ReadingState) => void;
  attempts: ExamAttempt[]; onSave: (attempts: ExamAttempt[]) => void; onBack: () => void; onPracticeTarget: (target: string) => void;
}) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  const steps = plan.chapters.flatMap((chapter, chapterIndex) => [
    ...chapter.parts.map(part => ({ id: `read:${part.id}`, chapterIndex, part, answer: false })),
    ...(chapter.targets.length ? [{ id: `answer:${chapter.id}`, chapterIndex, part: undefined, answer: true }] : [])
  ]);
  const position = state?.cursor === "complete" ? steps.length : Math.max(0, steps.findIndex(step => step.id === state?.cursor));
  const step = steps[position];
  const chapter = step ? plan.chapters[step.chapterIndex] : undefined;
  const checks = state?.checks ?? {};
  const stats = readingProgress(plan, state);
  const originalStats = examProgress(exam, attempts);
  const currentComplete = !!originalStats.attempt?.submittedAt && originalStats.answered === originalStats.total && originalStats.judged === originalStats.total;
  const move = (index: number) => {
    setOutlineOpen(false);
    onChange({ cursor: steps[index]?.id ?? "complete", checks });
    requestAnimationFrame(() => {
      const current = document.getElementById("reading-current");
      current?.focus({ preventScroll: true });
      current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  const part = step?.part;
  const nextStep = steps[position + 1];
  const nextLabel = !nextStep ? "結果" : "次へ";
  const partPosition = chapter && part ? chapter.parts.findIndex(entry => entry.id === part.id) + 1 : 0;
  const chapterStats = (targets: string[]) => targets.filter(target => originalStats.attempt?.answers[target]?.trim() && originalStats.attempt.judgments[target]).length;
  const completedChapters = plan.chapters.filter(entry => entry.parts.every(part => checks[part.id]) && chapterStats(entry.targets) === entry.targets.length).length;
  return <main className="page reading-course" id="main" tabIndex={-1}>
    <button className="text-button" onClick={onBack}>閉じる</button>
    <header className="reading-heading"><h1>{exam.title}</h1></header>
    <div className="reading-tools">
      <details className="reading-outline" open={outlineOpen} onToggle={event => setOutlineOpen(event.currentTarget.open)}><summary>目次</summary>
        <nav aria-label="原文と章末の原問の目次"><p>確認問題 {stats.answered}/{stats.total} · 原問採点 {originalStats.judged}/{originalStats.total} · 完了 {completedChapters}/{plan.chapters.length}章</p><ol>{plan.chapters.map((entry, index) => <li key={entry.id}>
          <h2>第{index + 1}章　{entry.title}</h2>
          <ol>{entry.parts.map((entryPart, partIndex) => {
            const record = checks[entryPart.id];
            const status = !record ? "未回答" : entryPart.check.choices[record.choice]?.ok ? "回答済み・正解" : "回答済み・要確認";
            return <li key={entryPart.id}><button className="reading-outline-link" aria-current={step?.id === `read:${entryPart.id}` ? "step" : undefined} onClick={() => move(steps.findIndex(entryStep => entryStep.id === `read:${entryPart.id}`))}><span>{partIndex + 1}. {entryPart.title}</span><small>{step?.id === `read:${entryPart.id}` && "現在地 · "}{status}</small></button></li>;
          })}</ol>
          {entry.targets.length > 0 && <button className="reading-outline-link" aria-current={step?.id === `answer:${entry.id}` ? "step" : undefined} onClick={() => move(steps.findIndex(entryStep => entryStep.id === `answer:${entry.id}`))}><span>章末の原問</span><small>解答・採点 {chapterStats(entry.targets)}/{entry.targets.length}</small></button>}
        </li>)}</ol><button className="text-button" aria-current={!step ? "step" : undefined} onClick={() => move(steps.length)}>結果</button></nav>
      </details>
    </div>
    {step && chapter ? <>
      <div className="reading-current-toolbar" id="reading-current" tabIndex={-1} role="region" aria-label={part ? `第${step.chapterIndex + 1}章、パート${partPosition}/${chapter.parts.length}、${part.title}` : `第${step.chapterIndex + 1}章、章末の原問`}>
        <div><span>{chapter.title}</span></div>
        <div className="reading-position"><span>{position + 1} / {steps.length}</span><progress value={position + 1} max={steps.length} aria-label="コース内の現在地（回答済みの数ではありません）" /></div>
      </div>
      {part ? <div className="reading-column"><ReadingCard key={part.id} part={part} exam={exam} record={checks[part.id]} onAnswer={(choice, order) => onChange({ cursor: step.id, checks: { ...checks, [part.id]: { choice, order, firstCorrect: checks[part.id]?.firstCorrect ?? part.check.choices[choice].ok } } })} />
      </div> : <div className="reading-chapter-answers"><h2>章末問題</h2>
        <AnswerWorkspace key={chapter.id} exam={exam} attempts={attempts} onSave={values => onSave(values.map((attempt,index) => index === values.length-1 && !attempt.submittedAt ? { ...attempt, assisted: true } : attempt))} targetIds={chapter.targets} initialTarget={state?.answerTarget} onTargetChange={answerTarget => onChange({ cursor: step.id, checks, answerTarget })} onFinish={() => move(position+1)} onPracticeTarget={onPracticeTarget} context={<details className="reading-reference"><summary>原文</summary>{plan.chapters.slice(0,step.chapterIndex+1).map(entry => <details key={entry.id}><summary>{entry.title}</summary>{entry.parts.map(part => <details key={part.id}><summary>{part.title}</summary><Excerpts part={part} exam={exam}/></details>)}</details>)}</details>} />
      </div>}
      <nav className="reading-bottom-nav" aria-label="コースの前後移動"><div>
        <button className="button" disabled={position === 0} onClick={() => move(position - 1)}>前へ</button>
        <button className={`button ${part ? "primary" : ""}`} onClick={() => move(position + 1)}>{part ? nextLabel : "スキップ"}</button>
      </div></nav>
    </> : <section className="reading-column reading-result" id="reading-current" tabIndex={-1} aria-label="ここまでの結果"><h2>{currentComplete ? "全設問の解答を記録しました" : "ここまでの取り組み"}</h2><p>おつかれさまです。続きは目次や下の答案から、いつでも再開できます。</p><p>理解チェック：{stats.answered}/{stats.total} 回答（正解 {stats.correct}）<br />原問：{originalStats.answered}/{originalStats.total} 解答・{originalStats.judged}/{originalStats.total} 自己採点（正解 {originalStats.correct}）</p>
      {!currentComplete && <p>未解答・未採点の設問、または章末で未確定の答案があります。該当する章へ戻り、解答を確定してください。</p>}
      <div className="workshop-curriculum">{plan.chapters.filter(chapter => chapter.targets.length).map(chapter => <div key={chapter.id}><strong>{chapter.title}</strong><span>{chapterStats(chapter.targets)}/{chapter.targets.length}</span><button className="button small" onClick={() => move(steps.findIndex(step => step.id === `answer:${chapter.id}`))}>答案を見る →</button></div>)}</div>
      <details className="reading-answer-help"><summary>結果と記録の見方</summary><p>章ごとの答案を合算しています。「全設問に解答済み」と「全問正解」は別です。章ごとの読解補助を利用した解答として記録し、自己採点の正解数を分けて表示します。</p></details><div className="inline-actions"><button className="button primary" onClick={onBack}>一覧</button>{originalStats.attempt?.submittedAt && <button className="button" onClick={() => { onSave([...attempts, { answers: {}, judgments: {}, updatedAt: new Date().toISOString(), assisted: true }]); move(0); }}>答案履歴を残してもう一度取り組む</button>}</div><OfficialPeek official={exam.official} />
    </section>}
  </main>;
}
