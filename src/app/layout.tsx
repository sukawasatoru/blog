/*
 * Copyright 2022, 2023 sukawasatoru
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

import {Metadata} from 'next';
import Script from 'next/script';
import {JSX, ReactNode} from 'react';
import {AppProviders} from '@/app/_components/AppProviders';
import DefaultHeader from '@/app/_components/DefaultHeader';
import SearchPalette from '@/app/_components/SearchPalette';
import {meilisearchBaseUrl, meilisearchIndexUid, meilisearchSearchAPIKey} from '@/model/configuration';
import '@/style/global.css';

export const metadata: Metadata = {
  title: 'sukawasatoru.com',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export default function RootLayout({children}: { children: ReactNode }): JSX.Element {
  return (
    <html lang="ja">
    <body>
    <div className="container mx-auto max-w-5xl sm:px-6 py-8">
      <AppProviders>
        <DefaultHeader/>
        {children}
        <SearchPalette
          apiKey={meilisearchSearchAPIKey()}
          baseUrl={meilisearchBaseUrl()}
          index={meilisearchIndexUid()}
        />
      </AppProviders>
    </div>
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
}`}
    </Script>
    </body>
    </html>
  );
}
