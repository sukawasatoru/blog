Stork から Meilisearch に乗り換えた
===================================

Blog の検索機能の為に [Stork](https://stork-search.net/) を使用していた。 Stork はサーバー不要なのが特徴で魅力がある為に使用していた。仕組みとしては静的な Index ファイルを生成しそれを Browser から読み取ることで検索している。

しかし使ってみると Local Server 上で Index を更新するのが面倒、また Index が 2MB を超えたのでダウンロードサイズが気になった。代替を探してもサーバー不要なものはないのでとりあえず使ってみるか、で 2021年から使い始めた。

が、久々に Blog 書いてみるとやっぱり Index の更新が面倒だったので App Router 対応を機に、以前から気になっていた [Meilisearch](https://www.meilisearch.com/) に乗り換えてみた。 Meilisearch 自体はいくつかの記事を見て良さそうなのは以前から知っていたがサーバー必要だし、、で見送っていたがより気軽に記事を書きたかったのと Cloudflare Tunnel (旧 Argo Tunnel) の帯域があまり気味だったのでとりあえずで使ってみた。

結果 Server Component 内で自動で Index を更新することができるようになったので楽になった。

Meilisearch 起動までの設定
--------------------------

必要なファイルは [Releases · meilisearch/meilisearch](https://github.com/meilisearch/meilisearch/releases) からダウンロードした実行ファイルと設定ファイル config.toml だけだ。

config.toml は最低限

```toml
http_addr = "<address>:<port>"
master_key = "<master key>"
env = "production"
```

だけで良さそうだった。 master_key は最低限 16byte 必要で、今回は 1Password で長めの Password を生成しそれを設定した。

あとは

```bash
./meilisearch
```

で起動するだけで最低限使用するための準備が整う。

API key の生成
--------------

Meilisearch に検索用の情報を登録したり、検索する為に API key が必要になる。一応 master key を API key として使用することもできるが強力なので、 Meilisearch を起動する時とセットアップ時に必要な API key を取得する為だけに使用するのが良さそう。

初めての起動後は [Listing API keys](https://www.meilisearch.com/docs/learn/security/master_api_keys#listing-api-keys) に従ってデフォルトの API Key を取得する。

ドキュメントの通りに master key を使用し curl を実行すると `Default Search API Key` という全ての Index を検索できる API key と `Default Admin API Key` という全ての操作を行える API key を取得できる。 `Default Admin API Key` は master key 同等に強力なので、必要な権限を持った API key を生成するまでは master key の代わりにこれを使用する。

今回は

- Blog 用の Index *foo* を作りたい
- Browser から Index *foo* を検索できる API key が欲しい
- CI から Index *foo* (正確には Index *foo* に含まれる Document) を更新できる API key が欲しい

のため 検索用 API key と Document 更新用 API key の 2つを生成した。

ひとまず Index *foo* を Admin API Key で生成した。というのは CI 用 API key に [*indexes.create*](https://www.meilisearch.com/docs/reference/api/keys#table-container) の権限を持たせることで Document 登録・更新時に Index がなければ作ってくれるが、あまり権限を持たせたくないため事前に Index を生成した。

```bash
# create index.
curl -H'content-type: application/json' -H'Authorization: Bearer <admin api key>' -d'{"uid": "foo"}' 'http://localhost:7700/indexes'

# create api keys.
curl -H'content-type: application/json' -H'Authorization: Bearer <admin api key>' -d'{"name": "Blog CI API Key", "description": "Update documents from Blog CI", "actions": ["documents.*"], "indexes": ["foo"], "expiresAt": null}' 'http://localhost:7700/keys'
curl -H'content-type: application/json' -H'Authorization: Bearer <admin api key>' -d'{"name": "Blog Search API Key", "description": "Use it to search from frontend of blog", "actions": ["search"], "indexes": ["foo"], "expiresAt": null}' 'http://localhost:7700/keys'
```

ちなみに [master key を変更すると全ての API Key が変わります。](https://www.meilisearch.com/docs/learn/security/master_api_keys#changing-the-master-key)


Document の登録・更新
---------------------

Next.js の Server Component から検索用の情報を更新するようにした。直に axios を使って更新することもできるが npm に [meilisearch](https://github.com/meilisearch/meilisearch-js) として API client が公開されているため、今回それを使用した。

Document 登録・更新用の実装は

```ts
async function updateMeilisearchDocument(doc: DocEntry, content: string): Promise<void> {
  const meiliDoc = {
    id: doc.stem,
    title: doc.title,
    content,
  };

  const meiliSearchClient = new MeiliSearch({
    host: 'your host name w/ port',
    apiKey: 'api key for ci',
  });

  const meiliIndex = meiliSearchClient.index<MeiliBlogDocEntry>('foo');
  await meiliIndex.addDocuments([meiliDoc]);
}
```

の function を定義しそれを Server Component 内から実行するだけだ。

Document の検索
---------------

検索も [meilisearch](https://github.com/meilisearch/meilisearch-js) API client を使用した。

Client Component から使用するために次の Custom hook を実装した:

```tsx
function useMeiliSearch(
  {apiKey, baseUrl, index, query}: { apiKey: string; baseUrl: string; index: string; query: string },
): Array<{id: string; title: string: content: string}> {
  const client = useMemo(() =>
      new MeiliSearch({
        host: baseUrl,
        apiKey,
      })
        .index(index)
    , [apiKey, baseUrl, index]);

  const [result, setResult] = useState<Array<{id: string; title: string; content: string}>>([]);

  useEffect(() => {
    if (!query) {
      setResult([]);
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    void (async () => {
      try {
        signal.throwIfAborted();
        const result = await client.search(
          query,
          {
            limit: 10,
            cropLength: 50,
            highlightPreTag: '<em class="bg-yellow-200 dark:text-gray-900">',
            attributesToHighlight: ['title', 'content'],
            attributesToRetrieve: ['id'],
            attributesToCrop: ['content'],
          },
          {
            signal,
          });

        setResult(
          result.hits.map((data) => ({
            id: data.id,
            title: data._formatted?.title ?? '',
            content: data._formatted?.content ?? '',
          }))
        );
      } catch (e) {
        if (e instanceof MeiliSearchCommunicationError) {
          if (e.message === 'The operation was aborted. ') {
            // ignore.
            return;
          }
          throw e;
        }

        if (e instanceof Error && e.name === 'AbortError') {
          // ignore.
          return;
        }
        throw e;
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [client, query]);

  return result;
}
```

シンプルですね。カスタマイズした点といえば [API Reference](https://www.meilisearch.com/docs/reference/api/search#body) を確認しつつ

- `limit: 10` で検索結果で返す件数をデフォルト 20件から減らした
- `attributesToHighlight: ['title', 'content']` でタイトルと本文をハイライトさせるようにした
- `attributesToRetrieve: ['id']` で *id* だけ返すようにした
    - `attributesToHighlight` を使用すると `{}._formatted` にハイライトされた値が入り、オリジナルの情報は不要になる
- `attributesToCrop: ['content']` で本文を crop した
- `cropLength: 50` でヒットした文字列の前後を多く返すようにした
- `highlightPreTag: '<em class="bg-yellow-200 dark:text-gray-900">'` で Tailwind CSS を使用するようにした

くらいですね。

- - -

timestamp  
2023-05-28 (First edition)
