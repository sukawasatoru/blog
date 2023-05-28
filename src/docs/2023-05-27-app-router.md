Blog を App Router に対応した
=============================

Next.js の App Router が Stable になった際に調べてみるとどうやら SSG に対応しているようなので Blog を Pages Router から乗り換えた。

[Getting Started: Installation | Next.js](https://nextjs.org/docs/getting-started/installation)  

この Blog を App Router に乗り換えるために幾つかの対応を行った。

Next.js v13 に対応する
----------------------

### `next build` で export する ###

静的なサイトを出力する場合 v12 までは `next build && next export` により出力していたが v13 からは next.config.js に

```javascript
config = {
  output: 'export',
};
```

を設定し `next build` コマンドのみで出力する。

### `Link` に `<a>` が不要になった ###

v13 からは `<Link href="foo/bar">Move to foo/bar/</Link>` のように `<Link>` 内に `<a>` が不要になった。

### tsconfig.json に plugins が追加される ###

手作業での変更は必要ないが Next.js を起動すると tsconfig.json に次の設定が追加される:

```json
{
  "plugins": [
    {
      "name": "next"
    }
  ]
}
```

Directory 構造の変更
--------------------

[Building Your Application: Routing | Next.js](https://nextjs.org/docs/app/building-your-application/routing)

Pages Router は /pages 以下に index.tsx を格納することで

- /pages/\_documents.tsx
- /pages/\_app.tsx
- /pages/index.tsx

を組み合わせてページ https​://example.com/ を生成する。

App Router は

- /app/layout.tsx
- /app/page.tsx

を組み合わせてページ https​://example.com/ を生成する。もしページ https​://example.com/foo/ を生成したい場合は

- /app/layout.tsx
- /app/foo/
    - page.tsx

または

- /app/foo/
    - layout.tsx
    - page.tsx

を格納する。

また、

- /app/layout.tsx
- /app/foo/
    - layout.tsx
    - page.tsx

という構成にした場合 Next.js は /app/layout.tsx -> /app/foo/layout.tsx -> /app-foo/page.tsx と複数の layout.tsx を使用しページを生成する。こういった仕組みにより共通レイアウトを簡単に実現できるようになった。

この Blog では行っていないが、もし https​://example.com/foo/ 以下と https​://example.com/piyo/ 以下で共通レイアウトを切り替えたい場合は [Routing: Routes Groups | Next.js](https://nextjs.org/docs/app/building-your-application/routing/route-groups) の仕組みを使用し

- /app/(foo)/foo/
    - layout.tsx
    - page.tsx
    - bar/
        - page.tsx
- /app/(piyo)/piyo/
    - layout.tsx
    - page.tsx
    - hoge/
        - page.tsx

といった構成にすることで https​://example.com/foo/{,bar} と https​://example.com/piyo/{,hoge} のレイアウトを分けることができる。

### app 以下に Routing から除外させたいファイルを置きたい場合 ###

Docs に記載がなく [Blog - Next.js 13.3 | Next.js](https://nextjs.org/blog/next-13-3#other-improvements) の *Opt folders out of routing* に書いているが

- /app/\_foo/
    - bar.tsx

とすると /app/\_foo/ 以下のファイルは Routing されない。

\<Head> から Metadata に乗り換え
--------------------------------

[Optimizing: Metadata | Next.js](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)  
[Functions: generateMetadata | Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

v13 からは `<Head>` がなくなり、代わりに layout.tsx または page.tsx に `export const metadata = {};` を定義する。

この Blog では /app/layout.tsx に `<title>` と RSS の設定を行った:

```tsx
export const metadata: Metadata = {
  title: 'sukawasatoru.com',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};
```

Blog の各ページのタイトルは generateMedatada を使用し

```tsx
export async function generateMetadata({params}: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const {stem} = params;
  return {
    title: `${stem} - ${(await parent).title?.absolute}`,
  };
}
```

としている。第一引数の Props は後述する `generateStaticParams()` の値で、第二引数は親の Metadatada が含まれる。ここでは /app/layout.tsx の `{title: 'sukawasatoru.com'}` の値を使用している。

GetStaticProps/GetStaticPaths から Server Component/generateStaticParams に乗り換え
-----------------------------------------------------------------------------------

generateStaticParams の前に {Client ,Server }Component について把握しておく必要がある。

### Client Component/Server Component ###

[Getting Started: React Essentials | Next.js](https://nextjs.org/docs/getting-started/react-essentials)

Client Component は従来と同じく Server で pre-render しつつ Browser で hydrate する。 Server Component は Server で render し Browser はそれを描画する。

全ての Component はデフォルト Server Component として認識される。 Client Component としたい場合はファイルに `'use client';` を設定する ([Getting Started: React Essentials | Next.js - The "use client" directive](https://nextjs.org/docs/getting-started/react-essentials#the-use-client-directive))。

Server Component は `useState` や `onClick` が使えないといった制約がある。そのためこれらの機能を使用する場合は Client Component として設定する必要がある。

この Blog では何も考えず /pages を /app に移動し `next dev` でページを表示した時にエラーが出たら、その Component を Client Component として設定した。

また Server Component には `export const revalidate = <number>;` により有効期限を設定できる ([Data Fetching: Caching | Next.js - Segment-level Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/caching#segment-level-caching))。そのほか `fetch()` の第二引数に `{next: {revalidate: <number>}}` を設定することで fetch の有効期限を設定することもできる。

この Blog は全て SSG にしたいため特に設定していない。設定しない場合 `next build` 時に全て解決される。

### generateStaticParams ###

[Functions: generateStaticParams | Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

Server Component は generateStaticParams を使用することができる。名前的には GetStaticProps の代替に思えるが GetStaticPaths の代替である。

GetStaticPaths の `{fallback: false}` は [File Conventions: Route Segment Config | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) の `export const dynamicParams = 'false';` により設定する。

### Server Component で GetStatisProps 相当の処理を行う ###

GetStaticProps に相当する関数はなくなった。 App Router では GetStaticProps 相当の処理は Server Component 内で実行すれば良い。

単純に移動して `next dev` でページを表示しエラーが出なければ問題ないが、もしエラーが出た場合 Server Component に対応していないライブラリーを使用している可能性がある。エラーが出た場合はライブラリーを更新し Server Component に対応するか、ライブラリー側が対応していない場合は処理を書き換える必要がある。

この Blog は v12 では GetStaticProps 内で Markdown を [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote) により JSX.Element に変換し `<code>` を  [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) により色をつける処理を行なっている。 next-mdx-remote は Server Component に対応しているため該当箇所を Server Component に対応するように書き換えたが React Syntax Highligher が Server Component に対応していなかった。

React Syntax Highlighter は当時なんとなくで使っていたが SSG で色をつけるなら React Syntax Highligher が内部で使用している [PrismJS](https://github.com/PrismJS/prism) を直接使用するのが良いのでは、と改めて思ったので該当処理を書き換えることで対応した。

React Syntax Highligher から PrismJS への乗り換え
-------------------------------------------------

PrismJS の使い方は簡単なので単純に書き換えるだけで大丈夫か、、と思いきや結構悩んだ。

Prism を使うだけなら `prism.highlight()` を実行するだけだがいくつかの言語に対応するためには [loadLanguages()](https://prismjs.com/#basic-usage-node) で追加のファイルを読み込む必要がある。が、 loadLanguages() するとファイルがない旨のエラーが出る (おそらく Tree Shaking が機能している為動的にファイルを読み込めない?)。

しばらく悩んだ末、次のように Wrapper を作成し Wrapper 経由で `prism.highlight()` することで問題を回避した:

```ts
// how to add new syntax.
// 1. import 'prismjs' must be first.
// 2. import each components.
// 3. relaunch dev server.

import 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-groovy';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-properties';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

export * as prism from 'prismjs';
```

RSS の生成
----------

Pages Router では /pages/feed.tsx 内で /public/feed.xml を生成することで無理やり対応しているが App Router でも同じ仕組みを使用した。

注意点としては Server Component 内から ReactDOM の [renderToStaticMarkup](https://react.dev/reference/react-dom/server/renderToStaticMarkup) を実行するとエラーになる。この問題は [vercel/next.js#43810](https://github.com/vercel/next.js/issues/43810#issuecomment-1341136525) のように動的に import すると回避できた。

Tailwind CSS を App Router にも適用する
---------------------------------------

`./src/pages/**/*.tsx` から忘れずに追従する:

```js
module.exports = {
  content: [
    './src/app/**/*.tsx',
    './src/components/**/*.tsx',
  ],
};
````

App Router 対応の全体的な変更は [1416a42...3da1799](https://github.com/sukawasatoru/blog/compare/1416a42...3da1799) になる。

- - -

timestamp  
2023-05-27 (First edition)
