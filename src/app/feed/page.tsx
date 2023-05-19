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
import {Metadata} from 'next';
import {compileMDX} from 'next-mdx-remote/rsc';
import {Temporal} from 'proposal-temporal';
import {JSX} from 'react';
import remarkGfm from 'remark-gfm';
import {retrieveDocs} from '@/function/docs';

export const metadata: Metadata = {
  title: 'redirect to feed.xml',
};

export default async function Feed(): Promise<JSX.Element> {
  await generateFeed();

  // https://nextjs.org/docs/app/api-reference/functions/generate-metadata#unsupported-metadata
  return (
    <head>
      <meta httpEquiv="refresh" content="0; url=/feed.xml"/>
    </head>
  );
}

async function generateFeed(): Promise<void> {
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
    const {content} = await compileMDX({
      source: (await readFile(entry.filepath)).toString(),
      options: {
        mdxOptions: {
          development: process.env.NODE_ENV === 'development',
          remarkPlugins: [
            remarkGfm,
          ],
          format: entry.extension,
        }
      },
    });

    // https://github.com/vercel/next.js/issues/43810#issuecomment-1341136525
    const {renderToStaticMarkup} = await import('react-dom/server');

    buf += `    <item>
      <title>${entry.title}</title>
      <link>${target}</link>
      <guid>${target}</guid>
      <description><![CDATA[${renderToStaticMarkup(content)}]]></description>
      <pubDate>${new Date(entry.firstEdition.toString())}</pubDate>
    </item>
`;
  }

  buf += `  </channel>
</rss>`;

  await writeFile(`${process.cwd()}/public/feed.xml`, buf);
}
