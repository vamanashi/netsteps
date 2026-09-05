import { UNITS } from "../content/units";
import { WORKSHOPS } from "../content/workshops";

const references = [...new Set([
  ...UNITS.flatMap(unit => unit.pool.flatMap(step => step.source?.url ? [step.source.url] : [])),
  ...WORKSHOPS.flatMap(workshop => workshop.verifiedSources),
])].sort();

export function Sources() {
  return <main className="page settings-page" id="main" tabIndex={-1}>
    <h1>出典・利用について</h1>
    <section><h2>IPAの試験問題</h2>
      <p>出典：独立行政法人情報処理推進機構（IPA）の情報処理技術者試験。各問題に年度・期・試験名・区分・問番号と参照先を表示しています。応用情報技術者試験の問題も含みます。</p>
      <p>午後問題の原文・原図・公式解答例は、<a href="https://www.ipa.go.jp/shiken/mondai-kaiotu/index.html" target="_blank" rel="noreferrer">IPAの公開資料</a>を使用しています。個別の公式PDFは各過去問から開けます。</p>
      <p>試験問題の著作権はIPAに帰属します。利用条件は<a href="https://www.ipa.go.jp/shiken/faq.html" target="_blank" rel="noreferrer">IPAのFAQ（試験問題の利用）</a>を参照してください。</p>
    </section>
    <section><h2>加工・独自作成の範囲</h2>
      <ul>
        <li>原文：必要な箇所を抜粋し、改行・字間を調整。一部は文脈を再掲しています。</li>
        <li>原図：PDFから画像化・切り出し・拡大縮小しています。</li>
        <li>午前過去問：選択肢の順序・記号を変更し、表示形式を調整しています。学習用に再作成した図表は原図と区別しています。</li>
        <li>段階練習・確認問題：原問の条件や設問を基に、NetStepsが学習用に再構成しています。</li>
        <li>基礎問題・解説・学習用の図：NetStepsが独自に作成しています。公式解説ではありません。</li>
      </ul>
      <p>本サイトはIPAの公式サイトではなく、IPAの監修・推奨を受けたものではありません。加工内容・解説の責任はNetStepsにあります。正確な出題内容は公式PDFで確認してください。</p>
    </section>
    <section><h2>参考資料</h2><p>以下のWeb資料を問題の照合や教材作成の参考にしています。各サイトの解説文・書籍のサンプルページを転載するものではありません。リンク先の利用条件は各サイトに従ってください。</p>
      <details><summary>参照先一覧（{references.length}件）</summary><ul className="reference-list">{references.map(url => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul></details>
    </section>
    <section><h2>学習記録</h2><p>答案・進捗はこのブラウザ内に保存されます。ログイン、端末間同期、アクセス解析はありません。ホスティング先のGitHubは、配信のためにIPアドレスなどのアクセス情報を取得することがあります。</p><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHubのプライバシー声明 ↗</a></section>
  </main>;
}
