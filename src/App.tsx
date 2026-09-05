import { useEffect, useState } from "react";
import { T, SANS, CSS } from "./design/tokens";
import "./design/site.css";
import { Session } from "./screens/Session";
import { Lessons, ExamTable, Dashboard } from "./screens/StudySite";
import { OriginalCourse } from "./screens/OriginalCourse";
import { UNITS, getUnit } from "./content/units";
import { ORIGINALS } from "./content/catalog";
import { freshEngine, progress } from "./engine/progress";
import { load, save, parseBackup, type Persisted, type ExamAttempt } from "./engine/storage";
import { readingFor } from "./content/readings";
import type { EngineState, Mistake } from "./engine/types";
import "./design/experience.css";
import { Sources } from "./screens/Sources";

const blank = (): Persisted => ({ version: 3, currentUnit: UNITS[0].id, units: {}, mistakes: [], selfCheck: null, exams: {}, poolSizes: Object.fromEntries(UNITS.map(unit=>[unit.id,unit.pool.length])) });
const routeFromHash = () => { try { return decodeURIComponent(location.hash.slice(1) || "lessons"); } catch { return "not-found"; } };
const navigate = (route: string) => { location.hash = encodeURI(route); };
function Icon({ name }: { name: string }) {
  const paths: Record<string,string> = { lessons: "M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4z M12 6v15", exams:"M4 3h16v18H4z M8 8h8 M8 12h8 M8 16h4", progress:"M4 20h17 M7 16v-4 M12 16V7 M17 16V3", review:"M4 8a8 8 0 1 1 0 8 M4 3v5h5 M12 7v5l3 2", settings:"M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M9 15v6" };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export default function App() {
  const [initial] = useState(() => { try { return { data: load(UNITS) ?? blank(), error: "" }; } catch { return { data: blank(), error: "保存済みデータを読み込めませんでした。元の記録は上書きしていません。設定からバックアップを読み込んでください。" }; } });
  const [data,setData] = useState(initial.data);
  const [storageError,setStorageError]=useState(initial.error);
  const [blocked,setBlocked]=useState(!!initial.error);
  const [route,setRoute]=useState(routeFromHash);
  const [returnExam,setReturnExam]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  useEffect(()=>{ const change=()=>{setRoute(routeFromHash());window.scrollTo(0,0);};window.addEventListener("hashchange",change);return()=>window.removeEventListener("hashchange",change);},[]);
  useEffect(()=>{ if(blocked)return; try {save(data);setStorageError("");} catch {setStorageError("保存できませんでした。記録はこの画面に残っています。設定からバックアップを書き出してください。");}},[data,blocked]);
  const start=(id:string,origin?:string,stepId?:string)=>{
    const original = ORIGINALS.find(exam => exam.courseId === id);
    if (!stepId && original && readingFor(original.key)) { navigate("exam/" + original.key); return; }
    setReturnExam(origin ?? null);
    const unit=getUnit(id);
    setData(previous=>{
      const state=previous.units[id]??{engine:freshEngine(unit.pool),solved:false};
      const cursor=stepId ? unit.pool.findIndex(step=>step.id===stepId) : -1;
      return {...previous,currentUnit:id,units:{...previous.units,[id]:cursor>=0?{...state,engine:{...state.engine,cursor}}:state}};
    });
    navigate("lesson/"+id+(stepId && original && readingFor(original.key) ? "?practice=1" : ""));
  };
  const openOriginal=(key:string,stage=0)=>navigate("exam/"+key+"?stage="+stage);
  const saveAttempts=(key:string,attempts:ExamAttempt[])=>setData(previous=>({...previous,exams:{...previous.exams,[key]:attempts}}));
  const download=(raw:string,filename:string)=>{const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const pageRoute=route.split("?")[0];
  const lessonId=pageRoute.startsWith("lesson/")?pageRoute.slice(7):null;
  const examKey=pageRoute.startsWith("exam/")?pageRoute.slice(5):null;
  const requestedUnit=lessonId?UNITS.find(item=>item.id===lessonId):null;
  const readingExam=requestedUnit && !new URLSearchParams(route.split("?")[1]).has("practice") ? ORIGINALS.find(exam=>exam.courseId===requestedUnit.id && readingFor(exam.key)) : undefined;
  const unit=readingExam?null:requestedUnit;
  const exam=examKey?ORIGINALS.find(item=>item.key===examKey):readingExam;
  const active=exam?"exams":lessonId?"lessons":route;
  const updateEngine=(engine:EngineState)=>{if(!unit)return;setData(previous=>({...previous,units:{...previous.units,[unit.id]:{engine,solved:progress(unit,{engine,solved:false}).finished}}}));};
  const addMistake=(mistake:Mistake)=>setData(previous=>({...previous,mistakes:[...previous.mistakes,mistake]}));
  const originalForUnit=unit?ORIGINALS.find(item=>item.courseId===unit.id):null;
  const returnKey=originalForUnit?.key??returnExam;
  const unmappedCount=Object.values(data.units).reduce((count,state)=>count+Object.keys(state.engine.legacyRecords??{}).length,0);
  return <div className={unit || exam ? "site is-studying" : "site"} style={{fontFamily:SANS,background:T.paper}}><style>{CSS}</style>
    <a className="skip-link" href="#main" onClick={event=>{event.preventDefault();document.getElementById("main")?.focus();}}>本文へ移動</a>
    <header className="site-header"><a className="brand" href="#lessons"><span className="brand-mark" aria-hidden="true">N<span>·</span></span><span>NETSTEPS</span></a><nav aria-label="メインナビゲーション">{[["lessons","学習"],["exams","過去問"],["progress","進捗"],["review","復習"],["settings","設定"]].map(([key,label])=><a key={key} href={`#${key}`} aria-label={label} title={label} aria-current={active===key?"page":undefined}><Icon name={key}/><span>{label}</span></a>)}</nav></header>
    {storageError&&<div className="storage-warning" role="alert">{storageError}<a href="#settings">設定を開く</a></div>}
    {unmappedCount>0&&<div className="storage-warning" role="status">旧教材との対応を確定できない記録が{unmappedCount}件あります。元データは保管していますが、別の問題の回答として誤集計しないよう進捗から除外しています。<a href="#settings">バックアップを書き出す</a></div>}
    {unit?<Session key={unit.id} unit={unit} engine={data.units[unit.id]?.engine??freshEngine(unit.pool)} setEngine={updateEngine} onSolved={()=>{setMessage("レッスンの実施を記録しました。正解率は進捗で確認できます。");returnKey?openOriginal(returnKey,3):navigate("progress");}} onClose={()=>returnKey?openOriginal(returnKey):navigate("lessons")} addMistake={addMistake} onSelf={selfCheck=>setData(previous=>({...previous,selfCheck}))} onOriginal={returnKey?()=>openOriginal(returnKey,3):undefined}/>:
    exam?<OriginalCourse key={exam.key} examKey={exam.key} attempts={data.exams[exam.key]??[]} practice={data.exams[exam.key+"/practice"]??[]} onSave={attempts=>saveAttempts(exam.key,attempts)} onPractice={attempts=>saveAttempts(exam.key+"/practice",attempts)} onStart={(id,stepId)=>start(id,exam.key,stepId)} learning={data.units[exam.courseId]} reading={data.readings?.[exam.key]} onReading={state=>setData(previous=>({...previous,readings:{...previous.readings,[exam.key]:state}}))} onBack={()=>navigate("exams")}/>:
    route==="lessons"?<Lessons data={data} onStart={id=>{setReturnExam(null);start(id);}} onOriginal={openOriginal}/>:
    route==="exams"?<ExamTable data={data} onOriginal={openOriginal} onStart={start}/>:
    route==="progress"?<Dashboard data={data} onStart={start}/>:
    route==="review"?<main className="page" id="main" tabIndex={-1}><div className="page-title"><div><h1>復習</h1><p>{data.mistakes.filter(item=>!item.reviewed).length} 件の問題を振り返れます。</p></div></div>{!data.mistakes.length&&<div className="empty"><p>今は復習する問題がありません。学習中に間違えた問題が、ここに集まります。</p><a className="button primary" href="#lessons">学習へ進む →</a></div>}{data.mistakes.slice().reverse().map(item=><details className="review-item" key={item.key}><summary>{item.reviewed?"✓ ":"○ "}{item.title}</summary><p>あなたの回答：{item.your}</p><p>正解：{item.correct}</p><p>{item.explain}</p><button className="button" onClick={()=>setData(previous=>({...previous,mistakes:previous.mistakes.map(entry=>entry.key===item.key?{...entry,reviewed:!entry.reviewed}:entry)}))}>{item.reviewed?"未確認に戻す":"確認済みにする"}</button></details>)}</main>:
    route==="sources"?<Sources/>:
    route==="settings"?<main className="page settings-page" id="main" tabIndex={-1}><div className="page-title"><div><span className="eyebrow">DATA & PUBLICATION</span><h1>記録と公開について</h1></div></div><section><h2>学習記録のバックアップ</h2><p>記録はこのブラウザ内に保存されます。ログインや端末間同期はありません。公開URLへ移る前、ブラウザのデータを消す前に、書き出してください。</p><div className="inline-actions"><button className="button primary" onClick={()=>download(JSON.stringify(data,null,2),`netsteps-${new Date().toISOString().slice(0,10)}.json`)}>記録を書き出す</button><label className="button">バックアップを読み込む<input className="file-input" type="file" accept=".json,application/json" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>20_000_000)throw new Error("ファイルが大きすぎます。");const imported=parseBackup(await file.text(),UNITS);if(!window.confirm("現在の記録を読み込んだバックアップに置き換えます。必要な記録は先に書き出してください。"))return;setData(imported);setBlocked(false);setMessage("バックアップを読み込みました。");}catch(error){setMessage(error instanceof Error?error.message:"読込みに失敗しました。");}event.target.value="";}}/></label>{blocked&&<button className="button" onClick={()=>{try{download(localStorage.getItem("netsteps-v3")??localStorage.getItem("netsteps-v2")??"{}","netsteps-recovery.json");}catch{setMessage("ブラウザが保存領域へのアクセスを拒否しています。");}}}>元の保存データを救出</button>}</div></section><section><h2>このサイトについて</h2><p>NetStepsは個人制作の学習サイトです。IPAの公式サービスではありません。</p><a href="#sources">出典・利用について</a></section></main>:
    <main className="page" id="main" tabIndex={-1}><h1>ページが見つかりません</h1><a href="#lessons">学習一覧へ</a></main>}
    {message&&<div className="toast" role="status">{message}<button aria-label="通知を閉じる" onClick={()=>setMessage("")}>×</button></div>}
    <footer className="site-footer"><a href="#sources">出典・利用について</a><span>非公式教材 · 解説・練習問題は独自作成</span></footer>
  </div>;
}
