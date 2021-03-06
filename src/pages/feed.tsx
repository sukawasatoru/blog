/*
 * Copyright 2021 sukawasatoru
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

import {retrieveDocs} from "@/function/docs";
import {readFile, writeFile} from "fs/promises";
import {GetStaticProps} from "next";
import renderToString from "next-mdx-remote/render-to-string";
import Head from "next/head";
import {Temporal} from "proposal-temporal";
import {FunctionComponent} from "react";

const Feed: FunctionComponent = () => {
  return <Head>
    <meta httpEquiv="refresh" content="0; url=/feed.xml"/>
    <title>redirect to feed.xml</title>
  </Head>;
};

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

export default Feed;
