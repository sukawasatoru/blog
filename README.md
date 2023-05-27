blog
====

Development
-----------

### Setup Meilisearch ###

```bash
# download Meilisearch.
# e.g. meilisearch v1.1.1 for m1 mac.
gh release download v1.1.1 -R meilisearch/meilisearch -p meilisearch-macos-apple-silicon

chmod +x meilisearch-macos-apple-silicon

# launch Meilisearch w/ master key.
./meilisearch-macos-apple-silicon --master-key <your master key>

# create your good index name.
BLOG_INDEX_NAME=<your index name>

# setup api keys.
# api key for ci.
curl -H'content-type: application/json' -H'Authorization: Bearer <your master key>' -d'{"name": "Blog CI API Key", "description": "Update documents from Blog CI", "actions": ["documents.*"], "indexes": ["<your index name>"], "expiresAt": null}' 'http://localhost:7700/keys'

# api key for search.
curl -H'content-type: application/json' -H'Authorization: Bearer <your master key>' -d'{"name": "Blog Search API Key", "description": "Use it to search from frontend of blog", "actions": ["search"], "indexes": ["<your index name>"], "expiresAt": null}' 'http://localhost:7700/keys'

# create index.
curl -H'content-type: application/json' -H'Authorization: Bearer <your master key>' -d'{"uid": "<your index name>"}' 'http:/localhost:7700//indexes'
```
### Create .env.local ###

```bash
BLOG_MEILISEARCH_API_KEY_CI=<api key for ci>
BLOG_MEILISEARCH_API_KEY_SEARCH=<api key for search>
BLOG_MEILISEARCH_BASE_URL=<your base url>
BLOG_MEILISEARCH_INDEX_BLOG=<your index name>
```

### Launch dev server ###

```bash
cd path/to/repo

# build docs-parser.
npm run docs-parser

# launch meilisearch in new terminal.
cd path/to/meilisearch && ./meilisearch --master-key <your master key>

# start Next.js
npm run dev
```

LICENSE
-------

```
   Copyright 2017, 2018, 2021, 2022, 2023 sukawasatoru

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
