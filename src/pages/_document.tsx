/*
 * Copyright 2022 sukawasatoru
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

import {DocumentProps, Head, Html, Main, NextScript} from 'next/document';
import Script from 'next/script';
import {FC} from 'react';

const Document: FC<DocumentProps> = () => {
  // noinspection HtmlRequiredTitleElement
  return <>
    <Html>
      <Head>
        {/* for Stork.tsx */}
        <link rel="stylesheet" href="https://files.stork-search.net/releases/v1.5.0/basic.css"/>
      </Head>
      <body>
      <Main/>
      <NextScript/>
      <Script
        id="add-prefs-color-scheme-class"
        strategy="beforeInteractive"
      >{`try {
  if (
    localStorage.theme === 'dark' ||
    ((!('appearance' in localStorage) || localStorage.appearance === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  ) {
    document.documentElement.classList.add('dark')
  }
} catch (e) {
  console.info('failed to update dark mode');
  console.info(e);
}`}</Script>
      </body>
    </Html>
  </>;
};

export default Document;
