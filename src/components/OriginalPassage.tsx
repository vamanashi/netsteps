import { useState, type ReactNode } from "react";
import type { Original } from "../content/catalog";
import type { OriginalParagraph, OriginalPassage as Passage } from "../content/readings";
import { SourceRegion } from "./OfficialExam";

function OriginalText({ paragraph }: { paragraph: OriginalParagraph }) {
  const segments: ReactNode[] = [];
  let offset = 0;
  const ranges = (paragraph.underlines ?? []).map(text => ({ text, start: paragraph.text.indexOf(text) })).filter(range => range.start >= 0).sort((left, right) => left.start - right.start);
  for (const range of ranges) {
    segments.push(paragraph.text.slice(offset, range.start), <u key={range.start}>{range.text}</u>);
    offset = range.start + range.text.length;
  }
  segments.push(paragraph.text.slice(offset));
  return <>{segments}</>;
}

export function OriginalPassage({ passage, exam, original }: { passage: Passage; exam: Original; original?: ReactNode }) {
  const [zoom, setZoom] = useState(false);
  const hasFigures = passage.blocks.some(block => block.type === "figure");
  const pages = [...new Set(passage.blocks.flatMap(block => block.type === "text" ? block.pages : [block.page]))].sort((left, right) => left - right);
  const contextPages = [...new Set((passage.context ?? []).flatMap(paragraph => paragraph.pages))].sort((left, right) => left - right);
  return <section className={`reading-excerpts original-passage ${zoom ? "is-zoomed" : ""}`} aria-label="IPAの原文">
    {hasFigures && <div className="reading-source-tools"><button className="text-button" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? "図を幅に合わせる" : "図を拡大"}</button></div>}
    {!!passage.context?.length && <aside className="reading-context" aria-label="前の文脈（原文の再掲）"><strong>前の文脈（原文の再掲）</strong>{passage.context.map((paragraph, index) => <p key={index}><OriginalText paragraph={paragraph} /></p>)}<small className="original-page">問題冊子 p.{contextPages.join("・")}</small></aside>}
    <div className="original-frame">
      <div className="original-frame-heading"><span>IPA 問題冊子の原文</span><small>表記・空欄・下線を保持</small></div>
      <div className="original-blocks">{passage.blocks.map((block, index) => block.type === "text"
        ? <p className="original-paragraph" key={index}><OriginalText paragraph={block} /></p>
        : <SourceRegion key={index} region={{ ...block, src: exam.official.pages[block.page - exam.startPage] }} label={block.caption} />)}</div>
      <small className="original-page original-frame-source"><a href={exam.official.url} target="_blank" rel="noreferrer">{exam.official.label}</a> · p.{pages.join("・")}<br />抜粋・改行調整／図表は原画像の切り出し</small>
    </div>
    {original && <details className="original-scan"><summary>PDF</summary>{original}</details>}
  </section>;
}
