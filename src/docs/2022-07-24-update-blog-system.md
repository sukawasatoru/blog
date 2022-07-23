Tailwind UI への乗り換えと Blog システムの更新
==============================================

Tailwind UI は [Tailwind CSS](https://tailwindcss.com) を使用して作られたデザインテンプレート集です。 MUI や Fluent UI のように React Component として提供されているのではなく、こういった Component を作るためには この HTML にこういった CSS の Class を組み合わせる、といったコードのサンプルが提供されます。

Tailwind CSS は CSS Framework です。所感として拡張性を重視されており細かい箇所まで制御できそうです。 CSS の Class を組み合わせて自作の Component を作らないといけないためある程度記述量は増えますが、 Component Library を使うとよくある、この箇所のデザインを変えたいので Hack 的なコードを書く必要がある、といったことをしなくて良い点に好感が持てました。

今回はこの点に興味があったため導入してみました。

Tailwind CSS のセットアップ
---------------------------

Tailwind UI は Tailwind CSS を使用しているためまず Tailwind CSS を導入する必要があります。ドキュメントは充実しており、たとえば Next.js に導入したい場合は [Installation: Tailwind CLI - Tailwind CSS](https://tailwindcss.com/docs/installation) の *Framework Guides* タブから *Next.js* を選択し順番になぞっていけば導入できます。

追加の手順として *postcss.config.js* を作成します:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

またドキュメントで追記した globals.css を \_app.tsx で import します:

```tsx
import "@/style/global.css"
import {AppProps} from "next/app";
import {FC} from "react";

const MyApp: FC<AppProps> = ({Component, pageProps}) => {
  return <Component {...pageProps} />;
};

export default MyApp;
```

そのほかデフォルト設定だと `next dev` 実行時に Tailwind CSS が minify されるため開発時には都度 `next dev` を実行する必要があります。これを回避するために tailwind.config.js に *safelist* を追加します:

```js
module.exports = {
  content: [
    "./src/pages/**/*.{jsx,tsx}",
    "./src/components/**/*.{jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    process.env.NODE_ENV === "development" && {pattern: /.*/},
  ].filter(data => data),
}
```

Tailwind UI を Next.js に導入する場合は [Documentation - Tailwind UI Using React](https://tailwindui.com/documentation#using-react) を参考に追加で `@headlessui/react` と `@heroicons/react` を *package.json* を更新します。

そのほか
--------

既存の Library が古かったため Tailwind CSS を導入する際に依存の問題が発生したためこれを機に各種 Library を更新しました。全体的な変更は [ed6b92a...f657de8](https://github.com/sukawasatoru/blog/compare/ed6b92a...f657de8) になります。

### Next.js の更新と Wasm のバグ ###

Next.js v10.0 から v12.2 に更新したところ `next build` する際に Wasm が参照できないためエラーが発生するようになりました。

こちらの問題は Next.js が使用している Webpack v4 が v5 に更新された為によるもので [Webpack 5 breaks dynamic wasm import for SSR · Issue #25852 · vercel/next.js](https://github.com/vercel/next.js/issues/25852#issuecomment-1057059000) を参考にビルド時に *.next* 以下に symlink を作成する Workaround を追加しました:

```javascript
const {access, symlink} = require("fs/promises");

/** @type {import('next').NextConfig} */
const config = {
  // snip.
  webpack: (config, options) => {
    config.experiments.syncWebAssembly = true;

    if (options.isServer) {
      // snip.

      // https://github.com/vercel/next.js/issues/25852#issuecomment-1057059000
      config.plugins.push(
        new (class {
          apply(compiler) {
            compiler.hooks.afterEmit.tapPromise(
              'SymlinkWebpackPlugin',
              async (compiler) => {
                const from = `${compiler.options.output.path}/../static`;
                const to = `${compiler.options.output.path}/static`;

                try {
                  await access(from);
                  console.log(`${from} already exists`);
                } catch (error) {
                  if (error.code === 'ENOENT') {
                    // No link exists

                    await symlink(to, from, 'junction');
                    console.log(`created symlink ${from} -> ${to}`);
                  } else {
                    throw error;
                  }
                }
              },
            );
          }
        })(),
      );

    return config;
  },
}
```

### next-mdx-remote の更新と MDX の対応 ###

next-mdx-remote を v2.1 から 4.0 へ更新した際に Markdown をビルドできなくなりました。

まず GFM が使えなくなった為 `remark-gfm` を *package.json* に追加します。また Markdown の Serialize の API が `renderToString()` から `serialize()` へ更新されている為合わせて更新します。 `serialize()` は `<MDXRemote>` で使用する object を出力する為従来の挙動と同等になるよう *getStaticProps* で HTML に変換するようにしました:

```ts
import {retrieveDocs} from "@/function/docs";
import {readFile} from "fs/promises";
import {GetStaticProps} from "next";
import {MDXRemote} from "next-mdx-remote";
import {serialize} from "next-mdx-remote/serialize";
import {FC} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {Prism} from "react-syntax-highlighter";
import {ghcolors} from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm"

export const getStaticProps: GetStaticProps<Props, StaticPath> = async (context) => {
  const stem = context.params!.stem;
  const docs = await retrieveDocs();
  const doc = docs.find(value => value.stem === stem)!;
  const matterFile = (await readFile(doc.filepath)).toString();
  const mdxSource = await serialize(matterFile, {
    mdxOptions: {
      development: process.env.NODE_ENV === "development",
      remarkPlugins: [
        remarkGfm,
      ],
      format: doc.extension,
    },
  });

  const rendered = renderToStaticMarkup(<MDXRemote {...mdxSource} components={{
  	// snip.
    code: (props: any) => <code {...props} className="px-1 py-0.5 bg-slate-100 rounded text-sm"/>,
    pre: (props: any) => <Pre {...props} />,
  }}/>);

  return {
    props: {
      rendered,
      stem,
    },
  };
};

const Pre: FC<{ children: { props: { className?: string; children: string } } }> = ({children}) => {
  const match = /language-(\w+)/.exec(children.props.className || '');
  return <Prism
    language={match?.[1]}
    style={ghcolors}
    children={children.props.children}
    PreTag={(rest) => <pre {...rest} className='sm:rounded-md bg-slate-200'/>}
  />;
};
```

*md* と *mdx* が区別されるようになり `format: "md"` で Serialize すると Markdown 内で `<img>` や `<video>` タグが使えないようになりました。その為該当する Markdown を `format: "mdx"` で Serialize するようにし [What is MDX? | MDX - Markdown](https://mdxjs.com/docs/what-is-mdx/#markdown) の通り `<` と `{` を Escape する必要があります。

### Stork Search の更新と stork-builder の更新 ###

サイト内検索に使用している Stork Search ([2021-02-11-wasm](/docs/2021-02-11-wasm)) を v1.0 から v1.5 に更新しました。また Crate 名が `stork-search` から `stork-lib` に変わりました。

また Index 作成の API に使用する Config が Private になった為 Toml を String で作成してから `Config::try_from(&str)` とする必要があります:

```rust
#[tokio::main]
async fn main() -> Fallible<()> {
	// snip.

    let mut stork_config = StorkConfig {
        input: InputConfig {
            base_directory: out_dir
                .to_str()
                .with_context(|| format!("out_dir.to_str: {:?}", out_dir))?
                .to_string(),
            stemming: "None".into(),
            files: vec![],
            minimum_indexed_substring_length: 2,
        },
    };

    // snip.

    let index = build_index(&Config::try_from(toml::to_string(&stork_config)?.as_str())?)?;
    info!(?index.description);
    let mut writer = BufWriter::new(File::create(&opt.out).await?);
    writer.write_all(&index.bytes).await?;
    writer.flush().await?;

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct StorkFile {
    pub title: String,
    pub url: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct InputConfig {
    pub base_directory: String,
    pub stemming: String,
    pub minimum_indexed_substring_length: u8,
    pub files: Vec<StorkFile>,
}

/// https://stork-search.net/docs/config-ref
#[derive(Serialize)]
pub struct StorkConfig {
    pub input: InputConfig,
}
```

- - -

timestamp  
2022-07-24 (First edition)
