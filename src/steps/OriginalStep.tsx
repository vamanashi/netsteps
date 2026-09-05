import { useState } from "react";
import { ORIGINALS } from "../content/catalog";
import { SourceRegion, OfficialPeek, OfficialExam } from "../components/OfficialExam";
import { useSubmission } from "../engine/Submission";
import type { OriginalStepT, StepRecord } from "../engine/types";
import type { OnDone } from "./BasicSteps";

export function OriginalStep({ step, record, onDone }: { step: OriginalStepT; record?: StepRecord; onDone: OnDone }) {
  const exam = ORIGINALS.find(exam => exam.key === step.examKey)!;
  const item = exam.items.find(item => item.id === step.itemId)!;
  const persist = useSubmission();
  const saved = record?.data as { text?: string; judgment?: string } | undefined;
  const [text,setText] = useState(saved?.text ?? "");
  const [show,setShow] = useState(!!record);
  const [judgment,setJudgment] = useState(saved?.judgment ?? "");
  const decide = (result: string) => { setJudgment(result); persist(result === "correct", { text, judgment: result }); };
  return <div><span className="source-label">IPA 原問の一部分 / {item.label}</span><h2 style={{marginTop:16}}>{step.title}</h2><p>対象は{item.label}です。ほかの小問が写っていても、今はこの小問だけを考えます。必要な条件・図は「原文・原図を参照する」から確認できます。</p>
    {item.regions.map((region,index)=><SourceRegion key={index} region={region} label={`${exam.title} ${item.label}を含む原文`} />)}
    <OfficialPeek official={exam.official} />
    <label className="answer-label" htmlFor="guided-answer">あなたの解答</label><textarea id="guided-answer" value={text} readOnly={!!record} onChange={event=>setText(event.target.value)} rows={4}/>
    {!show&&<div className="inline-actions"><button className="button" onClick={()=>setShow(true)}>解答例を確認する</button><button className="text-button" onClick={()=>{setText("解答できなかった");setShow(true);}}>いまは解答できない</button></div>}
    {show&&<div className="answer-reference"><h3>公式解答例</h3><pre>{item.answerIsDiagram?"図による解答です。原ページの該当する設問番号を確認してください。":item.answer}</pre><details open={item.answerIsDiagram}><summary>解答例の原図・表を確認する</summary><OfficialExam official={{label:`${exam.title}を含む公式解答例`,pages:exam.answerPages,url:exam.official.answerUrl}} /></details><p className="help">自動採点は行いません。字数、複数回答の指定、本文の条件を解答例と照合します。練習正解率と原問の解答済み件数には含めず、実施ステップとして記録します。</p><fieldset disabled={!!record || !text.trim()}><legend>自己判定</legend>{[["correct","正解"],["partial","部分正解"],["incorrect","不正解"]].map(([value,label])=><label key={value}><input type="radio" name="guided-judgment" checked={judgment===value} onChange={()=>decide(value)}/>{label}</label>)}</fieldset></div>}
    <div className="inline-actions"><button className="button primary" disabled={!judgment} onClick={()=>onDone(judgment==="correct",{text,judgment})}>次へ →</button></div>
  </div>;
}
