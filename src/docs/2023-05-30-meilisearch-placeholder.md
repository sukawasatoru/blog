Meilisearch で Placeholder search する
======================================

[Meilisearch Documentation](https://www.meilisearch.com/docs/reference/api/search#placeholder-search)

というものがあるらしい。要するに Query がない状態で検索した時に何を返すかの設定ができる。

たとえばドキュメントの新しい順で返したい場合は、まず Index に Sort できるよう

```bash
curl -v -H'content-type: application/json' -H'Authorization: Bearer <admin key>' -XPUT -d'["createdAt"]' 'http://localhost:7700/indexes/:your_index_name/settings/sortable-attributes'
```

といった設定を行い、検索時に

```ts
const result = await client.search(
query,
{
  // placeholder search 時は 3件だけ返す.
  limit: query ? 10 : 3,
  // placeholder search 時はより crop して返す.
  attributesToRetrieve: ['id', 'title'],
  attributesToCrop: ['content'],
  // placeholder search だけドキュメントを降順で返す.
  sort: query ? undefined : ['createdAt:desc'],
}
);
```

といったように検索する。

- - -

timestamp  
2023-05-30 (First edition)
