2021年 4月時点で使っている View の構成
======================================

おさらいとして [Android Architecture Blueprints v2](https://github.com/android/architecture-samples) を確認しましょう。

*android / architecture-samples* の XXX-mvp は

- Activity が Fragment や Presenter の setup をしている
- Fragment が TasksContract.View を implements しており View へ命令を出している / View の Event を受け取り Presenter へ命令している

ということをしている。それに加え

todo-mvp{,kotlin} は

- Presenter が TasksContract.Presenter を implements しており Fragment や Repository へ命令している / Repository の結果 (callback) を受け取り Fragment へ命令している

todo-mvp-clean は

- Presenter が TasksContract.Presenter を implements しており Fragment や Task へ命令している / Task の 結果 (Callback) を受け取り Presenter へ命令している
    - Task への命令は UseCaseHandler を使用している / Dispatchers.Default のように裏で Task を実行して結果を Dispatchers.UI で返すというようなことを (テストのために) 抽象化している
- UseCase は特定の入力により結果を返すという関数のようなもの / Repository に依存しているので必ず冪等性があるわけではない / XX をする、 YY をする、といった単位で使われる
    - Future みたいなやつ (正確ではないけれど大体そんな感じ)
    - com.example.android.architecture.blueprints.todoapp.UseCase はそれを表現したもの
- Task が UseCase を extends しており Repository へ命令している

といった感じです。

私が個人の時によく使う構成は

- TasksContract に相当するものは使っていない
    - View に関連する JUnit を書かなくなったので省略するようになった
        - できるだけ冪等性のある関数を実装するようにしてテストしている
- Activity が Fragment を setup する
- Fragment は View (ViewGroup) を生成するだけ
- View (ViewGroup) が Presenter 相当の命令を View 対して行う
    - `flow {}.asLiveData().observe()` する
    - `flow {}` / `callbackFlow {}` 系が増えてきたら機能ごとに LifecycleObserver を implements した class に切り出し
    - onCreate 以外に onStart や onResume を扱いたくなった時は LifecycleObserver を implements した class に切り出し
- ViewModel を扱うときは `Flow.cachedIn()` や MutableSharedFlow といったデータの入れ物として使用して MyViewModel.start() のような Method はほぼ実装していない
    - ほとんどないと思うけど XXX を持たせちゃって Memory leak していた、というのを考えるのが面倒
    - 今後 Fragment ちゃんとやるとしたら Presenter は Fragment が対応して Task は ViewModel が対応するようになるんだろうなーとは思いつつ [(Guide)](https://developer.android.com/topic/libraries/architecture/viewmodel)
- - -

timestamp  
2021-04-26 (First edition)
