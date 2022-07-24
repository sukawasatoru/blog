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

import Head from 'next/head';
import Script from 'next/script';
import {FunctionComponent} from 'react';
import {isStorkEnabled} from '@/model/configuration';

/**
 * @see https://github.com/jameslittle230/stork/blob/v1.5.0/js/config.ts
 */
interface StorkOptions {
  showProgress: boolean;
  printIndexInfo: boolean;
  showScores: boolean;
  showCloseButton: boolean;
  minimumQueryLength: number;
  forceOverwrite: boolean;
  resultNoun: { singular: string; plural: string };
  onQueryUpdate: (query: string, results: StorkResult[]) => unknown;
  onResultSelected: (query: string, result: StorkResult) => unknown;
  onResultsHidden: () => unknown;
  onInputCleared: () => unknown;
  transformResultUrl: (url: string) => string;
}

/**
 * @see https://github.com/jameslittle230/stork/blob/v1.5.0/js/searchData.ts
 */
interface StorkResult {
  entry: {
    fields: Record<string, unknown>;
    title: string;
    url: string;
  };
  expects: Array<{
    fields: Record<string, unknown>;
    internal_annotations?: Array<Record<string, unknown>>;
    highlight_ranges?: Array<HighlightRange>;
    score: number;
    text: string;
  }>;
  score: number;
  title_highlight_ranges?: Array<HighlightRange>;
}

/**
 * @see https://github.com/jameslittle230/stork/blob/v1.5.0/js/searchData.ts
 */
interface HighlightRange {
  beginning: number;
  end: number;
}

/**
 * @see https://github.com/jameslittle230/stork/blob/v1.5.0/js/main.ts
 */
declare const stork: {
  initialize(wasmOverrideUrl?: string): Promise<void>;
  downloadIndex(name: string, url: string, config?: Partial<StorkOptions>): Promise<void>;
  attach(name: string): void;
  register(name: string, url: string, config?: Partial<StorkOptions>): Promise<void>;
  search(name: string, query: string): StorkResult[];
};

const storkName = 'blog';

const Stork: FunctionComponent<unknown> = () => {
  return <>
    <Head>
      {/* moved to _document.tsx's <link rel="stylesheet" /> for fast reload. */}
    </Head>
    <div className="stork-wrapper">
      <input className="stork-input" data-stork={storkName} placeholder="Search..."/>
      <div className="stork-output" data-stork={`${storkName}-output`}/>
    </div>
    <Script
      src="https://files.stork-search.net/releases/v1.5.0/stork.js"
      strategy="lazyOnload"
      onLoad={async () => {
        if (!isStorkEnabled) {
          return;
        }
        await stork.register(storkName, '/blog.st', {minimumQueryLength: 2});
      }}
    />
  </>;
};

export default Stork;
