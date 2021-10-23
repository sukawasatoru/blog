Material You の色を調べた
=========================

[Unveiling Material You - Material Design](https://material.io/blog/announcing-material-you)  
[material-components-android/Color.md at master · material-components/material-components-android](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md)

いつもの Material component を使って `DynamicColors.applyToActivitiesIfAvailable(this);` すれば壁紙またはユーザーが指定した色と連動する値が適用されそうです。

使い方としては以上なのですが Google 製の App ではどういった色の選び方をしているか気になったので調べてみました。

色は [colors.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-12.0.0_r2/core/res/res/values/colors.xml) に定義されており命名に規則がありました。簡単な Compose の実装でリストとして表示してみました:

```kotlin
@Composable
fun ListColorCompose(rootPadding: InsetsPaddingValues?) {
    val context = LocalContext.current

    val items = remember(context) {
        listOf(
            "system_accent1_",
            "system_accent2_",
            "system_accent3_",
            "system_neutral1_",
            "system_neutral2_"
        ).flatMap { prefix ->
            listOf("0", "10", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000")
                .map { suffix ->
                    val name = "$prefix$suffix"
                    val resId = context.resources.getIdentifier(name, "color", "android")
                    if (resId == Resources.ID_NULL) {
                        log.info("ListColorCompose $name == null")
                        return@map "Not Found ($name)" to Color.White
                    }
                    name to Color(context.getColor(resId))
                }
        }
    }

    LazyColumn(
        contentPadding = rootPadding ?: PaddingValues(0.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(
            items = items,
            key = { it.first },
        ) { (name, color) -> ColorItem(name = name, color = color) }
    }
}

@Composable
private fun ColorItem(name: String, color: Color) {
    Surface(color = Color.White) {
        Column {
            Text(text = name)
            Divider(Modifier.fillMaxWidth())
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp),
                color = color,
                content = {},
            )
        }
    }
}
```

こちらの実装は App として動かすか Deploy Preview により確認できます。

<a href="/2021-10-23-system-accent1.png"><img alt="" src="/2021-10-23-system-accent1.png" height="460" /></a>
<a href="/2021-10-23-system-accent2.png"><img alt="" src="/2021-10-23-system-accent2.png" height="460" /></a>
<a href="/2021-10-23-system-accent3.png"><img alt="" src="/2021-10-23-system-accent3.png" height="460" /></a>
<a href="/2021-10-23-system-neutral1.png"><img alt="" src="/2021-10-23-system-neutral1.png" height="460" /></a>
<a href="/2021-10-23-system-neutral2.png"><img alt="" src="/2021-10-23-system-neutral2.png" height="460" /></a>

どうやら壁紙やユーザーによる可変な *system-accent* と ~~固定な~~ *system-neutral* があるようです。 *system-accent* は Dark theme を有効・無効と切り替えても変わりませんでした。  
**追記 (211023): system-neutral も可変でした**

Google 製 App のスクリーンキャプチャーを撮って部品ごとにどの色が使われているのか確認してみました。

GMail:

| Component         | Light              | Dark                |
|:----------------- |:------------------ |:------------------- |
| background        | system_neutral1_10 | system_neutral1_900 |
| search bar        | ?                  | ?                   |
| floating button   | system_accent2_100 | system_accent2_700  |
| drawer background | ?                  | ?                   |
| drawer (selected) | system_accent2_100 | system_accent2_700  |

Settings:

| Component            | Light              | Dark                |
|:-------------------- |:------------------ |:------------------- |
| background           | system_neutral1_50 | system_neutral1_900 |
| button               | system_accent1_200 | system_accent1_200  |
| search bar           | white              | system_accent2_700  |
| button group         | ?                  | system_neutral1_800 |
| button (selected)    | system_accent1_100 | system_accent1_100  |
| graph bar (selected) | system_accent1_600 | system_accent1_100  |
| graph bar            | ?                  | ?                   |

Message:

| Component            | Light              | Dark                |
|:-------------------- |:------------------ |:------------------- |
| background           | system_neutral1_10 | system_neutral1_900 |
| floating button      | system_accent1_100 | system_accent1_700  |
| search bar           | ?                  | ?                   |
| main art             | system_accent1_600 | system_accent1_200  |

GBoard:

| Component            | Light              | Dark                |
|:-------------------- |:------------------ |:------------------- |
| background           | system_neutral1_50 | system_neutral1_900 |
| key                  | white              | system_neutral1_800 | 
| action               | system_accent1_200 | system_accent1_100  |
| operation key        | system_accent2_100 | system_neutral1_700 |
| keyboard type key    | system_accent2_200 | system_accent2_300  |

Phone:

| Component                    | Light                          | Dark                   |
|:---------------------------- |:------------------------------ |:---------------------- |
| background                   | system_neutral1_10             | system_neutral1_900    |
| search bar                   | ?                              | ?                      |
| main art                     | system_accent1_600             | system_accent1_200     |
| floating button              | system_accent1_600             | system_accent1_200     |
| navigation botton            | ? (search bar と同じ)          | ? (search bar と同じ)  |
| navigation button (selected) | system_accent2_100             | d:system_accent2_700   |
| dialpad text                 | system_accent1_600             | d:system_accent1_200   |
| dialpad backgroun            | ?(near system_accent1_50..100) | ?                      |
| call                         | (app original green)           | (app original green)   |

Calculator:

| Component            | Light              | Dark                |
|:-------------------- |:------------------ |:------------------- |
| background           | system_neutral1_10 | system_neutral1_900 |
| ac button            | system_accent3_100 | system_accent3_100  |
| operator button      | system_accent2_100 | system_accent2_300  |
| equal button         | system_accent1_100 | system_accent1_100  |

Calendar:

| Component                  | Light               | Dark                |
|:-------------------------- |:------------------- |:------------------- |
| background                 | system_accent1_10   | system_neutral1_900 |
| floating button            | system_accent2_100  | system_accent2_700  |
| floating button (selected) | system_accent1_600  | system_accent1_200  |
| save button                | system_accent1_600  | system_accent1_200  |
| selected day               | system_accent1_600  | system_accent1_200  |
| icon                       | system_neutral2_700 | system_neutral2_200 |
| drawer selected            | system_accent2_100  | system_accent2_700  |

Tips:

| Component            | Light              | Dark                |
|:-------------------- |:------------------ |:------------------- |
| background           | system_neutral1_50 | system_neutral1_900 |
| button               | white              | system_neutral1_800 |
| icon on button       | system_accent1_100 | system_accent1_100  |

一部 Material You っぽい色が使われているようだけれどどの定義とも一致しない色がありました。

所感としては

- 特定の Component で system_x_y を使用したら Night Mode ON / OFF どちらも system_x を同じにして y を違う色を選べば良さそう
- GBoard は Night Mode ON / OFF で system_x の *x* の部分が違っている
    - そのような選び方をする場合 Background に system_neutral 系の色を選べば良さそう
- 表の `?` の箇所の色の選び方がいいけどうやって色作っているの
- Night Mode OFF の時の背景色は system\_{accent1,neutral1}\_{10,50} を使えば良さそう
    - Material 3 のデフォルトは system\_neutral1\_10
- Night Mode ON の時の背景色は system\_neutral1\_900 を使えば良さそう
    - Material 3 のデフォルトは system\_neutral1\_900
- Settings の Button は Night Mode によって色を変えていない
- ボタンは Night Mode OFF-ON の時に system\_x\_{100,700} や system\_x\_{600,200} の組み合わせが多い
    - Material 3 の x Containerのデフォルトが system\_x\_{100,700}
    - Material 3 の Primary と Secondary のデフォルトが system\_x\_{600,200}
	- system\_x\_{100,100} の組み合わせもそれなりにある

といったものがあり、これってほぼ Material 3 のデフォルトですね。色の選び方は [Applying color to UI - Material Design](https://material.io/design/color/applying-color-to-ui.html) を押さえておけば特に問題なさそうですね。

- - -

timestamp  
2021-10-23 (First edition)  
2021-10-23 (Last modify)
