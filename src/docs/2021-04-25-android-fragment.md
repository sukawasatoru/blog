Android の Fragment が分からない
================================

Fragment の機能は一通り使ってみて、 onAttach ではこうして onCreate ではこれをして onCreateView ではこれをして etc. というのをしばらくの間やっていました。

数年前 (Kotlin Coroutine が普及する前で Agera とか RxJava いいよねとなっているあたり) ふと思ったのが Fragment を使ったことで何かいいことがあったか、というもので、ちょっと考えてみてもドキュメントの通りに実装したことに満足したけど画面遷移とか TransitionManager 使えばできるしキー入力の制御はできないしわざわざ Fragment を使う理由が無いよなー、と Fragment に対して消極的になっていきます。効果的に使える場面もあって、例えば DialogFragment のように Fragment 単体で機能を Library として提供するとかはあるのですが、結構限定的ですよね、、、

ということで ViewGroup (主に ConstraintLayout) を extends して Container-Component のような View を作成して Activity から直接扱うようにしてみたら、結構うまく動いてしまったのでしばらくそれで開発していきました。

時が流れ Jetpack が充実し画面遷移には Navigation Component も使っていきます。 Navigation Component を使うと Android Studio からは Storyboard 的な UI で画面遷移を視覚的にわかりやすくなり、画面遷移の実装は自動生成されるようになります。

で、この Navgation Component 、 Fragment を使うのである。

また Fragment か! と思いつつ、とりあえず Container-Component ライクな View はそのままにして Fragment は onCreateView だけ override して使うようにすると、とりあえず Navigation Component はうまく動いてくれます。 Fragment の LifecycleOwner が欲しい場合も

```kotlin
fun View.getParentLifecycleOwner(): LifecycleOwner {
    var v = this
    while (true) {
        // via FragmentManager.findFragment.
        v.getTag(androidx.fragment.R.id.fragment_container_view_tag).let {
            if (it is Fragment) {
                return it.viewLifecycleOwner
            }
        }

        v = when (val p = v.parent) {
            is View -> p
            else -> break
        }
    }

    var context = this.context
    while (true) {
        context = when (context) {
            is AppCompatActivity -> return context
            is ContextWrapper -> context.baseContext
            else -> throw RuntimeException(context.toString())
        }
    }
}
```

として、 View の Constructor の次の tick (View.post とか) で取得すれば解決してしまうんですね。

そのほか Navigation Component 使うと xml とかに実装散らばるし、そのうち飽きて元の実装に戻るんじゃないか、という懸念もだきつつとりあえず 1年ほど使いながら様子を見ています。ここ 1年で Jetpack がだいぶ充実し Jetpack が使えそうな個所は使うと良さそうという風潮もありますし、そろそろ Fragment を使うように戻してもいいのかな。

Jetpack Compose が普及したら Fragment は必須といった感じに評価が変わりそうな気がする。

- - -

timestamp  
2021-04-25 (First edition)
