Android 向けの Unity に入門する
===============================

Unity を使えるとできることの幅が大きく広がるので Android 上で動かしてみました。

210223時点での Unity 歴は (Ubuntu で起動した Unity の) ロボットのシミュレーターに使用する Plugin を書いたことがある程度でほとんど分かっていないです。

とりあえず [GitHub のサンプルコード uaal-example](https://github.com/Unity-Technologies/uaal-example) と [そのドキュメント](https://github.com/Unity-Technologies/uaal-example/blob/master/docs/android.md ) と [公式のドキュメント](https://docs.unity3d.com/2020.2/Documentation/Manual/android.html) が用意されているのでそれに従って進めていきます。

Android 上で起動するだけであれば GitHub だけを見ていれば十分で unity3d.com の方は参考程度に読めば大丈夫でした。

今回作ったものは [GitHub](https://github.com/sukawasatoru/android-hello-unity) に push してあります。

Ubuntu 上に Unity を Install する
---------------------------------

[Unity - Manual: Android environment setup](https://docs.unity3d.com/2020.2/Documentation/Manual/android-sdksetup.html) に従えばいいのでわざわざ Install 手順を書かなくても、、と思ったのですが Ubuntu で実行する場合に 1つポイントがありました。 Unity Hub と適当な Version の Unity を Install し *Projects* Tab から *ADD* で適当な Project を新規作成する必要があります。何でもいいのでまず新規作成をしないとなぜか既存の Project が開けませんでした。

macOS からだと特にそんなことはないですし Ubuntu から Unity を使う人は珍しいと思いますが、、、

そのほか手元の Ubuntu 20.04 では *libgconf-2-4* が足りていなかったので `sudo apt install libgconf-2-4` で入れてしまいます。

既存の Gradle で構成された Android Project に組み込む
-----------------------------------------------------

Android Project は適当に用意しておきます。 Directory 構成は [uaal-example](https://github.com/Unity-Technologies/uaal-example) を参考に次のようにしました:

```
`- project-root
  `- app // これが App の本体
    `- build.gradle      // App の Gradle script / これを編集して unityLibrary を組み込む
  `- UnityProject        // Unity で開く Project
    `- androidBuild      // Unity で Export した Android Project
      `- launcher        // Unity から Export された Project のひとつ / 今回は使用しない
      `- unityLibrary    // Unity から Export された Project のひとつ / 今回はこれを app に組み込む
      `- build.gradle    // Unity から Export された Gradle script / これを使用しないようにする必要がある
      `- settings.gradle // Unity から Export された Gradle script / これを使用しないようにする必要がある
  `- build.gradle        // Project の Root の Gradle script
  `- settings.gradle     // Project の Root の Gradle script / これを編集して unityLibrary を組み込む
```

Android 本体の module *app* から使用するのは Export した *UnityProject/androidBuild/unityLibrary* だけです。 *unityLibrary* を Gradle project に設定するのも 1つポイントがあります。

[GitHub のドキュメント](https://github.com/Unity-Technologies/uaal-example/blob/master/docs/android.md) にはさらっと書いてありましたが Root の *settings.gradle* には

```groovy
include ':app', ':unityLibrary'
project(':unityLibrary').projectDir = file('UnityProject/androidBuild/unityLibrary')
```

といったように projectDir を設定する必要があります。これは Unity から Export される Project は他の Project から Import されるように Gradle script が書かれていないからです。たとえば Root の *settings.gradle* で `include ':UnityProject:androidBuild:unityLibrary'` というように設定すると *UnityProject/androidBuild/settings.gradle* が読み込まれてしまうので、これを回避する必要があります。

最新の Gradle を使用する
------------------------

[unity3d.com のドキュメント](https://docs.unity3d.com/2020.2/Documentation/Manual/android-gradle-overview.html) を見ると現時点で最新の Unity v2020.2 で使用する Gradle の Version は 5.6.4 です。

これはちょっといやな感じがするところで Gradle を使用して Android を Build するには AGP (Android Gradle plugin) を使用する必要が有り AGP を使用するには基本的に [対応している Version の Gradle](https://developer.android.com/studio/releases/gradle-plugin#updating-gradle) を使用する必要があります (違う Version の Gradle を使うこともできるのですが Gradle は Minor version が上がってもよく壊れるので、、、)。

[対応している Version の List](https://developer.android.com/studio/releases/gradle-plugin#updating-gradle) をみると Gradle v5.6.4 を使用する場合 AGP v3.6.4 を使用する必要があります。ギリギリ View Binding にも対応しますし非常に困るといったことはなさそうですが、基本的に Gradle は Version が上がると Build が速くなりますし、 AGP も新しくしないと最新の OS を targetSdkVersion に指定できなかったり Android Studio から最新の機能を使えなかったりするので AGP は最新 (少なくとも 210223 現在安定している 4.0.2) を使いたいですよね。

何とかできないか Unity で Export した Gradle script を見たら 5.6.4 でないといけない理由が無さそうでした。ということで最新の AGP とそれに対応する Gradle を使ってみると問題なく Build できました。

unity3d.com のドキュメントにある Version は Unity が Template にしようしている Gradle の Version がたまたま 5.6.4 だっただけみたいですね。

必要な Android Resources を追加する
-----------------------------------

UnityPlayer を new したときに Android の string を読み込むので Resource を用意してあげないと new した瞬間に落ちます。 strings.xml に値を定義しましょう:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<resources>
    <string name="game_view_content_description">Game view</string>
</resources>
```

CI で Build する
----------------

TODO: 後で書く

Android TV で動かす
-------------------

Android 向け Unity は v2019.3 以降 arm しか対応していないようです。ですので Nexus Player は Atom なので動きません。なってこった！

2020年に発売された [Chromecast with Google TV](https://store.google.com/product/chromecast_google_tv) または [BRAVIA](https://www.sony.jp/bravia/) を買いましょう。ちなみに 210223現在の BRAVIA は armv7a です。

refs.  
https://github.com/Unity-Technologies/uaal-example  
https://github.com/Unity-Technologies/uaal-example/blob/master/docs/android.md  
https://docs.unity3d.com/2020.2/Documentation/Manual/android.html  
https://developer.android.com/studio/releases/gradle-plugin#updating-gradle  
https://store.google.com/product/chromecast_google_tv  
https://www.sony.jp/bravia/

- - -

timestamp  
2021-02-23 (First edition)
