Android で 10万件の写真を表示する
=================================

Google Photo のような App を作る場合どう設計をするか。

iPhone の Photos もですが上下に非常に長いリストに Server から取得した Item が並ぶ UI を作るときにどう設計するか。 List はとりあえずで RecyclerView を使えば良さそうだし画像の表示に関しては Glide を使えば {memory ,disk }cache もいい感じにやってくれるので深く考えることはなさそうですね。気になる点は RecyclerView で使用する Adapter に持たせる Item の総数が非常に多くなった場合 OOM が発生しそうです。

これを解決するためにはまず App 起動時の Adapter は空の List を持ち Item の総数だけ知っている状態にし、 RecyclerView の現在地周辺の Item を Load して離れている場所の Item を忘れて、、、といった実装が必要そうです。 List を動的に操作する実装は過去それなりにやってきたのですがあまりやりたくない実装ですね。

そういえば [Paging library](https://developer.android.com/topic/libraries/architecture/paging/v3-overview) あったけどあれ使えば実装が簡単になるかなー、とふと思ったので試してみました。

静的に Load する
----------------

いきなり Paging library に取り掛かる前にまずシンプルな実装をしてみましょう。

今回扱う Item は id / 作成日時 / 写真の url / 説明文 の 4つを扱うこととします。

```kotlin
data class MyImage(
        val id: String,
        val createdDate: ZonedDateTime,
        val url: String,
        val description: String,
)
```

App は Server から Item を取得するので Server を実装します。 Rust + [Hyper](https://github.com/hyperium/hyper) + [Juniper](https://github.com/graphql-rust/juniper) で [適当に実装します](https://github.com/sukawasatoru/android-photogallery/blob/master/tools/server/src/main.rs)。

<img alt="" src="/2021-03-28-graphiql.png" height="460" />

Android から GraphQL を扱うために今回は [Apollo](https://www.apollographql.com/docs/android/) を使います。

Apollo の詳細な使用方法は省略しますが [こんな感じに](https://github.com/sukawasatoru/android-photogallery/tree/master/data/graphql/src/main/graphql/jp/tinyport/photogallery/data/graphql) schema.json と GraphiQL で作った .graphql ファイルを用意し通信に使用するファイルを自動生成します。

Apollo の準備が整ったら DataSource を実装します。

```kotlin
interface ImageServerDataSource {
    suspend fun getImages(first: Int, after: String?): Result<Pair<List<MyImage>, String?>, String>
}

class ImageServerDataSourceImpl(apiEndpoint: String) : ImageServerDataSource {
    private val apolloClient = ApolloClient.builder()
            .serverUrl(apiEndpoint)
            .addCustomTypeAdapter(CustomType.DATETIMEUTC, object : CustomTypeAdapter<ZonedDateTime> {
                override fun decode(value: CustomTypeValue<*>): ZonedDateTime {
                    return ZonedDateTime.parse(value.value.toString(), DateTimeFormatter.ISO_DATE_TIME)
                }

                override fun encode(value: ZonedDateTime): CustomTypeValue<*> {
                    return CustomTypeValue.GraphQLString(value.format(DateTimeFormatter.ISO_DATE_TIME))
                }
            })
            .build()

    @RequiresPermission(Manifest.permission.INTERNET)
    override suspend fun getImages(first: Int, after: String?):
            Result<Pair<List<MyImage>, String?>, String> {
        return runCatching {
            val response = apolloClient.query(ImageMetaQuery(
                    first = first, after = Input.optional(after)))
                    .toFlow()
                    .first()

            response.errors?.let { errors ->
                // TODO: parse error.
                return@runCatching Err("failed to retrieve data: $errors")
            }

            val dataImages = response.data!!.images!!
            val images = dataImages.nodes.map(MyImage::from)

            if (dataImages.pageInfo.hasNextPage) {
                Ok(Pair(images, dataImages.pageInfo.endCursor))
            } else {
                Ok(Pair(images, null))
            }
        }.getOrElse {
            if (it is ApolloHttpException) {
                return@getOrElse Err("failed to retrieve data: ${it.rawResponse()}")
            }
            Err("failed to retrieve data: $it")
        }
    }
}

private fun MyImage.Companion.from(entity: ImageMetaQuery.Node): MyImage {
    return MyImage(
            id = entity.id,
            createdDate = entity.createdDate,
            url = entity.url,
            description = entity.description,
    )
}
```

とくに特別なことをしていないですが戻り値について補足すると、戻り値に Result を使用しているのは Fallible な命令であることを明示したいためです。 throw を使っていないのは [Anyhow](https://github.com/dtolnay/anyhow) とか [failure](https://github.com/rust-lang-nursery/failure) の使い心地が良かったので Kotlin でも同じことしたかったからで Throwable を String にしているのは特に詳細が必要でないので手抜きしているためです。必要になったときに sealed な Error 型を作ります。

次に Cache のために [Room](https://developer.android.com/training/data-storage/room) を用意します。

```kotlin
@Dao
interface ImageDao {
    @Query("delete from image")
    fun deleteAll()

    @Query("SELECT * FROM image ORDER BY createdDate")
    fun findAll(): List<ImageEntity>

    @Insert
    fun saveImages(entities: List<ImageEntity>)

    @Transaction
    fun replaceAll(images: List<ImageEntity>) {
        deleteAll()
        saveImages(images)
    }
}

@Entity(tableName = "image")
data class ImageEntity(
        @PrimaryKey
        override val id: String,
        @ColumnInfo(index = true)
        override val createdDate: ZonedDateTime,
        override val url: String,
        override val description: String,
)

class Converters {
    @TypeConverter
    fun fromZonedDateTime(value: ZonedDateTime): Long {
        return value.toInstant().toEpochMilli()
    }

    @TypeConverter
    fun intoZonedDateTime(value: Long): ZonedDateTime {
        return ZonedDateTime.ofInstant(Instant.ofEpochMilli(value), ZoneId.of("UTC"))
    }
}
```

Room も GraphQL と同様に DataSource を実装します。

```kotlin
interface ImageLocalDataSource {
    suspend fun getImages(): Result<List<MyImage>, String>

    suspend fun replaceImages(images: List<MyImage>): Result<Unit, String>
}

class ImageLocalDataSourceImpl(
        context: Context,
        private val db: ImageDatabase) : ImageLocalDataSource {
    private val log = EntryPointAccessors.fromApplication(context, DbEntryPoint::class.java)
            .log()

    override suspend fun getImages(): Result<List<MyImage>, String> {
        log.debug("[ImageLocalDataSource] getImages")

        return runCatching {
            Ok(db.imageDao().findAll().map(MyImage::from))
        }.getOrElse {
            Err(it.toString())
        }
    }

    override suspend fun replaceImages(images: List<MyImage>): Result<Unit, String> {
        log.debug("[ImageLocalDataSource] replaceImages")

        return runCatching {
            db.imageDao().replaceAll(images.map(MyImage::toEntity))
            Ok(Unit)
        }.getOrElse {
            Err(it.toString())
        }
    }
}

private fun MyImage.Companion.from(entity: ImageEntity): MyImage {
    return MyImage(
            id = entity.id,
            createdDate = entity.createdDate,
            url = entity.url,
            description = entity.description,
    )
}

private fun MyImage.toEntity(): ImageEntity {
    return ImageEntity(
            id = id,
            createdDate = createdDate,
            url = url,
            description = description,
    )
}
```

GraphQL と Room の DataSource ができました。これらを組み合わせて Repository を実装します。

```kotlin
interface ImageRepository {
    suspend fun retrieveImageAndUpdate(): Flow<Result<List<MyImage>, String>>
}

class DefaultImageRepository @Inject constructor(
        @ApplicationContext
        private val context: Context,
        @RepositoryDispatcher
        private val dispatcher: CoroutineDispatcher,
        private val remoteDataSource: ImageServerDataSource,
        private val localDataSource: ImageLocalDataSource,
) : ImageRepository {
    private val log = EntryPointAccessors.fromApplication(context, RepositoryEntryPoint::class.java)
            .log()

    override suspend fun retrieveImageAndUpdate():
            Flow<Result<List<MyImage>, String>> {
        return flow {
            when (val data = localDataSource.getImages()) {
                is Ok -> emit(Ok(data.value))
                is Err -> {
                    emit(Err(data.error))
                    return@flow
                }
            }

            val images = mutableListOf<MyImage>()
            var after: String? = null
            while (true) {
                val (retImages, cursor) = when (
                    val data = remoteDataSource.getImages(1000, after)) {
                    is Ok -> {
                        data.value
                    }
                    is Err -> {
                        emit(Err("failed to retrieve image: ${data.error}"))
                        return@flow
                    }
                }
                log.info("@@@@ succeeded")
                images.addAll(retImages)
                if (cursor == null) {
                    break
                }
                after = cursor
            }
            emit(Ok(images))

            when (val data = localDataSource.replaceImages(images)) {
                is Ok -> {
                    // do nothing.
                }
                is Err -> {
                    emit(Err(data.error))
                }
            }
        }.flowOn(dispatcher)
    }
}
```

この *retrieveImageAndUpdate* は 1回目の emit は Room のデータを、 2回目は GraphQL のデータを 1000件ずつリクエストし全件取得したものをまとめて emit し、 emit 後に終了する Flow を返します。 Repository で `flowOn(dispatcher)` をしていますがそれに使用する Dispatcher は [Best practices](https://developer.android.com/kotlin/coroutines/coroutines-best-practices#inject-dispatchers) に従って Inject されたものを使用します。

これで静的に Load するための実装ができました。 RecyclerView の実装は ListView からお馴染みの [シンプルな MVP](https://github.com/sukawasatoru/android-photogallery/blob/508e793de316e49fdcdb369364fd8bf349c02e14/app/src/main/kotlin/jp/tinyport/photogallery/MainActivity.kt#L115-L153) で大丈夫です。

では App を起動しつつ Logcat を確認してみましょう。予想通りであれば 1000件取得するごとに *@@@@ succeeded* が出力されるので、それがしばらく表示されたのちに OOM します。

<video controls playsinline width="832">
	<source src="/2021-03-28-logcat.mp4" type="video/mp4"/>
</video>

40秒あたりから Blocking GC が呼び出されるようになり 1分あたりからほとんど身動きが取れなくなって OOM していますね。

Paging library を使用する
-------------------------

前置きが長くなりましたが Paging library を使ってみましょう。

簡単に実装するため今回は GraphQL から取得するだけで Room で Cache は考えないようにします。 DataSource は先ほど作ったものを流用します。

そのほか Paging library で List を更新するためには RecyclerView.Adapter を Wrap した Adapter とそれの為の Pager という class を実装すれば良さそうです。

```kotlin
class MainActivity : AppCompatActivity() {
    private fun usePagingV3() {
        val adapter = MyPagingAdapter()
        binding.list.adapter = adapter

        lifecycleScope.launch {
            pagingVm.pagerFlow.collectLatest { adapter.submitData(it) }
        }
    }
}

@HiltViewModel
internal class PagingVm @Inject constructor(repo: ImageRepository) : ViewModel() {
    val pagerFlow = repo.pagingV3Stream().cachedIn(viewModelScope)
}

class DefaultImageRepository {
    override fun pagingV3Stream(): Flow<PagingData<MyImage>> {
        return Pager(PagingConfig(pageSize = 1000)) {
            object : PagingSource<String, MyImage>() {
                val firstKey = UUID.randomUUID().toString()
                val keys = mutableSetOf(firstKey)

                override suspend fun load(params: LoadParams<String>): LoadResult<String, MyImage> {
                    log.info("[ImageRepository] load key: %s, loadSize: %s",
                            params.key, params.loadSize)
                    // for load between 0 and "after" index.
                    val key = if (params.key == firstKey) {
                        null
                    } else {
                        params.key
                    }
                    return when (val data = remoteDataSource.getImages(params.loadSize, key)) {
                        is Ok -> {
                            data.value.second?.let {
                                keys.add(it)
                            }
                            var prevKey: String? = null
                            for ((index, entry) in keys.withIndex()) {
                                if (entry == key) {
                                    prevKey = keys.elementAtOrNull(index - 1)
                                    break
                                }
                            }
                            log.info("[ImageRepository] load prevKey: %s, key: %s, nextKey: %s",
                                    prevKey, key, data.value.second)
                            LoadResult.Page(data.value.first, prevKey, data.value.second)
                        }
                        is Err -> LoadResult.Error(Exception(data.error))
                    }
                }

                override fun getRefreshKey(state: PagingState<String, MyImage>): String? {
                    return state.anchorPosition?.let { anchorPosition ->
                        val closest = state.closestPageToPosition(anchorPosition)
                        closest?.prevKey ?: closest?.nextKey
                    }
                }
            }
        }
                .flow
                .flowOn(dispatcher)
    }
}
```

PageSource.load() ですが、ここで GraphQL の DataSource を使用したデータを読み方を実装します。

LoadParams.key に Paging に使用する情報、 GraphQL では [after (Cursor)](https://graphql.org/learn/pagination/#pagination-and-edges) が key に設定されるのでこれを使用して GraphQL から必要な位置の Item を取得します。 App 起動後の初回読み込みの LoadParams.key は null です。

読み込んだ Item は LoadResult.Page(items, prev, next) で返します。 LoadResult.Page には Item の他に GraphQL で使用する為の現在地の前後の after を渡すことができます。現在地より前または後ろに Items がなく Paging できない場合は null を渡す必要があります。上の実装で `if (params.key == firstKey) { null } else { params.key }` をしているのは初めのページを表現するために null を使用できないためですね。

では、最低限 Paging library に必要な実装はできたので App を起動してひたすらスクロールしてみましょう。こちらも OOM するでしょうか。

<video controls playsinline width="832">
	<source src="/2021-03-28-logcat-paging.mp4" type="video/mp4"/>
</video>

何回か試しましたが 30万件前後で OOM します。なんだ Paging library もダメなのか、、、と思いながらドキュメントを眺めていると PagingConfig に *maxSize* というそれっぽい Field がありました。こちらを試すと Blocking GC が発生せず軽々と 30万件を読み込むことができました。よかったですね。

```kotlin
override fun pagingV3Stream(): Flow<PagingData<MyImage>> {
    return Pager(PagingConfig(
            pageSize = 1000,
            initialLoadSize = 1000,
            maxSize = 5000,
    )) {
    // snip
}
```

ちなみに *maxSize* に合わせ *initialLoadSize* も設定していますが、こちらは Paging library のバグなのか *pazeSize* と同じ値にしないと上に戻ったときに Adapter の index がおかしくなり戻ることができなくなるため設定しています。

RemoteMediator を使用する
-------------------------

上記実装では GraphQL から値を取得しますが *maxSize* 以上取得した場合次々と古いデータを忘れていくため、スクロールで戻ったときには再び GraphQL からデータを取得する必要があります。 Paging library を使う前の実装のように Room を使用して取得したデータを Cache するようにしてみましょう。

Pager にはこれを実現するために RemoteMediator という仕組みがあります。 RemoteMediator とは Room の PagingSource と GraphQL の PagingSource を用意すると Library 側でいい感じに GraphQL から読み込んだり Room から読み込んだりしてくれます。

```kotlin
class DefaultImageRepository {
    override fun imageStream(): Flow<PagingData<MyImage>> {
        return Pager(
                config = PagingConfig(
                        pageSize = 1000,
                        maxSize = 5000,
                ),
                remoteMediator = object : RemoteMediator<Int, MyImage>() {
                    val nextKeys = mutableSetOf<String>()

                    override suspend fun load(
                            loadType: LoadType,
                            state: PagingState<Int, MyImage>): MediatorResult {
                        val after = when (loadType) {
                            LoadType.REFRESH -> {
                                log.info("[ImageRepository] loadType: %s, pageSize: %s",
                                        loadType.name, state.config.pageSize)
                                null
                            }
                            LoadType.PREPEND -> {
                                log.info("[ImageRepository] loadType: %s", loadType.name)
                                return MediatorResult.Success(true)
                            }
                            LoadType.APPEND -> {
                                log.info("[ImageRepository] loadType: %s, pageSize: %s, nextKeys: %s",
                                        loadType.name, state.config.pageSize, nextKeys.lastOrNull())
                                if (state.lastItemOrNull() == null) {
                                    return MediatorResult.Success(false)
                                }
                                nextKeys.lastOrNull()
                            }
                        }
                        val (data, nextKey) = when (
                            val data = remoteDataSource.getImages(state.config.pageSize, after)) {
                            is Ok -> data.value
                            is Err -> return MediatorResult.Error(Exception(data.error))
                        }

                        if (loadType == LoadType.REFRESH) {
                            localDataSource.replaceImages(data)
                        } else {
                            localDataSource.saveImages(data)
                        }

                        nextKey?.let {
                            nextKeys.add(it)
                        }

                        return MediatorResult.Success(nextKey == null)
                    }
                },
                pagingSourceFactory = { localDataSource.pagingSource() }
        )
                .flow
                .flowOn(dispatcher)
    }
}

class ImageLocalDataSourceImpl {
    override fun pagingSource(): PagingSource<Int, MyImage> {
        log.debug("[ImageLocalDataSource] pagingSource")

        // automatically generated PagingSource uses LimitOffsetDataSource.java.
        // it generates `SELECT * FROM ( " + mSourceQuery.getSql() + " ) LIMIT ? OFFSET ?`
        // so need to create the index for avoiding the table scan.
        return db.imageDao().pagingSource() as PagingSource<Int, MyImage>
    }
}

@Dao
interface ImageDao {
	// snip.

    @Query("SELECT * FROM image ORDER BY createdDate")
    fun pagingSource(): PagingSource<Int, ImageEntity>

    // snip
}
```

RemoteMediator の基本的な実装は今までやってきた PagingSource の実装と大体同じです。ポイントとしては LoadParams.key がなくなり LoadType と PagingState.lastItemOrNull() で after (Cursor) を決める必要がある、取得した Item は自分で Room に保存する必要があることでしょうか。

LoadType は REFRESH が App を起動してからの初期読み込みに使用されます (Adapter に refresh の命令をすれば使われますが今回は使っていません)。 PREPEND は List の先頭から Item を読み込む場合は初期読み込み時にしか呼び出されないため常に endOfPagenationReached = true として問題ないです。 APPEND は after を使用しての読み込みですね。 `if (state.lastItemOrNull() == null)` をしているのは初期読み込み中に APPEND が呼ばれることがあるのでそのときに何もしない為の実装です。

Room の方の PagingSource は DAO の自動生成の実装を使用します。

まとめ
------

Paging library を使用することで巨大な Adapter を実現することができました。ただちょっと気になる点もありどうやら Item の更新は大丈夫なのですが追加や削除をした際に動作が安定しない感じがします。

そのほか最近だと巨大な Adapter を持つ App は少なく、例えば Twitter だと一定数以上読み込むと古いデータを忘れるようになっていたりするので、実際の App 開発で Paging library を使うシーンはあまりないのかなー、という気はしています。

長いリストを持っても最初はスクロール楽しいですが、疲れますしね。

- - -

timestamp  
2021-03-28 (First edition)
