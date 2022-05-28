blog
====

Development
-----------

```bash
cd <path to repo>

# build stor-builder.
cd tools/stork-builder && cargo build --release && cd -

# build docs-parser.
npm run docs-parser

# build stork index.
npm install
npm run export
tools/stork-builder/target/release/stork-builder -fo out/blog.st -m src/docs out

# symlink for "npm start".
npm run ln-s

# start Next.js
npm run dev
```

LICENSE
-------

```
   Copyright 2017, 2018, 2021, 2022 sukawasatoru

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
