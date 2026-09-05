import { useState } from "react";
import type { ExamDef } from "../engine/types";

export const assetUrl = (path: string) => path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;

export function OfficialExam({ official, compact }: { official: NonNullable<ExamDef["official"]>; compact?: boolean }) {
  const [page, setPage] = useState(0);
  const index = Math.min(page, official.pages.length - 1);
  const source = assetUrl(official.pages[index]);
  return <section className={`official-document ${compact ? "compact" : ""}`} aria-label={official.label}>
    <div className="document-heading"><span className="source-label">IPA 原問</span><span>{official.label}</span></div>
    <div className="document-tools">
      <button className="button" aria-label="前の原問ページ" disabled={index === 0} onClick={() => setPage(index - 1)}>←</button>
      <label>ページ <select value={index} onChange={event => setPage(Number(event.target.value))}>{official.pages.map((_, position) => <option key={position} value={position}>{position+1} / {official.pages.length}</option>)}</select></label>
      <button className="button" aria-label="次の原問ページ" disabled={index === official.pages.length-1} onClick={() => setPage(index+1)}>→</button>
      <a href={source} target="_blank" rel="noreferrer">原寸で開く ↗</a>
    </div>
    {source.includes(".pdf") ? <iframe src={source} title={official.label} /> : <a href={source} target="_blank" rel="noreferrer" aria-label="原問ページを拡大"><img src={source} alt={`${official.label}・${index+1}ページ`} loading="lazy" /></a>}
    <div className="document-links"><a href={official.url} target="_blank" rel="noreferrer">公式PDF ↗</a>{official.answerUrl && <a href={official.answerUrl} target="_blank" rel="noreferrer">公式解答例PDF ↗</a>}<small>PDFを画像化・抜粋して表示</small><a href="#sources">出典・加工内容</a></div>
  </section>;
}

export function OfficialPeek({ official }: { official: NonNullable<ExamDef["official"]> }) {
  return <details className="source-details"><summary>原文・原図を参照する</summary><OfficialExam official={official} /></details>;
}

export function SourceRegion({ region, label }: { region: { src: string; top: number; bottom: number; page: number }; label: string }) {
  const [ratio, setRatio] = useState(1.414);
  return <figure className="source-region">
    <a href={assetUrl(region.src)} target="_blank" rel="noreferrer" aria-label={`${label}の原ページを開く`}>
      <svg viewBox={`0 ${region.top * ratio * 1000} 1000 ${(region.bottom - region.top) * ratio * 1000}`} role="img" aria-label={label}>
        <image href={assetUrl(region.src)} width="1000" height={ratio*1000} />
      </svg>
      <img hidden src={assetUrl(region.src)} alt="" onLoad={event => setRatio(event.currentTarget.naturalHeight/event.currentTarget.naturalWidth)} />
    </a>
    <figcaption>{label} · 問題冊子 {region.page}ページ（クリックでページ全体）</figcaption>
  </figure>;
}
