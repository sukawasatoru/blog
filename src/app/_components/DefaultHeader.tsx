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

'use client';

import Link from 'next/link';
import {JSX, useCallback} from 'react';
import {useRecoilState} from 'recoil';
import AppearanceSelector from '@/app/_components/AppearanceSelector';
import SearchPaletteIcon from '@/app/_components/SearchPaletteIcon';
import {searchPaletteState} from '@/store/search-palette-state';

export default function DefaultHeader(): JSX.Element {
  const [, setOpen] = useRecoilState(searchPaletteState);
  const onSearchClicked = useCallback(() => setOpen(true), [setOpen]);

  return (
    <header className="mb-16 flex flex-row justify-between items-baseline">
      <h1 className="text-xl text-neutral-600 font-medium tracking-wide mb-2 hover:underline dark:text-white">
        <Link href="/">
          sukawasatoru.com
        </Link>
      </h1>
      <div className="grow flex justify-end gap-3">
        <SearchPaletteIcon onSearchClicked={onSearchClicked} />
        <AppearanceSelector />
      </div>
    </header>
  );
}
