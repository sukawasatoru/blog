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

import {Temporal} from '@js-temporal/polyfill';
import {Route} from 'next';
import Link from 'next/link';
import {JSX, memo} from 'react';
import {retrieveDocs} from '@/function/docs';

export default async function Page(): Promise<JSX.Element> {
  const docEntries = await retrieveDocEntries();

  return <>
    <p>
      個人用のメモと流し読みする文章を書きます
    </p>
    <EntryList className="mt-4 sm:rounded-md" docEntries={docEntries}/>
  </>;
}

interface PropDocEntry {
  stem: string;
  title: string;
  firstEdition: string;
}

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
          <Link className="block py-3 text-sky-600" href={`/docs/${entry.stem}` as Route}>
            {`${entry.firstEdition}: ${entry.title}`}
          </Link>
        </li>,
      )}
    </ul>
  </div>;
});

async function retrieveDocEntries(): Promise<PropDocEntry[]> {
  const entries = await retrieveDocs();
  entries.sort((a, b) => Temporal.PlainDate.compare(b.firstEdition, a.firstEdition));

  return entries.map(({title, stem, firstEdition}) => ({
    title,
    stem,
    firstEdition: firstEdition.toString(),
  }));
}
