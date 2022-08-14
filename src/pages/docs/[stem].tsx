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

import {readFile} from 'fs/promises';
import {ParsedUrlQuery} from 'querystring';
import clsx from 'clsx';
import {GetStaticPaths, GetStaticPathsResult, GetStaticProps, NextPage} from 'next';
import {MDXRemote} from 'next-mdx-remote';
import {serialize} from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Link from 'next/link';
import {FC, ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Prism} from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';
import DefaultHeader from '@/components/DefaultHeader';
import {retrieveDocs} from '@/function/docs';

type Props = {
  rendered: string;
  stem: string;
};

const Docs: NextPage<Props> = ({rendered, stem}) => {
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
  const paths: GetStaticPathsResult<StaticPath>['paths'] = docs.map(value => ({
    params: {
      stem: value.stem,
    },
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
      development: process.env.NODE_ENV === 'development',
      remarkPlugins: [
        remarkGfm,
      ],
      format: doc.extension,
    },
  });

  const rendered = renderToStaticMarkup(<MDXRemote {...mdxSource} components={{
    a: ({children, ...props}) => <a {...props} className="text-sky-600 hover:underline">{children}</a>,
    h1: ({children, ...props}) =>
      <h1 {...props} className="text-3xl text-emerald-600 font-medium tracking-wider mb-8">{children}</h1>,
    h2: ({children, ...props}) =>
      <h2 {...props} className="text-2xl text-emerald-600 font-medium tracking-wide mt-6 mb-2">{children}</h2>,
    h3: ({children, ...props}) =>
      <h3 {...props} className="text-lg text-emerald-600 font-medium tracking-wide mt-6 mb-2">{children}</h3>,
    code: ({children, ...props}) =>
      <code {...props} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-sm">{children}</code>,
    ol: ({children, ...props}) => <ol {...props} className="list-decimal list-outside pl-8">{children}</ol>,
    ul: ({children, ...props}) => <ul {...props} className="list-disc list-outside pl-8">{children}</ul>,
    p: ({children, ...props}) => <p {...props} className="text-base my-4">{children}</p>,
    pre: ({children, ...props}) => <Pre {...props}>{children}</Pre>,
    table: ({children, ...props}) => <table {...props} className="table-auto border-collapse">{children}</table>,
    th: ({children, ...props}) => <th {...props} className="border px-4 py-2">{children}</th>,
    td: ({children, ...props}) => <td {...props} className="border px-4 py-2">{children}</td>,
  }}/>);

  return {
    props: {
      rendered,
      stem,
    },
  };
};

const Pre: FC<{ children: ReactNode }> = ({children}) => {
  const c = children as { props: { className?: string; children: string } };
  const match = /language-(\w+)/.exec(c.props.className || '');
  return <Prism
    language={match?.[1]}
    style={{}}
    PreTag={(rest) => <pre {...rest} className={clsx(c.props.className, 'sm:rounded-md bg-slate-200')} style={{backgroundColor: ''}}/>}
  >
    {c.props.children}
  </Prism>;
};
