Android Things
==============

Raspberry Pi 3 に Android Things を install したときのメモ。  
https://developer.android.com/things/hardware/raspberrypi.html を上から読んでいけばその通りに設定できたので、とくに難しいことは無かった。  
[Console](https://partner.android.com/things/console) で作成した Image は試していないです。

使ったもの
----------

- Raspberry Pi 3 Model B
- micro SD
    - 8GB 以上であれば何でもいいと思うけれど余っていた [これ](https://amazon.jp/dp/B008CTGX2U) を使った
- USB - TTL Serial cable
    - 何でもいいと思うけれど [これ](https://amazon.jp/dp/B014CA59P4) を使った
- HDMI cable
- micro USB cable

WiFi のネットワーク設定には Ethernet cable か Serial cable のどちらかが必要なようなので Serial を使用した

手順
----

### Image を準備する ###

1. Image のダウンロード
    https://developer.android.com/things/preview/download.html
2. SD を FAT32 でフォーマットする
3. dd で SD に Image を書く
    コマンドはリンクが張ってあるのでそちらを参照すれば良い
    https://www.raspberrypi.org/documentation/installation/installing-images/mac.md
    自分が使用したコマンドは `sudo dd bs=1m if=iot_rpi3.img of=/dev/rdisk2`

### Android Things の起動、ネットワーク設定 ###

1. SD カードを Raspberry pi に挿入する
2. Serial cable を接続する
    端子のつなぎ方や通信の設定は https://developer.android.com/things/hardware/raspberrypi.html#serial_debug_console の section に書いてある
    mac を使っているのでリンクが張ってあった Serial を App Store から買った
3. HDMI cable と 電源 (micro USB) を繋ぐ
4. しばらくすると boot animation が終わり Home っぽい画面に遷移する
5. Serial から以下を入力し WiFi を設定する
    `am startservice -n com.google.wifisetup/.WifiSetupService -a WifiSetupService.Connect -e ssid <SSID> -e passphrase <password>`
6. 1分弱待つと Home に <SSID> や IP Address が表示される
7. `adb connect <IP Address>` で connect 出来れば完了

refs.

https://developer.android.com/things/index.html
https://developer.android.com/things/hardware/raspberrypi.html
https://developer.android.com/things/preview/download.html
