export function Attribution({ label, url, mode, figures = false }: {
  label: string; url?: string; mode: "original" | "adapted" | "past"; figures?: boolean;
}) {
  const heading = mode === "original" ? "IPA原文・原図" : mode === "past" ? "IPA過去問 · 選択肢順を変更" : "過去問を基に作成";
  return <aside className={`attribution attribution-${mode}`} aria-label="教材の出典">
    <strong>{heading}{mode === "past" && figures ? " · 図表を再作成" : ""}</strong>
    <div>{label.replace(/^出典[：:]\s*/, "")}{url && <> · <a href={url} target="_blank" rel="noreferrer">出典 ↗</a></>}</div>
    <details><summary>加工内容</summary><p>{mode === "original"
      ? "問題冊子から抜粋し、本文の改行・字間を画面に合わせて調整しています。図表は原画像の切り出しです。前の文脈は必要に応じて再掲しています。"
      : mode === "past"
        ? `出題時と選択肢の順序・記号が異なります。画面に合わせて表記・レイアウトを調整しています。${figures ? "添付の学習用の図表はNetStepsが作成・再構成したもので、原図ではありません。" : ""}解説はNetStepsが独自に作成しています。`
        : "原問を基に、設問・選択肢・条件・解説を学習用に再構成しています。学習用の図は独自に作成しています。IPA原文・原図と表示した箇所は問題冊子からの抜粋です。"}</p><a href="#sources">出典・利用について</a></details>
  </aside>;
}
