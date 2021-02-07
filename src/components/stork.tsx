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

import Head from "next/head";
import {FunctionComponent, useEffect} from "react";

// https://stork-search.net/docs/js-ref/
// https://github.com/jameslittle230/stork/tree/master/js
type StorkOptions = {
  showProgress?: boolean;
  printIndexInfo?: boolean;
  showScores?: boolean;
  minimumQueryLength?: number;
  onQueryUpdate?: (query: string, result: any) => void;
  onResultSelected?: (query: string, result: any) => void;
};

declare const stork: {
  register(name: string, url: string, options?: StorkOptions): void;
} | undefined;

const storkName = 'blog';

const Stork: FunctionComponent<unknown> = () => {
  useEffect(() => {
    const waitStork = async () => {
      const timer = (millis: number) => new Promise(resolve => window.setTimeout(resolve, millis));
      while (!stork) {
        await timer(100);
      }
    };

    (async () => {
      await waitStork();
      stork!.register(storkName, '/blog.st', {minimumQueryLength: 2});
    })();
  }, []);

  return <>
    <Head>
      <link rel="stylesheet" href="https://files.stork-search.net/basic.css"/>
    </Head>
    <div className="stork-wrapper">
      <input className="stork-input" data-stork={storkName} placeholder="Search..."/>
      <div className="stork-progress" style={{width: '100%', opacity: 0}}></div>
      <div className="stork-output" data-stork={`${storkName}-output`}></div>
    </div>
    <script src="https://files.stork-search.net/stork.js"></script>
  </>;
};

export default Stork;
