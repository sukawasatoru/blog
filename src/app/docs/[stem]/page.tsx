/*
 * Copyright 2021, 2022, 2023 sukawasatoru
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
import clsx from 'clsx';
import {MeiliSearch} from 'meilisearch';
import {Metadata, ResolvingMetadata} from 'next';
import Link from 'next/link';
import {compileMDX} from 'next-mdx-remote/rsc';
import {FC, JSX, ReactElement, ReactNode} from 'react';
import remarkGfm from 'remark-gfm';
import {prism} from '@/app/docs/[stem]/_util/prism-wrapper';
import {DocEntry, retrieveDocs} from '@/function/docs';
import {meilisearchBaseUrl, meilisearchCIAPIKey, meilisearchIndexUid} from '@/model/configuration';
import {MeiliBlogDocEntry} from '@/model/meili-blog-doc-entry';

interface Props {
  params: {
    stem: string;
  };
}

export const dynamicParams = false;

export async function generateStaticParams(): Promise<Array<Props['params']>> {
  const docs = await retrieveDocs();
  return docs.map(value => ({stem: value.stem}));
}

export async function generateMetadata({params}: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const {stem} = params;
  return {
    title: `${stem} - ${(await parent).title?.absolute}`,
  };
}

export default async function Docs({params}: Props): Promise<JSX.Element> {
  const {stem} = params;

  const rendered = await renderPage(stem);
  return <>
    <main>
      {rendered}
    </main>
    <footer>
      <Link className="text-sky-600 hover:underline" href="/">
        Top
      </Link>
    </footer>
  </>;
}

async function renderPage(stem: string): Promise<ReactElement> {
  const docs = await retrieveDocs();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const doc = docs.find(value => value.stem === stem)!;
  const matterFile = (await readFile(doc.filepath)).toString();

  await updateMeilisearchDocument(doc, matterFile);

  const {content} = await compileMDX({
    source: matterFile,
    options: {
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
        remarkPlugins: [
          remarkGfm,
        ],
        format: doc.extension,
      },
    },
    components: {
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
      pre: ({children, ...props}) => <Pre {...props} prism={prism}>{children}</Pre>,
      table: ({children, ...props}) => <table {...props} className="table-auto border-collapse">{children}</table>,
      th: ({children, ...props}) => <th {...props} className="border px-4 py-2">{children}</th>,
      td: ({children, ...props}) => <td {...props} className="border px-4 py-2">{children}</td>,
    },
  });

  return content;
}

async function updateMeilisearchDocument(doc: DocEntry, content: string): Promise<void> {
  const meiliDoc: MeiliBlogDocEntry = {
    id: doc.stem,
    createdAt: doc.firstEdition.toZonedDateTime({timeZone: 'Asia/Tokyo'}).epochSeconds,
    title: doc.title,
    content,
  };

  const meiliSearchClient = new MeiliSearch({
    host: meilisearchBaseUrl(),
    apiKey: meilisearchCIAPIKey(),
  });

  const meiliIndex = meiliSearchClient.index<MeiliBlogDocEntry>(meilisearchIndexUid());
  await meiliIndex.addDocuments([meiliDoc]);
}

const Pre: FC<{ children: ReactNode; prism: typeof import('prismjs') }> = ({children, prism}) => {
  const c = children as { props: { className?: string; children: string } };
  let match = /language-(\w+)/.exec(c.props.className || '')?.[1];

  if (process.env.NODE_ENV === 'development') {
    console.log(`match: ${match}`);
  }

  switch (match) {
    case 'jenkinsfile':
      // for compatibility for jenkins.md.
      match = 'groovy';
  }

  return (
    <pre className={clsx(match ? c.props.className : 'language-none', 'sm:rounded-md')}>
        <code
          className={clsx(match ? c.props.className : 'language-none')}
          dangerouslySetInnerHTML={{
            __html: match ?
              prism.highlight(c.props.children, prism.languages[match], match) :
              c.props.children,
          }}
        />
      </pre>
  );
};
