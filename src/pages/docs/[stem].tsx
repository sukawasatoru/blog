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
import {MDXRemote} from "next-mdx-remote";
import {serialize} from "next-mdx-remote/serialize";
import Head from "next/head";
import Link from "next/link";
import {ParsedUrlQuery} from "querystring";
import {FC} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {Prism} from "react-syntax-highlighter";
import {ghcolors} from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm"

type Props = {
  rendered: string;
  stem: string;
};

const Docs: NextPage<Props> = ({rendered, stem}) => {
  return <>
    <Head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml"/>
      <title>
        {stem} - sukawasatoru.com
      </title>
    </Head>
    <style jsx global>{`
      img, video {
        display: inline;

        // use img tag's attribute.
        width: revert-layer;
        height: revert-layer;
      }
    `}</style>
    <div className="container mx-auto max-w-5xl sm:px-6 py-8">
      <DefaultHeader/>
      <main dangerouslySetInnerHTML={{__html: rendered}}/>
      <footer>
        <Link href="/">
          <a className="text-sky-600 hover:underline">
            Top
          </a>
        </Link>
      </footer>
    </div>
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
    a: (props: any) => <a {...props} className="text-sky-600 hover:underline"/>,
    h1: (props: any) => <h1 {...props} className="text-3xl text-emerald-600 font-medium tracking-wider mb-8"/>,
    h2: (props: any) => <h2 {...props} className="text-xl text-emerald-600 font-medium tracking-wide mt-6 mb-2"/>,
    h3: (props: any) => <h3 {...props} className="text-lg text-emerald-600 font-medium tracking-wide mt-6 mb-2"/>,
    code: (props: any) => <code {...props} className="px-1 py-0.5 bg-slate-100 rounded text-sm"/>,
    ol: (props: any) => <ol {...props} className="list-decimal list-outside pl-8"/>,
    ul: (props: any) => <ul {...props} className="list-disc list-outside pl-8"/>,
    p: (props: any) => <p {...props} className="text-base my-4"/>,
    pre: (props: any) => <Pre {...props} />,
    table: (props: any) => <table {...props} className="table-auto border-collapse"/>,
    th: (props: any) => <th {...props} className="border px-4 py-2"/>,
    td: (props: any) => <td {...props} className="border px-4 py-2"/>,
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
