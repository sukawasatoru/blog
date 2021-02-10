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


import {createReadStream, PathLike} from "fs";
import {readdir, stat} from "fs/promises";
import {Temporal} from "proposal-temporal";
import {createInterface} from "readline";

export type DocEntry = {
  filepath: PathLike;
  stem: string;
  title: string;
  firstEdition: Temporal.PlainDate;
  lastModify?: Temporal.PlainDate;
};

export const retrieveDocs = async (): Promise<DocEntry[]> => {
  const docsPath = `${process.cwd()}/src/docs`;
  const names = await readdir(docsPath);

  const ret: DocEntry[] = [];

  for (const filename of names) {
    if (!filename.endsWith(".md")) {
      continue;
    }

    const filepath = `${docsPath}/${filename}`;
    const entryStat = await stat(`${docsPath}/${filename}`);
    if (!entryStat.isFile()) {
      continue;
    }

    const reader = createInterface(createReadStream(filepath));
    let isParseDate = false;
    let title: string | undefined;
    let firstEdition: Temporal.PlainDate | undefined;
    let lastModify: Temporal.PlainDate | undefined;
    let prevLine: string[] = [];
    const firstRegex = /^([-0-9]*) \(First edition\)/;
    const modifyRegex = /^([-0-9]*) \(Last modify\)/;
    const titleSepRegex = /^=*$/;
    for await (const entry of reader) {
      if (!title) {
        prevLine.push(entry);

        if (1 < prevLine.length) {
          if (titleSepRegex.test(entry)) {
            title = prevLine[0];
          }
          prevLine.splice(0, 1);
        }
      }

      if (entry === `timestamp  `) {
        isParseDate = true;
        firstEdition = undefined;
        lastModify = undefined;
        continue;
      }

      if (!isParseDate) {
        continue;
      }

      if (!firstEdition) {
        const [, firstEditionString] = entry.match(firstRegex) || ['', ''];
        if (!firstEditionString) {
          isParseDate = false;
          continue;
        }

        try {
          firstEdition = Temporal.PlainDate.from(firstEditionString);
        } catch (e) {
          // the timestamp marker may be body content.
          isParseDate = false;
        }

        continue;
      }

      const [, lastModifyString] = entry.match(modifyRegex) || ['', ''];

      if (lastModifyString) {
        lastModify = Temporal.PlainDate.from(lastModifyString);
      }

      console.log(`3: ${entry}`);
      isParseDate = false;
    }

    if (!title) {
      throw new Error(`the title is undefined: ${title}`);
    }

    if (!firstEdition) {
      throw new Error(`the firstEdition is undefined: ${filepath}`);
    }

    ret.push({
      filepath,
      stem: filename.substring(0, filename.length - ".md".length),
      firstEdition,
      lastModify,
      title,
    });
  }

  return ret;
};
