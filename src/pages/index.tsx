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

import DefaultHeader from "@/components/DefaultHeader";
import {retrieveDocs} from "@/function/docs";
import {GetStaticProps, NextPage} from "next";
import Head from "next/head";
import Link from "next/link";
import {Temporal} from "proposal-temporal";
import {ReactElement} from "react";

type PropDocEntry = {
  stem: string;
  title: string;
  firstEdition: string;
};

type Props = {
  docEntries: PropDocEntry[];
};

const Index: NextPage<Props> = (props) => {
  const docLinks: ReactElement[] = [];

  for (const entry of props.docEntries) {
    docLinks.push(<Link href={`/docs/${entry.stem}`}>
      <a>
        {`${entry.firstEdition}: ${entry.title}`}
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
      <DefaultHeader/>
      <p>
        Hello!
      </p>
      {docLinks.map((value, i) =>
        <ul key={i}>
          <li>
            {value}
          </li>
        </ul>
      )}
    </section>
  </>;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const entries = await retrieveDocs();
  entries.sort((a, b) => Temporal.PlainDate.compare(b.firstEdition, a.firstEdition));

  const docEntries: Props['docEntries'] = entries.map(({title, stem, firstEdition}) => ({
    title,
    stem,
    firstEdition: `${firstEdition.year}-${firstEdition.month}-${firstEdition.day}`,
  }));

  return {
    props: {
      docEntries,
    },
  };
};

export default Index;
