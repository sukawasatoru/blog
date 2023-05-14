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

import {readFile, writeFile} from 'fs/promises';
import {GetStaticProps} from 'next';
import Head from 'next/head';
import {MDXRemote} from 'next-mdx-remote';
import {serialize} from 'next-mdx-remote/serialize';
import {Temporal} from 'proposal-temporal';
import {FC} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import {retrieveDocs} from '@/function/docs';

const Feed: FC = () => {
  return <Head>
    <meta httpEquiv="refresh" content="0; url=/feed.xml"/>
    <title>redirect to feed.xml</title>
  </Head>;
};

export default Feed;

export const getStaticProps: GetStaticProps = async () => {
  const baseUrl = `https://sukawasatoru.com`;
  const entries = (await retrieveDocs())
    .sort((a, b) => Temporal.PlainDate.compare(b.firstEdition, a.firstEdition));

  let buf = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>sukawasatoru.com</title>
    <link>${baseUrl}</link>
    <description>個人用のメモと流し読みする文章を書きます</description>
    <lastBuildDate>${new Date()}</lastBuildDate>
`;

  for (const entry of entries) {
    const target = `${baseUrl}/docs/${entry.stem}`;
    const mdxSource = await serialize((await readFile(entry.filepath)).toString(), {
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
        remarkPlugins: [
          remarkGfm,
        ],
        format: entry.extension,
      },
    });

    buf += `    <item>
      <title>${entry.title}</title>
      <link>${target}</link>
      <guid>${target}</guid>
      <description><![CDATA[${renderToStaticMarkup(<MDXRemote {...mdxSource} />)}]]></description>
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
