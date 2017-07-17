Android emulator
================

avdmanager で avd を作成したメモ

avd の作成
----------

`avdmanager create avd` で help を確認できるので、基本その通りに実行すれば問題ない。

```sh
avdmanager -v create avd --sdcard 200M --tag android-tv --package 'system-images;android-26;android-tv;x86' --name 26tv-x86 --abi x86 --device tv_1080p
```

|   arg   |                               description                                |
|:------- |:------------------------------------------------------------------------ |
| sdcard  | path またはサイズを入力する。サイズの単位は K または M (c m ではダメ)。  |
| tag     | `avdmanager list device` の `Tag`                                        |
| package | `sdkmanager --list` の `Path`。見切れる場合は `--verbose` を付ける。     |
| name    | お好きな名前                                                             |
| abi     | abi。jni 使っていない限り `x86` で困ったことはない。                     |
| device  | `avdmanager list device` の `id`。数字でも text でもよい                 |

avd のカスタマイズ
------------------

$HOME/.android/avd 以下に `<name>.avd` の directory が作成される。
カスタマイズはその中の config.ini を編集する。hardware-qemu.ini は emulator を起動する際に自動的に書き換えられるファイルのため自分で書き換える必要は無い。
Android TV の avd を動かすために追加で以下の設定を行った。

|      name      |                 description                  |
|:-------------- |:-------------------------------------------- |
| hw.gpu.enabled | true にしないと真っ黒                        |
| hw.ramSize     | 恐らく必須ではないがお好みで                 |
| skin.*         | 正しく設定しないと TV なのに縦長の画面になる |
| vm.heapSize    | 恐らく必須ではないがお好みで                 | 

```diff
@@ -10,15 +10,21 @@
 hw.device.manufacturer=Google
 hw.device.name=tv_1080p
 hw.gps=yes
+hw.gpu.enabled=yes
 hw.keyboard=yes
 hw.keyboard.lid=yes
 hw.lcd.density=320
 hw.mainKeys=yes
+hw.ramSize=2048
 hw.sdCard=yes
 hw.sensors.orientation=no
 hw.sensors.proximity=no
 hw.trackBall=no
 image.sysdir.1=system-images/android-26/android-tv/x86/
 sdcard.size=200M
+skin.dynamic=no
+skin.name=1920x1080
+skin.path=1920x1080
 tag.display=Android TV
 tag.id=android-tv
+vm.heapSize=192
```
