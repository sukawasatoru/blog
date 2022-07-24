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

import Link from 'next/link';
import {FC} from 'react';
import Stork from '@/components/Stork';

const DefaultHeader: FC = () =>
  <header className="pb-16">
    <h1 className="text-xl text-neutral-600 font-medium tracking-wide mb-2 hover:underline">
      <Link href="/">
        <a>
          sukawasatoru.com
        </a>
      </Link>
    </h1>
    <Stork/>
  </header>;

export default DefaultHeader;
