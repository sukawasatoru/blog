Next.js で RSS を SSG で生成する
================================

ここ数年で更新通知に Twitter が利用されることが多くなり RSS に対応しているサービスが少なくなってきていますが、私は iPhone の [Reeder](https://apps.apple.com/jp/app/reeder-5/id1529445840) によく見るサイトの RSS を登録しておき移動中に閲覧するといった使い方をしています。まだ需要があるという人もそれなりにいるのではないでしょうか。

そんな RSS ですが、普及して欲しいと思っている割には自分のサイトは未対応でしたので Next.js の SSG の機能に細工をして自動生成するようにしてみました。

RSS を生成する CLI を作成する
-----------------------------

RSS は XML の専用のフォーマットが定められているため何も考えずに Next.js で書いた場合 `<html>` タグがついてしまったり、 RSS のフォーマットで出力することができません。それを回避するために *getServerProps* を使う方法があるのですが GitHub Pages に静的に Commit したいので、その場合 *getServerProps* は使えません。そのほか \_app.tsx や \_document.tsx に手を加えたらできないことはないと思いますが、大掛かりになりそうでしたので CLI 版を作成しました。

構成は ts-node を使用して TypeScript で実装を行い yargs で CLI の引数を Parse します。 RSS に使用する情報は [以前作成した Wasm](/docs/2021-02-11-wasm) を CommonJS で読み込めるように出力するようにして、、とすることで実装できましたが何か冗長な感じが拭えません。
 
 [Add RSS support · sukawasatoru/blog@12d3f67](https://github.com/sukawasatoru/blog/commit/12d3f674695068f3b3871d497672b103eb0a6a8c)

 もっと単純に実装できないでしょうか

Next.js の getStaticProps で RSS を生成する
-------------------------------------------

ここでふと src/pages/feed.tsx を作成し、その *getStaticProps* で public/feed.xml に *fs.writeFile* してしまい FunctionComponent からは `<meta http-equiv="refresh">` を使って /feed.xml に Redirect すればいいんじゃないか、ということを思いついたのでおもむろに試したら動きました。

この方法であれば writeFile に何となくすっきりしないものを感じますが Wasm を CommonJS で出力するようにしたり CLI を追加することなく feed.tsx をあたらに実装するだけで RSS を生成することができます。

```typescript
// src/pages/feed.tsx
const Feed: FunctionComponent = () => {
  return <Head>
    <meta httpEquiv="refresh" content="0; url=/feed.xml"/>
    <title>redirect to feed.xml</title>
  </Head>;
};

export const getStaticProps: GetStaticProps = async () => {
  const baseUrl = `https://example.com`;

  // 以前 Wasm で作った Markdown parser
  const entries = (await retrieveDocs())
    .sort((a, b) => Temporal.PlainDate.compare(b.firstEdition, a.firstEdition));

  let buf = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>sukawasatoru.com</title>
    <link>${baseUrl}</link>
    <description>My description</description>
    <lastBuildDate>${new Date()}</lastBuildDate>
`;

  for (const entry of entries) {
    const target = `${baseUrl}/docs/${entry.stem}`;
    const mdxSource = await renderToString((await readFile(entry.filepath)).toString());

    buf += `    <item>
      <title>${entry.title}</title>
      <link>${target}</link>
      <guid>${target}</guid>
      <description><![CDATA[${mdxSource.renderedOutput}]]></description>
      <pubDate>${new Date(entry.firstEdition.toString())}</pubDate>
    </item>
`;
  }

  buf += `  </channel>
</rss>`;

  await writeFile(`${process.cwd()}/public/feed.xml`, buf);
  return {
    props: {},
  };
};
```

いまのところこれで困ったことはなさそうですので、しばらくはこの仕組みを使って RSS を生成したいと思います。

- - -

timestamp  
2021-02-15 (First edition)
