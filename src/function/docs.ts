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

import {PathLike} from 'fs';
import {readdir, readFile, stat} from 'fs/promises';
import {Temporal} from '@js-temporal/polyfill';

export type DocEntry = {
  filepath: PathLike;
  stem: string;
  extension: 'md' | 'mdx';
  title: string;
  firstEdition: Temporal.PlainDate;
  lastModify?: Temporal.PlainDate;
};

export const retrieveDocs = async (): Promise<DocEntry[]> => {
  const docsPath = `${process.cwd()}/src/docs`;
  const names = await readdir(docsPath);

  const ret: DocEntry[] = [];

  for (const filename of names) {
    if (!filename.endsWith('.md') && !filename.endsWith('.mdx')) {
      continue;
    }

    const filepath = `${docsPath}/${filename}`;
    const entryStat = await stat(`${docsPath}/${filename}`);
    if (!entryStat.isFile()) {
      continue;
    }

    const docInfo = (await import('docs-parser')).parseDocs((await readFile(filepath)).toString());
    if (!docInfo) {
      throw new Error(`failed to parse document: ${filepath}`);
    }

    ret.push({
      filepath,
      stem: filename.substring(0, filename.lastIndexOf('.')),
      extension: filename.substring(filename.lastIndexOf('.') + 1) as 'md' | 'mdx',
      firstEdition: Temporal.PlainDate.from(docInfo.firstEdition),
      lastModify: docInfo.lastModify ? Temporal.PlainDate.from(docInfo.lastModify) : undefined,
      title: docInfo.title,
    });

    docInfo.free();
  }

  return ret;
};
