/*
 * Copyright 2022, 2023 sukawasatoru
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

export function meilisearchBaseUrl(): string {
  const baseUrl = process.env.BLOG_MEILISEARCH_BASE_URL;
  if (!baseUrl) {
    throw new Error(`need to set 'BLOG_MEILISEARCH_BASE_URL'`);
  }
  return baseUrl;
}

export function meilisearchCIAPIKey(): string {
  const key = process.env.BLOG_MEILISEARCH_API_KEY_CI;
  if (!key) {
    throw new Error(`need to set 'BLOG_MEILISEARCH_API_KEY_CI'`);
  }
  return key;
}

export function meilisearchIndexUid(): string {
  const id = process.env.BLOG_MEILISEARCH_INDEX_BLOG;
  if (!id) {
    throw new Error(`need to set 'BLOG_MEILISEARCH_INDEX_BLOG'`);
  }
  return id;
}

export function meilisearchSearchAPIKey(): string {
  const key = process.env.BLOG_MEILISEARCH_API_KEY_SEARCH;
  if (!key) {
    throw new Error(`need to set 'BLOG_MEILISEARCH_API_KEY_SEARCH'`);
  }
  return key;
}
