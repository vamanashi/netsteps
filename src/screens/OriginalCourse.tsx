import { useEffect, useState, type ReactNode } from "react";
import { ORIGINALS, basicsFor, courseFor, examProgress, themeName, type Original } from "../content/catalog";
import { OfficialExam, OfficialPeek, SourceRegion } from "../components/OfficialExam";
import type { ExamAttempt, UnitState, ReadingState } from "../engine/storage";
import { WORKSHOPS } from "../content/workshops";
import { readingFor, questionPassageFor } from "../content/readings";
import { OriginalPassage } from "../components/OriginalPassage";
import { ReadingCourse } from "./ReadingCourse";

const phaseFromHash = () => {
  const selected = Number(new URLSearchParams(location.hash.split("?")[1]).get("stage"));
  return Number.isInteger(selected) && selected >= 0 && selected <= 3 ? selected : 0;
};

export function OriginalCourse({ examKey, attempts, practice, onSave, onPractice, onStart, onBack, learning, reading, onReading }: {
  examKey: string; attempts: ExamAttempt[]; practice: ExamAttempt[];
  onSave: (attempts: ExamAttempt[]) => void; onPractice: (attempts: ExamAttempt[]) => void;
  onStart: (id: string, stepId?: string) => void; onBack: () => void; learning?: UnitState;
  reading?: ReadingState; onReading: (state: ReadingState) => void;
}) {
  const exam = ORIGINALS.find(item => item.key === examKey)!;
  const [phase, updatePhase] = useState(phaseFromHash);
  useEffect(() => {
    const change = () => updatePhase(phaseFromHash());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const setPhase = (value: number) => { updatePhase(value); history.replaceState(null, "", `${location.hash.split("?")[0]}?stage=${value}`); };
  const course = courseFor(exam), basics = basicsFor(exam);
  const workshop = WORKSHOPS.find(workshop => workshop.examKey === exam.key);
  const readingPlan = readingFor(exam.key);
  const practiceTarget = (target: string) => {
    const section = workshop?.sections.find(section => section.targets.includes(target));
    if (course && section) onStart(course.id, `workshop:${section.id}:${section.steps[0].id}`);
  };
  const curriculum = workshop && course && <div className="workshop-curriculum">{workshop.sections.map((section,index) => {
    const steps = course.pool.filter(step => step.section?.id === section.id);
    const done = steps.filter(step => learning?.engine.byId?.[step.id]).length;
    return <div key={section.id}><span>{index+1}</span><div><strong>{section.title}</strong><small>{section.targets.map(target => exam.items.find(item => item.id === target)?.label).join("・")} / {done}/{steps.length} 実施</small></div><button className="button small" onClick={() => onStart(course.id, `workshop:${section.id}:${section.steps[0].id}`)}>練習 →</button></div>;
  })}</div>;
  if (readingPlan) return <ReadingCourse exam={exam} plan={readingPlan} state={reading} onChange={onReading} attempts={attempts} onSave={onSave} onBack={onBack} onPracticeTarget={practiceTarget} />;
  return <main className="page original-course" id="main" tabIndex={-1}>
    <button className="text-button" onClick={onBack}>閉じる</button>
    <div className="page-title"><div><span className="eyebrow">{themeName(exam.theme)}</span><h1>{exam.title}</h1></div></div>
    <nav className="phase-tabs" aria-label="学習の段階">{["概要", "目次", "復習", "答案"].map((label,index) => <button key={label} aria-current={phase === index ? "step" : undefined} onClick={() => setPhase(index)}>{label}</button>)}</nav>
    {exam.excludedItems.length > 0 && <p className="source-alert">採点対象外：{exam.excludedItems.map(item => item.label).join("、")}。IPAが不備により成立しないと公表しているため、実施・正解率の分母から除外しています。原ページにはそのまま掲載しています。</p>}
    {phase === 0 && <div className="reading-column original-welcome"><p>{exam.gist}</p><div className="inline-actions"><button className="button primary" onClick={() => course ? onStart(course.id) : setPhase(1)}>{learning && Object.keys(learning.engine.byId ?? {}).length ? "続ける" : "始める"}</button><button className="text-button" onClick={() => setPhase(1)}>目次</button></div><OfficialPeek official={exam.official} /></div>}
    {phase === 1 && <div className="reading-column"><h2>この過去問につながる学習</h2><p>{exam.gist}</p>
      {course ? <div className="study-option"><span className="status">{exam.coverage === "individual" ? "個別の段階解説" : "基礎＋原問分割"}</span><h3>{course.title}</h3><p>{course.desc}</p><button className="button primary" onClick={() => onStart(course.id)}>基礎から一問ずつ学ぶ →</button><p className="help">{workshop ? "入力を求めず、選択・穴埋め・並べ替えで考え方を積み上げます。各節は原問の設問から逆算しています。" : exam.coverage === "individual" ? "練習中の短い事例は教材用に再構成されたものです。" : "関連テーマの共通基礎教材を学び、途中から公式設問の分割演習へ進みます。各設問専用の解き方の解説は未整備で、公式解答例を照合する形式です。"}原問全体の答案は、段階04で別に記録します。</p></div> : <div className="study-option"><span className="status pending">個別の段階解説は未整備</span><p>原問・原図と全設問の解答欄は利用できます。ただし、R7午後Ⅰ問1のような、この問題専用の段階解説はまだありません。資料の収録と教材の完成を区別して表示しています。</p></div>}
      {curriculum}
      {basics && <div className="study-option"><h3>{themeName(exam.theme)}を初めから学ぶ</h3><p>用語の意味と、なぜその仕組みが必要なのかを確認します。</p><button className="button" onClick={() => onStart(basics.id)}>基礎レッスンを開く →</button></div>}
      <button className="button primary" onClick={() => setPhase(2)}>苦手な判断を練習する →</button>
    </div>}
    {phase === 2 && (workshop ? <div className="reading-column"><h2>判断の仕方をもう一度練習する</h2><p>原問への解答を繰り返す前に、必要な知識・条件の読み取り・理由の組立てへ戻れます。文字入力をせず、タップで練習できます。</p>{curriculum}<button className="button primary" onClick={() => setPhase(3)}>補助を閉じて原問に挑戦 →</button></div> : <AnswerWorkspace key={`${exam.key}/practice`} exam={exam} guided attempts={practice} onSave={onPractice} onFinish={() => setPhase(3)} />)}
    {phase === 3 && <AnswerWorkspace key={`${exam.key}/final`} exam={exam} attempts={attempts} onSave={onSave} onFinish={onBack} onPracticeTarget={workshop ? practiceTarget : undefined} />}
  </main>;
}

export function AnswerWorkspace({ exam, attempts, onSave, guided = false, onFinish, onPracticeTarget, targetIds, context, initialTarget, onTargetChange }: { exam: Original; attempts: ExamAttempt[]; onSave: (attempts: ExamAttempt[]) => void; guided?: boolean; onFinish: () => void; onPracticeTarget?: (target: string) => void; targetIds?: string[]; context?: ReactNode; initialTarget?: string; onTargetChange?: (target: string) => void }) {
  const items = targetIds ? exam.items.filter(item => targetIds.includes(item.id)) : exam.items;
  const [position, setPosition] = useState(() => Math.max(0, items.findIndex(item => item.id === initialTarget)));
  const [showAnswer, setShowAnswer] = useState(false);
  const [notice, setNotice] = useState("");
  const attempt: ExamAttempt = attempts[attempts.length-1] ?? { answers: {}, judgments: {}, updatedAt: "" };
  const item = items[position];
  const passage = questionPassageFor(exam.key, item.id);
  const originalQuestion = item.regions.map((region,index) => <SourceRegion key={index} region={region} label={`${exam.title} ${item.label}を含む原文`} />);
  const stats = examProgress({ ...exam, items }, attempts);
  const locked = !!attempt.submittedAt;
  const update = (value: ExamAttempt) => onSave([...attempts.slice(0,-1), { ...value, updatedAt: new Date().toISOString() }]);
  const reveal = () => {
    setShowAnswer(true);
    if (!attempt.answers[item.id]?.trim() && !locked) update({ ...attempt, assisted: true });
  };
  const move = (index: number) => { setPosition(index); setShowAnswer(false); setNotice(""); onTargetChange?.(items[index].id); };
  const submit = () => {
    if (stats.answered !== items.length || stats.judged !== items.length) { setNotice("未解答・未採点の設問があります。設問一覧から確認してください。"); return; }
    const allAnswered = exam.items.every(entry => attempt.answers[entry.id]?.trim() && attempt.judgments[entry.id]);
    update({ ...attempt, ...(allAnswered ? { submittedAt: new Date().toISOString() } : {}) });
    if (targetIds) { onFinish(); return; }
    setNotice(guided ? "部分練習を保存しました。最後は原問に挑戦しましょう。" : "全設問の答案と自己採点を保存しました。");
  };
  return <div className="answer-workspace">
    <aside className="answer-index"><h2>{targetIds ? "この章の原問" : guided ? "設問を一つずつ" : "原問の解答記録"}</h2><p>{stats.answered} / {stats.total} 解答<br />{stats.judged} / {stats.total} 自己採点</p><nav aria-label="原問の設問一覧">{items.map((entry,index) => <button key={entry.id} aria-current={position===index ? "step" : undefined} onClick={() => move(index)}><span>{attempt.judgments[entry.id] === "correct" ? "✓" : attempt.judgments[entry.id] ? "△" : attempt.answers[entry.id]?.trim() ? "●" : "○"}</span>{entry.label}</button>)}</nav>
      <p className="help">{guided ? "この段階の練習は、原問の解答済み件数に含めません。" : "自己採点は公式の得点ではありません。部分正解は正解数に含めません。"}</p>
      {attempts.length > 0 && <details><summary>解答履歴（{attempts.length}回）</summary>{attempts.map((entry,index) => <p key={index}>{index+1}回目：{entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString("ja-JP") + " 全設問解答済み" : "作業中"} / {Object.values(entry.judgments).filter(value => value === "correct").length} 正解{entry.assisted ? "（教材・解答例の補助あり）" : ""}</p>)}</details>}
    </aside>
    <section className="answer-editor">
      <div className="lesson-toolbar"><span>{targetIds ? "章末の原問" : guided ? "部分練習" : "本番順の演習"} / {item.label}</span><span>{locked ? "保存済みの答案" : "入力は自動保存"}</span></div>
      {guided || targetIds ? <><h2>{item.label}だけを解いてみる</h2><p>今は{item.label}だけで構いません。必要な条件は下の参照欄から読み返せます。</p>{passage ? <OriginalPassage key={item.id} passage={passage} exam={exam} original={originalQuestion} /> : originalQuestion}{context ?? <OfficialPeek official={exam.official} />}</> : <><h2>{item.label}</h2><OfficialExam official={exam.official} /></>}
      {onPracticeTarget && <button className="text-button" onClick={() => { if (!locked) update({ ...attempt, assisted: true }); onPracticeTarget(item.id); }}>この設問の考え方をタップで練習する →</button>}
      <label className="answer-label" htmlFor="original-answer">{item.label}の解答（複数の空欄は記号ごとに記入）</label>
      <textarea id="original-answer" rows={5} value={attempt.answers[item.id] ?? ""} readOnly={locked} onChange={event => { const judgments = { ...attempt.judgments }; delete judgments[item.id]; update({ ...attempt, answers: { ...attempt.answers, [item.id]: event.target.value }, judgments }); }} placeholder="原文の字数・指定条件に従って解答してください。" />
      <div className="inline-actions"><button className="button" onClick={reveal}>解答例と照合する</button>{!locked && <button className="text-button" onClick={() => { update({ ...attempt, answers: { ...attempt.answers, [item.id]: "解答できなかった" }, judgments: { ...attempt.judgments, [item.id]: "incorrect" } }); setShowAnswer(true); }}>解答できなかったと記録</button>}</div>
      {(showAnswer || attempt.judgments[item.id]) && <div className="answer-reference"><h3>公式解答例：{item.label}</h3><pre>{item.answerIsDiagram ? "図による解答です。公式解答例の該当する設問番号を確認してください。" : item.answer}</pre><details open={item.answerIsDiagram}><summary>解答例の原ページを確認する（表・図を含む）</summary><OfficialExam official={{ label: `${exam.title}を含む公式解答例`, pages: exam.answerPages, url: exam.official.answerUrl }} /></details><p className="help">PDFからの文字抽出です。表の対応・順不同・補足条件は<a href={exam.official.answerUrl} target="_blank" rel="noreferrer">公式解答例PDF</a>で確認してください。空欄・複数指定がある場合は、この小問全体を判定します。</p><fieldset disabled={locked || !attempt.answers[item.id]?.trim()}><legend>解答例と照合した結果</legend>{([['correct','正解'],['partial','部分正解'],['incorrect','不正解']] as const).map(([value,label]) => <label key={value}><input type="radio" name="self-judgment" checked={attempt.judgments[item.id] === value} onChange={() => update({ ...attempt, judgments: { ...attempt.judgments, [item.id]: value } })} />{label}</label>)}</fieldset></div>}
      <div className="lesson-footer"><button className="button" disabled={position===0} onClick={() => move(position-1)}>← 前の設問</button><button className="button" disabled={position===items.length-1} onClick={() => move(position+1)}>次の設問 →</button></div>
      <div className="submission-panel"><p>{stats.answered} / {stats.total} 解答・{stats.judged} / {stats.total} 採点済み。自己採点の正解 {stats.correct} 件。</p>{!locked ? <button className="button primary" onClick={submit}>{targetIds ? "この章の解答を確定して進む →" : "全設問の解答を確定する"}</button> : <div className="inline-actions"><button className="button primary" onClick={onFinish}>{targetIds ? "次へ進む →" : guided ? "原問に挑戦する →" : "対応表に戻る →"}</button>{!targetIds && <button className="button" onClick={() => { onSave([...attempts, { answers: {}, judgments: {}, updatedAt: new Date().toISOString() }]); move(0); }}>記録を残してもう一度解く</button>}</div>}<p role="status">{notice}</p></div>
    </section>
  </div>;
}
