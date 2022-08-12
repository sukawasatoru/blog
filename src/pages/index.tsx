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

import {GetStaticProps, NextPage} from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {Temporal} from 'proposal-temporal';
import {memo} from 'react';
import DefaultHeader from '@/components/DefaultHeader';
import {retrieveDocs} from '@/function/docs';

type PropDocEntry = {
  stem: string;
  title: string;
  firstEdition: string;
};

type Props = {
  docEntries: PropDocEntry[];
};

const Index: NextPage<Props> = ({docEntries}) => {
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml"/>
      <title>
        sukawasatoru.com
      </title>
    </Head>
    <div className="container mx-auto max-w-5xl sm:px-6 py-8">
      <DefaultHeader/>
      <p>
        個人用のメモと流し読みする文章を書きます
      </p>
      <EntryList className="mt-4 sm:rounded-md" docEntries={docEntries}/>
    </div>
  </>;
};

export default Index;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const entries = await retrieveDocs();
  entries.sort((a, b) => Temporal.PlainDate.compare(b.firstEdition, a.firstEdition));

  const docEntries: Props['docEntries'] = entries.map(({title, stem, firstEdition}) => ({
    title,
    stem,
    firstEdition: firstEdition.toString(),
  }));

  return {
    props: {
      docEntries,
    },
  };
};

interface EntryListProps {
  className?: string;
  docEntries: PropDocEntry[];
}

const EntryList = memo<EntryListProps>(function EntryList({className, docEntries}) {
  return <div className={className}>
    <ul role="list" className="divide-y divide-gray-200">
      {docEntries.map((entry) =>
        <li key={entry.title}
            className="ease-in-out sm:hover:scale-[1.02] sm:hover:shadow motion-reduce:hover:transform-none duration-150 hover:bg-gray-50 dark:hover:bg-neutral-700"
        >
          <Link href={`/docs/${entry.stem}`}>
            <a className="block py-3 text-sky-600">
              {`${entry.firstEdition}: ${entry.title}`}
            </a>
          </Link>
        </li>
      )}
    </ul>
  </div>;
});
