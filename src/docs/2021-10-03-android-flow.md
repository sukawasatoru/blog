Android での Flow の使い分けと launchWhenStarted / repeatOnLifecycle(STARTED) の違い
====================================================================================

最近 Jetpack Compose を使い始めたので、 JetPack Compose を使う前の Flow の使い方を整理した

比較的よく使う Flow
-------------------

### ReplaySubject ###

非同期でデータを取得する時によく使う。

MutableStateFlow() との違いは、初期値がないため `flow.first()` をした時に値が emit されるまで suspend する。

たとえば初回データを取得する時に待ち合わせする為に使用する。画面表示時に Progress bar を表示し `flow.first()` で値を取得できたら非表示にする。

`replay = 1` を設定しているためデータ取得後に画面の回転など行ってもすぐに値を得て画面を構築することができる。

```kotlin
MutableSharedFlow<T>(
    replay = 1,
    onBufferOverflow = BufferOverflow.DROP_OLDEST,
)
```

Subject の必要がなければ直接 *flow* と *shareIn* を組み合わせて使用する。

```kotlin
flow {}.shareIn(
    scope = ViewModel.viewModelScope,
    started = SharingStarted.Lazily,
    replay = 1,
)
```

`replay = 1` を削除すると PublishSubject になる。

### BehaviorSubject ###

初期値を設定できるときは ReplaySubject の代わりに BehaviorSubject が使える。

たとえば SwipeRefreshLayout を使っている画面で `SwipeRefreshLayout.isRefreshing()` を設定する為の Flow として使用する。初期値には LOAD を設定し、データが読み終わったら LOADED を設定する。 Swipe して Refresh するときは再び LOAD を設定する。

画面の回転など行ってもすぐに値を得て画面を構築することができる。

```kotlin
MutableStateFlow(initValue)
```

ほとんど使っていない Flow
-------------------------

### ReplaySubject (suspend) ###

consumer がいないと emit 側が suspend する。

```kotlin
MutableSharedFlow<Int>(replay = 1)
```

`replay = 1` を外したときは JavaScript の Generator みたいに遅延評価する時に使う？

### ReplaySubject (Eagerly) ###

CoroutineScope が生きている間評価し続ける。 LifecycleObserver を Flow で表現したい時に使う？

LifecycleObserver の代わりに使う場合 suspend の都合上、たとえば特定の View の Event が発生したときに同じ tick で処理をするといったことはできない。

```kotlin
flow {}.shareIn(
    scope = ViewModel.viewModelScope,
    started = SharingStarted.Eagerly,
    replay = 1,
)
```

launchWhenStarted vs repeatOnLifecycle(STARTED)
-----------------------------------------------

*launchWhenStarted* は *onStart* から subscribe し *onStop* 時に suspend する。再び *onStart* したときに suspend から復帰する。画面が表示されている間だけ描画を行う場合にいつも使用している。

lifecycle v2.4.0 からは *repeatOnLifecycle(STARTED)* を使うことができる。こちらは *onStart* から評価を開始し *onStop* 時に cancel する。再び *onStart* したときに新たに subscribe し直す。不要な subscribe を解除するという点でこちらのほうが綺麗かもしれない。

ただし Compile SDK に `31` 以上を指定する必要があり 211003 現在 31 のコードは SDK Manager で提供されていない為、開発時の使い勝手が悪くなった。

素の `flow {}` ではなく ReplaySubject や BehaviorSubject として Flow を扱っている場合 Subscribe する側の見え方は *launchWhenStarted* と *repeatOnLifecycle(STARTED)* のどちらでも同じな為、急いで *repeatOnLifecycle(STARTED)* を使う必要はなさそう。

- - -

timestamp  
2021-10-03 (First edition)
