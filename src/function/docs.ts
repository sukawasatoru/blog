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
import {cwd} from 'process';
import {Temporal} from '@js-temporal/polyfill';

export type DocEntry = {
  filepath: PathLike;
  stem: string;
  extension: 'md' | 'mdx';
  title: string;
  content: string;
  firstEdition: Temporal.PlainDate;
  lastModify?: Temporal.PlainDate;
};

export const retrieveDocs = async (): Promise<DocEntry[]> => {
  const docsPath = docsDirPath();
  const names = await readdir(docsPath);

  const ret: DocEntry[] = [];

  for (const filename of names) {
    if (!filename.endsWith('.md') && !filename.endsWith('.mdx')) {
      continue;
    }

    const doc = await retrieveDoc({
      stem: filename.substring(0, filename.lastIndexOf('.')),
      extension: filename.substring(filename.lastIndexOf('.') + 1) as 'md' | 'mdx',
    });

    ret.push(doc);
  }

  return ret;
};

export const retrieveDoc = async ({stem, extension}: { stem: string; extension?: 'md' | 'mdx' }): Promise<DocEntry> => {
  const docsPath = docsDirPath();

  let ext: 'md' | 'mdx';
  if (extension) {
    ext = extension;
  } else {
    try {
      await stat(`${docsPath}/${stem}.md`);
      ext = 'md';
    } catch (e) {
      await stat(`${docsPath}/${stem}.mdx`);
      ext = 'mdx';
    }
  }

  const filepath = `${docsPath}/${stem}.${ext}`;
  const entryStat = await stat(filepath);
  if (!entryStat.isFile()) {
    throw new Error(`not file: ${filepath}`);
  }

  const docInfo = (await import('docs-parser')).parseDocs((await readFile(filepath)).toString());
  if (!docInfo) {
    throw new Error(`failed to parse document: ${filepath}`);
  }

  const ret: DocEntry = {
    filepath,
    stem: stem,
    extension: ext,
    title: docInfo.title,
    content: docInfo.content,
    firstEdition: Temporal.PlainDate.from(docInfo.firstEdition),
    lastModify: docInfo.lastModify ? Temporal.PlainDate.from(docInfo.lastModify) : undefined,
  };

  docInfo.free();

  return ret;
};

const docsDirPath = (): string => `${cwd()}/src/docs`;
