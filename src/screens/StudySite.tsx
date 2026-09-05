import { useState } from "react";
import { UNITS, THEMES, type Unit } from "../content/units";
import { ORIGINALS, examProgress, themeName, courseFor } from "../content/catalog";
import { progress } from "../engine/progress";
import type { Persisted, UnitState } from "../engine/storage";
import { READINGS, readingFor, readingProgress } from "../content/readings";
import "../design/study-pages.css";
import { OverallProgress } from "../components/OverallProgress";

export const rate = (correct: number, total: number) => total ? `${Math.round(correct / total * 100)}%` : "—";

function StudyStart({ data, onStart }: { data: Persisted; onStart: (id: string) => void }) {
  const current = UNITS.find(unit => unit.id === data.currentUnit && data.units[unit.id]);
  const next = UNITS.find(unit => unit.kind === "basics" && !progress(unit, data.units[unit.id]).finished);
  const first = UNITS.find(unit => unit.kind === "basics" && THEMES.find(theme => theme.id === unit.theme)?.order === 0) ?? next;
  const savedReadings = READINGS.filter(plan => data.readings?.[plan.examKey]);
  const reading = savedReadings.find(plan => data.readings?.[plan.examKey]?.cursor !== "complete");
  const hasProgress = UNITS.some(unit => data.units[unit.id]) || savedReadings.length > 0 || ORIGINALS.some(exam => (data.exams[exam.key]?.length ?? 0) > 0);
  const target = !hasProgress ? first : current && !progress(current, data.units[current.id]).finished ? current : next ?? current;
  const targetStats = target ? progress(target, data.units[target.id]) : null;
  const targetLabel = !hasProgress ? "Chapter 00 を始める" : target ? `${target.title}${targetStats?.finished ? "を復習" : data.units[target.id] ? "を再開" : "を始める"}` : "";
  const targetHasReading = target && ORIGINALS.some(exam => exam.courseId === target.id && readingFor(exam.key));
  const readStats = reading ? readingProgress(reading, data.readings?.[reading.examKey]) : null;
  return <section className="study-start" aria-label="次の学習"><div><h2>{hasProgress ? "続きから" : "はじめに"}</h2></div><div className="study-next">
    {reading && readStats && <div><span>読解の続き · 理解チェック {readStats.answered}/{readStats.total}</span><a className="button primary" href={`#exam/${reading.examKey}`}>{reading.title}を再開</a></div>}
    {target && targetStats && <div><span>{hasProgress ? `${target.kind === "basics" ? "基礎" : "補助練習"} · ${targetStats.completed}/${targetStats.total} ステップ実施` : "はじめての方へ"}</span>{targetHasReading ? <a className={`button ${reading ? "" : "primary"}`} href={`#lesson/${target.id}?practice=1`}>{targetLabel}</a> : <button className={`button ${reading ? "" : "primary"}`} onClick={() => onStart(target.id)}>{targetLabel}</button>}</div>}
    {!reading && !target && hasProgress && <a className="button primary" href="#exams">過去問から次の学習を選ぶ</a>}
  </div></section>;
}

function CourseLine({ unit, state, onStart }: { unit: Unit; state?: UnitState; onStart: (id: string) => void }) {
  const result = progress(unit, state);
  return <div className="course-line"><span className="course-kind">{unit.kind === "basics" ? "基礎" : "過去問"}</span><button className="course-name" onClick={() => onStart(unit.id)}>{unit.title}</button><span className="tabular muted">{result.completed}/{result.total}</span><span className="tabular">{rate(result.correct,result.answered)}</span><button className="button small" onClick={() => onStart(unit.id)}>{result.finished ? "復習" : result.completed ? "続き" : "開始"} →</button></div>;
}

export function Lessons({ data, onStart, onOriginal }: { data: Persisted; onStart: (id: string) => void; onOriginal: (key: string) => void }) {
  const [search,setSearch] = useState("");
  const [expanded,setExpanded] = useState<string[]>([]);
  const basics = UNITS.filter(unit => unit.kind === "basics");
  const complete = basics.filter(unit => progress(unit,data.units[unit.id]).finished).length;
  const filteredThemes = THEMES.filter(theme => `${String(theme.order).padStart(2, "0")} ${theme.name} ${theme.learn}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <main className="page study-page" id="main" tabIndex={-1}><div className="page-title"><div><h1>学習する</h1></div><span className="page-count">{complete}<small> / {basics.length} 基礎コース完了</small></span></div>
    <StudyStart data={data} onStart={onStart} />
    <OverallProgress data={data} />
    <div className="section-heading"><h2>Chapter 一覧</h2><label className="study-search">章を検索<input type="search" placeholder="章番号・テーマ・キーワード" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
    <p className="study-count" role="status">{filteredThemes.length} / {THEMES.length} 章{search.trim() && " · 検索結果"}</p>
    <div className="chapter-list">{filteredThemes.map(theme => {
      const units = UNITS.filter(unit => unit.theme===theme.id);
      const base = units.find(unit => unit.kind === "basics");
      const stats = base ? progress(base,data.units[base.id]) : null;
      const originals = ORIGINALS.filter(exam => exam.theme===theme.id);
      return <section key={theme.id} className="chapter-list-item"><div className="chapter-line"><span className="chapter-number">{String(theme.order).padStart(2,"0")}</span><h3>{base ? <button className="course-name" onClick={() => onStart(base.id)}>{theme.name}</button> : theme.name}</h3><span className="study-chapter-state">{stats?.finished ? "基礎完了" : stats?.completed ? "基礎の続き" : "基礎未着手"}<small>{stats?.completed ?? 0}/{stats?.total ?? 0} ステップ</small></span>{originals.length > 0 ? <button className="chapter-toggle" aria-expanded={expanded.includes(theme.id)} aria-controls={`study-chapter-${theme.id}`} aria-label={`${theme.name}の過去問${originals.length}問を${expanded.includes(theme.id) ? "閉じる" : "表示"}`} onClick={()=>setExpanded(current=>current.includes(theme.id)?current.filter(id=>id!==theme.id):[...current,theme.id])}>過去問 {originals.length}問 {expanded.includes(theme.id)?"−":"＋"}</button> : <span className="study-no-exams">基礎のみ</span>}{base && <button className="button small" aria-label={`${theme.name}の基礎を${stats?.finished ? "復習" : "学習"}`} onClick={() => onStart(base.id)}>{stats?.finished ? "復習" : stats?.completed ? "続き" : "始める"}</button>}</div>
      {originals.length > 0 && <div className="chapter-details" id={`study-chapter-${theme.id}`} hidden={!expanded.includes(theme.id)}><div className="chapter-description">{theme.learn}</div>{units.filter(unit=>unit.kind==="basics").map(unit => <CourseLine key={unit.id} unit={unit} state={data.units[unit.id]} onStart={onStart} />)}{originals.map(exam => <div className="original-line" key={exam.key}><button className="course-name" onClick={() => onOriginal(exam.key)}>{exam.title}</button><span className="muted">{readingFor(exam.key) ? "原文読解＋章末問題" : exam.coverage === "individual" ? "個別の段階解説" : "基礎＋原問分割"}</span><span>原問：{examProgress(exam,data.exams[exam.key]).label}</span><button className="button small" onClick={() => onOriginal(exam.key)}>開く</button></div> )}</div>}</section>;
    })}</div>{!filteredThemes.length && <div className="study-empty"><h3>一致する章がありません</h3><p>短いキーワードや章番号で検索してください。</p><button className="button" onClick={() => setSearch("")}>検索をクリア</button></div>}<p className="help">章名から基礎レッスンを開けます。実施ステップには「読む」も含みます。詳細の正解率は回答済みの練習問題だけで計算します。</p>
  </main>;
}

export function ExamTable({ data, onOriginal, onStart }: { data: Persisted; onOriginal: (key:string)=>void; onStart: (id:string)=>void }) {
  const [year,setYear]=useState("all"), [division,setDivision]=useState("all"), [theme,setTheme]=useState("all"), [state,setState]=useState("all"), [coverage,setCoverage]=useState("all"), [search,setSearch]=useState("");
  const filtered = ORIGINALS.filter(exam => {
    const stats=examProgress(exam,data.exams[exam.key]);
    return (year==="all" || exam.exam===year) && (division==="all"||exam.division===division) && (theme==="all"||exam.theme===theme) && (coverage==="all" || (coverage==="individual")===(exam.coverage==="individual")) && (state==="all" || state==="done"&&stats.complete || state==="new"&&!stats.answered&&!stats.complete || state==="progress"&&stats.answered>0&&!stats.complete) && `${exam.title} ${exam.gist} ${themeName(exam.theme)}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const complete=ORIGINALS.filter(exam=>examProgress(exam,data.exams[exam.key]).complete).length;
  const resetFilters = () => { setYear("all"); setDivision("all"); setTheme("all"); setState("all"); setCoverage("all"); setSearch(""); };
  const hasFilters = [year, division, theme, state, coverage].some(value => value !== "all") || search.length > 0;
  return <main className="page wide-page study-page" id="main" tabIndex={-1}><div className="page-title"><div><h1>過去問</h1></div><span className="page-count">{complete}<small> / {ORIGINALS.length} 原問解答済み</small></span></div>
    <div className="coverage-line"><span>原文・原図 <strong>50 / 50</strong></span><span>個別の段階学習 <strong>{ORIGINALS.filter(exam=>exam.coverage==="individual").length} / 50</strong></span><span>基礎＋原問分割 <strong>{ORIGINALS.filter(exam=>exam.coverage==="foundation").length} / 50</strong></span></div>
    <div className="filters"><label>年度<select value={year} onChange={event=>setYear(event.target.value)}><option value="all">全年度</option>{[...new Set(ORIGINALS.map(exam=>exam.exam))].map(id=><option value={id} key={id}>{ORIGINALS.find(exam=>exam.exam===id)!.title.split(" 午後")[0]}</option>)}</select></label><label>区分<select value={division} onChange={event=>setDivision(event.target.value)}><option value="all">午後Ⅰ・Ⅱ</option><option value="pm1">午後Ⅰ</option><option value="pm2">午後Ⅱ</option></select></label><label>テーマ<select value={theme} onChange={event=>setTheme(event.target.value)}><option value="all">全テーマ</option>{THEMES.map(theme=><option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><label>教材<select value={coverage} onChange={event=>setCoverage(event.target.value)}><option value="all">全て</option><option value="individual">個別の段階学習あり</option><option value="foundation">基礎＋原問分割</option></select></label><label>原問の解答状態<select value={state} onChange={event=>setState(event.target.value)}><option value="all">全て</option><option value="new">未解答</option><option value="progress">解答・採点中</option><option value="done">全設問解答済み</option></select></label><label>検索<input type="search" placeholder="OSPF、令和7…" value={search} onChange={event=>setSearch(event.target.value)} /></label></div>
    <div className="study-filter-summary"><p className="table-caption" role="status">{filtered.length} / {ORIGINALS.length}件 · 2015〜2025年の10回分（2020年は実施なし）</p><button className="button" disabled={!hasFilters} onClick={resetFilters}>条件をリセット</button></div>
    <p className="help" id="study-exam-help">状態の絞り込みは原問の答案・自己採点だけが対象です。「未解答」でも読解・補助練習を進めている場合があります。横にスクロールできます。詳細から学習記録を確認できます。</p>
    <div className="table-scroll study-exam-scroll" role="region" aria-label="過去問の対応表" aria-describedby="study-exam-help" tabIndex={0}><table className="study-exam-table"><caption className="sr-only">年度・区分・問番号とテーマ、利用できる教材、原問の解答状況</caption><thead><tr><th scope="col">年度 / 区分 / 問</th><th scope="col">テーマ</th><th scope="col">利用できる教材・学習記録</th><th scope="col">原問の解答状況</th></tr></thead><tbody>{filtered.map(exam=>{
      const stats=examProgress(exam,data.exams[exam.key]);const course=courseFor(exam);const learning=course ? progress(course,data.units[course.id]):null;
      const reading = readingFor(exam.key); const readStats = reading ? readingProgress(reading, data.readings?.[exam.key]) : null;
      const readingState = data.readings?.[exam.key];
      const learningLabel = reading ? readingState ? readingState.cursor === "complete" ? "読解の最終ページまで到達" : "読解の続きあり" : "読解未着手" : learning?.finished ? "補助練習完了" : learning?.completed || course && data.units[course.id] ? "補助練習の続きあり" : "補助練習未着手";
      return <tr key={exam.key}><th scope="row"><button className="course-name" onClick={() => onOriginal(exam.key)} aria-label={`${exam.title}を開く`}>{exam.title.split(" 午後")[0]}<small className="study-block">{exam.division==="pm1"?"午後Ⅰ":"午後Ⅱ"} / 問{exam.q}</small></button></th><td>{themeName(exam.theme)}</td><td><div className="study-material">{reading ? <button className="text-button" onClick={() => onOriginal(exam.key)}>原文読解＋章末問題</button> : course ? <button className="text-button" onClick={() => onStart(course.id)}>{exam.coverage === "individual" ? "個別の段階解説" : "基礎＋原問分割"}</button> : <span className="pending-text">補助教材は未整備</span>}<span>{reading || course ? learningLabel : "原文から取り組めます"}</span></div><details className="study-details"><summary><span className="sr-only">{exam.title}の</span>教材・学習記録の詳細</summary><dl><dt>教材の対応</dt><dd>{exam.coverage === "individual" ? "個別の段階学習" : "基礎＋原問分割"}</dd><dt>原文・原図</dt><dd>あり <button className="text-button" onClick={() => onOriginal(exam.key)}>開く</button></dd><dt>関連テーマ</dt><dd>{exam.relatedThemes.map(themeName).join(" / ") || themeName(exam.theme)}</dd><dt>読解の理解チェック</dt><dd>{readStats ? `${readStats.answered}/${readStats.total} 回答・正解 ${readStats.correct}` : "読解教材なし"}</dd><dt>補助練習の実施</dt><dd>{learning ? `${learning.completed}/${learning.total} ステップ` : "補助教材なし"}</dd><dt>原問の最新答案</dt><dd>{stats.answered}/{stats.total} 設問に記入</dd><dt>原問の最新自己採点</dt><dd>{stats.judged ? `正解 ${stats.correct}/${stats.judged} 採点済み設問` : "まだ採点していません"}</dd></dl></details></td><td><span className={`status ${stats.complete?"complete":""}`}>{stats.label}</span><span className="study-block">最新答案 {stats.answered}/{stats.total}</span><button className="button small" onClick={()=>onOriginal(exam.key)} aria-label={`${exam.title}の学習を開く`}>開く</button></td></tr>;
    })}</tbody></table></div>{!filtered.length&&<div className="study-empty"><h3>条件に一致する過去問がありません</h3><p>キーワードを短くするか、条件をリセットして全問を表示してください。</p><button className="button" onClick={resetFilters}>全{ORIGINALS.length}問を表示</button></div>}
    <p className="help">全設問に答案を記入し、解答例との照合を確定した問題を「解答済み」と数えます。PDFを開いただけ、練習を終えただけでは解答済みになりません。正解数は自己採点で、公式の得点率とは異なります。</p>
  </main>;
}

export function Dashboard({ data, onStart }: { data: Persisted; onStart:(id:string)=>void }) {
  const results=UNITS.map(unit=>progress(unit,data.units[unit.id]));
  const total=results.reduce((sum,item)=>sum+item.total,0),completed=results.reduce((sum,item)=>sum+item.completed,0),answered=results.reduce((sum,item)=>sum+item.answered,0),correct=results.reduce((sum,item)=>sum+item.correct,0),first=results.reduce((sum,item)=>sum+item.firstCorrect,0);
  const readingResults = READINGS.map(plan => readingProgress(plan, data.readings?.[plan.examKey]));
  const readingAnswered = readingResults.reduce((sum, item) => sum + item.answered, 0);
  const readingTotal = readingResults.reduce((sum, item) => sum + item.total, 0);
  return <main className="page study-page" id="main" tabIndex={-1}><div className="page-title"><div><h1>進捗</h1></div></div>
    <StudyStart data={data} onStart={onStart} />
    <h2>基礎・補助練習</h2><div className="metrics"><div><span>実施ステップ</span><strong>{completed}<small> / {total}</small></strong><progress value={completed} max={total}/></div><div><span>回答した問題</span><strong>{answered}</strong><small>読む・図の操作は除外</small></div><div><span>初回正解率</span><strong>{rate(first,answered)}</strong><small>{first} / {answered} 問</small></div><div><span>最新正解率</span><strong>{rate(correct,answered)}</strong><small>{correct} / {answered} 問</small></div></div>
    {READINGS.length > 0 && <section className="study-reading-stats"><h2>原文読解の進捗</h2><p>理解チェック <strong>{readingAnswered} / {readingTotal}</strong> 回答 · 原問解答済み <strong>{ORIGINALS.filter(exam => examProgress(exam, data.exams[exam.key]).complete).length} / {ORIGINALS.length}</strong> 問</p><p className="help">読解チェックは上の基礎・補助練習とは別集計です。章末の答案は原問の解答記録に含みます。</p>{READINGS.map(plan => {const exam=ORIGINALS.find(exam=>exam.key===plan.examKey)!;const stats=readingProgress(plan,data.readings?.[plan.examKey]);return <div className="study-reading-row" key={plan.examKey}><strong>{exam.title}</strong><span>{data.readings?.[plan.examKey] ? data.readings[plan.examKey].cursor === "complete" ? "最終ページ到達" : "読解の続きあり" : "読解未着手"}<small className="study-block">理解チェック {stats.answered}/{stats.total} 回答・正解 {stats.correct}</small></span><a className="button small" href={`#exam/${exam.key}`}>{data.readings?.[plan.examKey] ? data.readings[plan.examKey].cursor === "complete" ? "読み返す" : "再開" : "読み始める"}</a></div>;})}</section>}
    <div className="section-heading"><h2>テーマ別の進捗</h2><span className="muted">{THEMES.length}テーマ</span></div><div className="table-scroll study-progress-scroll" role="region" aria-label="テーマ別の進捗表・横にスクロールできます" tabIndex={0}><table><caption className="sr-only">テーマ別の基礎・補助練習と原問の進捗</caption><thead><tr><th>テーマ</th><th>基礎の実施</th><th>基礎＋補助の実施</th><th>初回正解率</th><th>最新正解率</th><th>原問解答済み</th><th>学習</th></tr></thead><tbody>{THEMES.map(theme=>{
      const units=UNITS.filter(unit=>unit.theme===theme.id),base=units.find(unit=>unit.kind==="basics");const stats=units.map(unit=>progress(unit,data.units[unit.id]));const baseStats=base?progress(base,data.units[base.id]):null;const judged=stats.reduce((sum,item)=>sum+item.answered,0);const originals=ORIGINALS.filter(exam=>exam.theme===theme.id);
      return <tr key={theme.id}><th scope="row">{theme.name}</th><td>{baseStats?`${baseStats.completed}/${baseStats.total}`:"—"}</td><td>{stats.reduce((sum,item)=>sum+item.completed,0)}/{stats.reduce((sum,item)=>sum+item.total,0)}</td><td>{rate(stats.reduce((sum,item)=>sum+item.firstCorrect,0),judged)}</td><td>{rate(stats.reduce((sum,item)=>sum+item.correct,0),judged)}</td><td>{originals.filter(exam=>examProgress(exam,data.exams[exam.key]).complete).length}/{originals.length}</td><td>{base&&<button className="button small" onClick={()=>onStart(base.id)}>開く →</button>}</td></tr>;
    })}</tbody></table></div><p className="help">初回正解率は、解き直しても変わりません。最新正解率は最後の判定結果です。同じ知識でも別コースの練習は別の問題として集計します。過去問の原問は重複なく50問で数えます。原問分割の自己判定は練習正解率から除外しています。</p>
  </main>;
}
