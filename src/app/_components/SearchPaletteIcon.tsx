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

import {MagnifyingGlassIcon} from '@heroicons/react/20/solid';
import {JSX} from 'react';

export default function SearchPaletteIcon({onSearchClicked}: { onSearchClicked: () => void }): JSX.Element {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5 cursor-pointer"
      onClick={onSearchClicked}
    >
      <MagnifyingGlassIcon className="my-auto w-5 fill-slate-400"/>
    </div>
  );
}
