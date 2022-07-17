/*
 * Copyright 2021, 2022 sukawasatoru
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import DefaultHeader from "@/components/DefaultHeader";
import {retrieveDocs} from "@/function/docs";
import {readFile} from "fs/promises";
import {GetStaticPaths, GetStaticPathsResult, GetStaticProps, NextPage} from "next";
import renderToString from "next-mdx-remote/render-to-string";
import Head from "next/head";
import Link from "next/link";
import {ParsedUrlQuery} from "querystring";
import {FC, ReactElement} from "react";
import {Prism} from "react-syntax-highlighter";
import {ghcolors} from "react-syntax-highlighter/dist/cjs/styles/prism";

type Props = {
  renderedMD: string;
  stem: string;
};

const Docs: NextPage<Props> = props => {
  return <>
    <Head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml"/>
      <title>
        {props.stem} - sukawasatoru.com
      </title>
    </Head>
    <style global jsx>{`
      img, video {
        // use img tag's attribute.
        width: revert-layer;
        height: revert-layer;
      }
    `}</style>
    <section className="max-w-5xl mx-auto sm:px-6 py-8">
      <DefaultHeader/>
      <main>
        <div dangerouslySetInnerHTML={{__html: props.renderedMD}}/>
      </main>
      <footer>
        <Link href="/">
          <a className="text-sky-600 hover:underline">
            Top
          </a>
        </Link>
      </footer>
    </section>
  </>;
};

interface StaticPath extends ParsedUrlQuery {
  // [stem].tsx
  stem: string;
}

export const getStaticPaths: GetStaticPaths<StaticPath> = async () => {
  const docs = await retrieveDocs();
  const paths: GetStaticPathsResult<StaticPath>["paths"] = docs.map(value => ({
    params: {
      stem: value.stem,
    }
  }));

  return {
    paths,
    fallback: false,
  };
};

export default Docs;

export const getStaticProps: GetStaticProps<Props, StaticPath> = async context => {
  const stem = context.params!.stem;
  const docs = await retrieveDocs();
  const filepath = docs.find(value => value.stem === stem)!.filepath;
  const matterFile = (await readFile(filepath)).toString();
  const mdxSource = await renderToString(matterFile, {
    components: {
      a: (props: unknown) => <a {...props} className="text-sky-600 hover:underline"/>,
      h1: (props: unknown) => <h1 {...props} className="text-3xl text-emerald-600 font-medium tracking-wider mb-8"/>,
      h2: (props: unknown) => <h2 {...props} className="text-xl text-emerald-600 font-medium tracking-wide mt-6 mb-2"/>,
      h3: (props: unknown) => <h3 {...props} className="text-lg text-emerald-600 font-medium tracking-wide mt-6 mb-2"/>,
      inlineCode: (props: unknown) => <code {...props} className="px-1 py-0.5 bg-slate-100 rounded text-sm"/>,
      ol: (props: unknown) => <ol {...props} className="list-decimal list-outside pl-8"/>,
      ul: (props: unknown) => <ul {...props} className="list-disc list-outside pl-8"/>,
      p: (props: any) => <p {...props} className="text-base my-4"/>,
      pre: (props: any) => <Pre {...props} />,
      table: (props: unknown) => <table {...props} className="table-auto border-collapse"/>,
      th: (props: unknown) => <th {...props} className="border px-4 py-2"/>,
      td: (props: unknown) => <td {...props} className="border px-4 py-2"/>,
      // for debugging components.
      // wrapper: (props: any) => {
      //   console.log(`@ ${require("util").inspect(props, {depth: 20})}`);
      //   return <div {...props} />;
      // },
    },
  });

  return {
    props: {
      renderedMD: mdxSource.renderedOutput,
      stem,
    },
  };
};

const Pre: FC<{ children: ReactElement }> = ({children, ...rest}) => {
  const match = /language-(\w+)/.exec(children.props.className || '');
  if (children.props.originalType === 'code') {
    return <Prism
      language={match?.[1]}
      style={ghcolors}
      children={children.props.children}
      PreTag={({parentName, originalType, ...rest}) => <pre {...rest} className="sm:rounded-md bg-slate-200"/>}
    />;
  } else {
    return <pre children={children} {...rest} />;
  }
};
