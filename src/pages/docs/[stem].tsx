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

import Stork from "@/components/stork";
import {retrieveDocs} from "@/function/docs";
import {readFile} from "fs/promises";
import {GetStaticPaths, GetStaticPathsResult, GetStaticProps, NextPage} from "next";
import renderToString from "next-mdx-remote/render-to-string";
import Head from "next/head";
import Link from "next/link";
import {ParsedUrlQuery} from "querystring";
import {FunctionComponent, ReactElement} from "react";
import {Prism} from "react-syntax-highlighter";

type Props = {
  renderedMD: string;
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
      <header style={{marginBottom: '64px'}}>
        <Stork/>
      </header>
      <main>
        <div dangerouslySetInnerHTML={{__html: props.renderedMD}}/>
      </main>
      <footer className="site-footer">
        <Link href="/">
          <a>
            Top
          </a>
        </Link>
      </footer>
    </section>
    <style  jsx>{`
        .main-content {
          font-size: 16px
        }
    `}</style>
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

const CodeBlock: FunctionComponent = (props) => {
  const children = props.children as ReactElement;
  if (children.props?.originalType === 'code' && children.props.className) {
    return <Prism language={children.props.className.replace(/^language-/, '')}>
      {children.props.children}
    </Prism>;
  } else {
    return <pre>
      {props.children}
    </pre>;
  }
}

export const getStaticProps: GetStaticProps<Props, StaticPath> = async context => {
  const stem = context.params!.stem;
  const docs = await retrieveDocs();
  const filepath = docs.find(value => value.stem === stem)!.filepath;
  const matterFile = (await readFile(filepath)).toString();
  const mdxSource = await renderToString(matterFile, {
    components: {
      pre: CodeBlock,
    },
  });

  return {
    props: {
      renderedMD: mdxSource.renderedOutput,
      stem,
    },
  };
};

export default Docs;
