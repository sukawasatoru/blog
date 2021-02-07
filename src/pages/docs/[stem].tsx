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
import {readFile} from "fs/promises";
import matter from "gray-matter";
import {GetStaticPaths, GetStaticPathsResult, GetStaticProps, NextPage} from "next";
import hydrate from "next-mdx-remote/hydrate";
import renderToString from "next-mdx-remote/render-to-string";
import {MdxRemote} from "next-mdx-remote/types";
import Head from "next/head";
import {ParsedUrlQuery} from "querystring";
import Link from "next/link";

type Props = {
  mdxSource: MdxRemote.Source;
  stem: string;
};

const Docs: NextPage<Props> = props => {
  return <>
    <Head>
      <link rel="stylesheet" href="/cayman.css"/>
      <title>
        {props.stem} - sukawasatoru.com
      </title>
    </Head>
    <section className="main-content">
      <p>
        {hydrate(props.mdxSource, {})}
      </p>
      <footer className="site-footer">
        <Link href="/">
          <a>
            Top
          </a>
        </Link>
      </footer>
    </section>
  </>;
}

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

export const getStaticProps: GetStaticProps<Props, StaticPath> = async context => {
  const stem = context.params!.stem;
  const docs = await retrieveDocs();
  const filepath = docs.find(value => value.stem === stem)!.filepath;
  const matterFile = matter((await readFile(filepath)));
  const mdxSource = await renderToString(matterFile.content, {scope: matterFile.data});

  return {
    props: {
      mdxSource,
      stem,
    },
  };
};

export default Docs;
