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

import Stork from "@/components/Stork";
import Link from "next/link";
import {FunctionComponent} from "react";

const DefaultHeader: FunctionComponent = () =>
  <>
    <header>
      <h1 className="project-tagline">
        <Link href="/">
          <a>
            sukawasatoru.com
          </a>
        </Link>
      </h1>
      <Stork/>
    </header>
    <style jsx>{`
      // via. cayman.css - .page-header.
      @media screen and (min-width: 64em) {
        header {
          padding-bottom: 5rem;
        }
      }

      @media screen and (min-width: 42em) and (max-width: 64em) {
        header {
          padding-bottom: 3em;
        }
      }

      @media screen and (max-width: 42em) {
        header {
          padding-bottom: 2rem;
        }
      }
    `}</style>
  </>;

export default DefaultHeader;
