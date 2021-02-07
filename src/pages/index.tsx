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
import {DocEntry, retrieveDocs} from "@/function/docs";
import {GetStaticProps, NextPage} from "next";
import Head from "next/head";
import Link from "next/link";
import {ReactElement} from "react";

type Props = {
  docEntries: DocEntry[];
};

const Index: NextPage<Props> = (props) => {
  const docLinks: ReactElement[] = [];

  for (const entry of props.docEntries) {
    docLinks.push(<Link href={`/docs/${entry.stem}`}>
      <a>
        {entry.stem}
      </a>
    </Link>);
  }

  return <>
    <Head>
      <link rel="stylesheet" href="/cayman.css"/>
      <title>
        sukawasatoru.com
      </title>
    </Head>
    <section className="main-content">
      <header style={{marginBottom: '64px'}}>
        <Stork />
      </header>
      <p>
        Hello!
      </p>
      <p>
        {docLinks.map(value =>
          <ul>
            <li>
              {value}
            </li>
          </ul>
        )}
      </p>
    </section>
  </>;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      docEntries: await retrieveDocs(),
    },
  };
};

export default Index;
