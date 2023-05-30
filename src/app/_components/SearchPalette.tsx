/*
 * Copyright 2023 sukawasatoru
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

'use client';

import {Combobox, Dialog, Transition} from '@headlessui/react';
import {ChevronRightIcon, MagnifyingGlassIcon} from '@heroicons/react/20/solid';
import {DocumentIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {MeiliSearch, MeiliSearchCommunicationError} from 'meilisearch';
import {Route} from 'next';
import {useRouter} from 'next/navigation';
import {Fragment, JSX, useCallback, useEffect, useMemo, useState} from 'react';
import {useRecoilState} from 'recoil';
import {MeiliBlogDocEntry} from '@/model/meili-blog-doc-entry';
import {
  isPlaceholderFetchedState,
  searchPalettePlaceholderResultState,
  searchPaletteState,
} from '@/store/search-palette-state';

export default function SearchPalette({apiKey, baseUrl, index}: { apiKey: string; baseUrl: string; index: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useRecoilState(searchPaletteState);
  const queryResult = useMeiliSearch({apiKey, baseUrl, index, query});

  const afterLeave = useCallback(() => setQuery(''), [setQuery]);

  const router = useRouter();
  const onSelected = useCallback((value: BlogDocEntry | null) => {
    setOpen(false);
    value && router.push(`docs/${value.id}` as Route);
  }, [router, setOpen]);

  return (
    <Transition.Root show={open} as={Fragment} afterLeave={afterLeave} appear>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-3xl transform divide-y divide-gray-100 dark:divide-gray-500 dark:divide-opacity-20 overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={onSelected}>
                {({ activeOption }: {activeOption: Omit<MeiliBlogDocEntry, 'createdAt'> | null }) => (
                  <>
                    <div className="relative">
                      <MagnifyingGlassIcon
                        className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                        aria-hidden="true"
                      />
                      <Combobox.Input
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        placeholder="Search..."
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>

                    {(query === '' || queryResult.length > 0) && (
                      <Combobox.Options as="div" static hold className="flex divide-x divide-gray-100 dark:divide-gray-500 dark:divide-opacity-20">
                        <div
                          className={clsx(
                            'max-h-96 min-w-0 flex-auto scroll-py-4 overflow-y-auto px-6 py-4',
                            activeOption && 'sm:h-96'
                          )}
                        >
                          {query === '' && (
                            <h2 className="mb-4 mt-2 text-xs font-semibold text-gray-500 dark:text-gray-200">Recent searches</h2>
                          )}
                          <div className="-mx-2 text-sm text-gray-700 dark:text-gray-400">
                            {queryResult.map((entry) => (
                              <Combobox.Option
                                as="div"
                                key={entry.id}
                                value={entry}
                                className={({ active }) =>
                                  clsx(
                                    'flex cursor-default select-none items-center rounded-md p-2',
                                    active && 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                  )
                                }
                              >
                                {({ active }) => <ListItem active={active} title={entry.title} />}
                              </Combobox.Option>
                            ))}
                          </div>
                        </div>

                        {activeOption ?
                          <PreviewDocument content={activeOption.content}/> :
                          (queryResult.length && <PreviewDocument content={queryResult[0].content}/>)
                        }
                      </Combobox.Options>
                    )}

                    {query !== '' && queryResult.length === 0 && <NoResult/>}
                  </>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function ListItem({active, title}: { active: boolean; title: string }): JSX.Element {
  return (
    <>
      <span
        className="ml-3 flex-auto truncate dark:text-gray-400"
        dangerouslySetInnerHTML={{__html: title}}
      />
      {active && (
        <ChevronRightIcon
          className="ml-3 h-5 w-5 flex-none text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      )}
    </>
  );
}

function PreviewDocument({content}: {content: string}): JSX.Element {
  return (
    <div className="hidden h-96 w-1/2 flex-none flex-col divide-y divide-gray-100 overflow-y-auto overflow-x-hidden sm:flex">
      <div className="p-6 dark:text-gray-400" dangerouslySetInnerHTML={{__html: content}} />
    </div>
  );
}

function NoResult(): JSX.Element {
  return (
    <div className="px-6 py-14 text-center text-sm sm:px-14">
      <DocumentIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
      <p className="mt-4 font-semibold text-gray-900">No document found</p>
      <p className="mt-2 text-gray-500">
        We couldn’t find anything with that term. Please try again.
      </p>
    </div>
  );
}

type BlogDocEntry = Omit<MeiliBlogDocEntry, 'createdAt'>;

function useMeiliSearch(
  {apiKey, baseUrl, index, query}: { apiKey: string; baseUrl: string; index: string; query: string },
): Array<BlogDocEntry> {
  const client = useMemo(() =>
      new MeiliSearch({
        host: baseUrl,
        apiKey,
      })
        .index(index)
    , [apiKey, baseUrl, index]);

  const [isPlaceholderFetched, setIsFetched] = useRecoilState(isPlaceholderFetchedState);
  const [placeholderResult, setPlaceholderResults] = useRecoilState(searchPalettePlaceholderResultState);
  const [queryResult, setQueryResult] = useState<BlogDocEntry[]>([]);

  useEffect(() => {
    if (!query) {
      if (isPlaceholderFetched) {
        return;
      }
      setIsFetched(true);
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    void (async () => {
      try {
        signal.throwIfAborted();
        const result = await client.search(
          query,
          {
            limit: 10,
            cropLength: 50,
            highlightPreTag: '<em class="bg-yellow-200 dark:text-gray-900">',
            attributesToHighlight: ['title', 'content'],
            attributesToRetrieve: ['id'],
            attributesToCrop: ['content'],
            sort: query ? undefined : ['createdAt:desc'],
          },
          {
            signal,
          });

        const newData = result.hits.map((data) => ({
            id: data.id,
            title: data._formatted?.title ?? '',
            content: data._formatted?.content ?? '',
          }));

        setPlaceholderResults((current) => current.length || query ? current : newData);

        signal.throwIfAborted();
        setQueryResult((current) => query ? newData : current);
      } catch (e) {
        if (e instanceof MeiliSearchCommunicationError) {
          if (e.message === 'The operation was aborted. ') {
            // ignore.
            return;
          }
          console.log(`code: ${e.code}, statusCode: ${e.statusCode}, errno: ${e.errno}, cause: ${e.cause}, message: '${e.message}'`);
          throw e;
        }

        if (e instanceof Error && e.name === 'AbortError') {
          // ignore.
          return;
        }
        throw e;
      }
    })();

    return () => {
      if (!query) {
        // for placeholder search.
        return;
      }
      abortController.abort();
    };
  }, [client, isPlaceholderFetched, query, setIsFetched, setPlaceholderResults]);

  return query ? queryResult : placeholderResult;
}
