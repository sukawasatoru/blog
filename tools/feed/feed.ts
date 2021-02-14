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

import {DocEntry} from "@/function/docs";
import {PathLike} from "fs";
import {readdir, readFile, stat} from "fs/promises";
import renderToString from "next-mdx-remote/render-to-string";
import {Temporal} from "proposal-temporal";
import {inspect} from 'util';
import {writeFile} from 'fs/promises';

const log = {
  level: 1,
  inspectObject(msg: any): string {
    return typeof msg === 'string' ? msg : inspect(msg, {colors: true});
  },
  verbose(message: any, ...optionalParams: any[]): void {
    if (this.level < 5) {
      return;
    }

    if (optionalParams.length == 0) {
      console.trace(this.inspectObject(message));
    } else {
      console.trace(message, ...optionalParams);
    }
  },
  debug(message: any, ...optionalParams: any[]): void {
    if (this.level < 4) {
      return;
    }

    if (optionalParams.length == 0) {
      console.debug(this.inspectObject(message));
    } else {
      console.debug(message, ...optionalParams);
    }
  },
  info(message: any, ...optionalParams: any[]): void {
    if (this.level < 3) {
      return;
    }

    if (optionalParams.length == 0) {
      console.info(this.inspectObject(message));
    } else {
      console.info(message, ...optionalParams);
    }
  },
  warn(message: any, ...optionalParams: any[]): void {
    if (this.level < 2) {
      return;
    }

    if (optionalParams.length == 0) {
      console.warn(this.inspectObject(message));
    } else {
      console.warn(message, ...optionalParams);
    }
  },
  error(message: any, ...optionalParams: any[]): void {
    if (this.level < 1) {
      return;
    }

    if (optionalParams.length == 0) {
      console.error(this.inspectObject(message));
    } else {
      console.error(message, ...optionalParams);
    }
  },
};

// ref. @/function/docs
const retrieveDocs = async (docsPath: PathLike): Promise<DocEntry[]> => {
  const {parseDocs} = await import("docs-parser-nodejs");

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

    const docInfo = parseDocs((await readFile(filepath)).toString());
    if (!docInfo) {
      throw new Error(`failed to parse document: ${filepath}`);
    }

    ret.push({
      filepath,
      stem: filename.substring(0, filename.length - ".md".length),
      firstEdition: Temporal.PlainDate.from(docInfo.firstEdition),
      lastModify: docInfo.lastModify ? Temporal.PlainDate.from(docInfo.lastModify) : undefined,
      title: docInfo.title,
    });
  }

  return ret;
};

(async () => {
  const yargs = await import ("yargs");
  const opt = yargs
    .option('base-url', {
      alias: 'b',
      type: 'string',
      demandOption: true,
      description: 'Base url for feeds',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      demandOption: true,
      description: 'Destination of the feed',
    })
    .option('verbose', {
      alias: 'v',
      type: 'count',
      description: 'Print verbose log',
    })
    .demandCommand(1, 1, 'The markdown\'s directory wes not provided')
    .version(false)
    .parse();

  switch (opt.verbose) {
    case 0:
      log.level = 3;
      break;
    case 1:
      log.level = 4;
      break;
    case 2:
    default:
      log.level = 5;
      break;
  }

  log.info('Hello!');

  const ret = await retrieveDocs(opt._[0].toString());
  let buf = '';
  buf += `<?xml version="1.0"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>sukawasatoru.com</title>
    <link>${opt["base-url"]}</link>
    <description>個人用のメモと流し読みする文章を書きます</description>
    <lastBuildDate>${new Date()}</lastBuildDate>
`;
  for (const entry of ret) {
    log.info(`entry: ${entry.filepath}, title: ${entry.title}`);

    const target = `${opt["base-url"]}/docs/${entry.stem}`.replace(/[^:]\/\//g, '/');
    const mdxSource = await renderToString((await readFile(entry.filepath)).toString());

    buf +=`    <item>
      <title>${entry.title}</title>
      <link>${target}</link>
      <guid>${target}</guid>
      <description><![CDATA[${mdxSource.renderedOutput}]]></description>
      <pubDate>${new Date(entry.firstEdition.toString())}</pubDate>
    </item>
`;
  }

  buf += `  </channel>
</rss>`;
  await writeFile(opt.output, buf);

  log.info(`Operation complete`);
})().catch(reason => {
  log.error(`Unsuccessful operation`);
  log.error(reason);
  process.exit(1);
});
