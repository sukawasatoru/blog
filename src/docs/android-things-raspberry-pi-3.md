Android Things
==============

- [Install](#install)
    - [使ったもの](#使ったもの)
    - [手順](#手順)
- [OTA](#ota)


Install
-------

Raspberry Pi 3 に Android Things を install したときのメモ。  
[https://developer.android.com/things/hardware/raspberrypi.html](https://developer.android.com/things/hardware/raspberrypi.html) を上から読んでいけばその通りに設定できたので、とくに難しいことは無かった。リンク張ってあったり丁寧に書いてあったので困ることは無いはず。  
[Console](https://partner.android.com/things/console) で作成した Image は試していないです。

### 使ったもの ###

- Raspberry Pi 3 Model B
- micro SD
    - 8GB 以上であれば何でもいいと思うけれど余っていた [これ](https://amazon.jp/dp/B008CTGX2U) を使った
- USB - TTL Serial cable
    - 何でもいいと思うけれど [これ](https://amazon.jp/dp/B014CA59P4) を使った
- HDMI cable
- micro USB cable

WiFi のネットワーク設定には Ethernet cable か Serial cable のどちらかが必要なようなので Serial を使用した

### 手順 ###

Image を準備する

1. Image のダウンロード  
    https://developer.android.com/things/preview/download.html
2. SD を FAT32 でフォーマットする
3. dd で SD に Image を書く  
    コマンドはリンクが張ってあるのでそちらを参照すれば良い  
    [https://www.raspberrypi.org/documentation/installation/installing-images/mac.md](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md)  
    自分が使用したコマンドは `sudo dd bs=1m if=iot_rpi3.img of=/dev/rdisk2`

Android Things の起動、ネットワーク設定

1. SD カードを Raspberry pi に挿入する
2. Serial cable を接続する  
    端子のつなぎ方や通信の設定は [https://developer.android.com/things/hardware/raspberrypi.html#serial_debug_console](https://developer.android.com/things/hardware/raspberrypi.html#serial_debug_console) の section に書いてある  
    mac を使っているのでリンクが張ってあった Serial を App Store から買った
3. HDMI cable と 電源 (micro USB) を繋ぐ
4. しばらくすると boot animation が終わり Home っぽい画面に遷移する
5. Serial から以下を入力し WiFi を設定する  
    `am startservice -n com.google.wifisetup/.WifiSetupService -a WifiSetupService.Connect -e ssid <SSID> -e passphrase <password>`
6. 1分弱待つと Home に `<SSID>` や IP Address が表示される
7. `adb connect <IP Address>` で connect 出来れば完了

OTA
---

OTA を試みたときのメモ。  
こちらも難しい点はとくになし。

[Android Things Console](https://partner.android.com/things/console)

1. Image の作成  
    Console の FACTORY IMAGES タブから APK を含んだ image を作成する。  
    APK を含まない image を作成すると Filename が *Empty bundle* となり、これを Raspberry Pi に書き込んでも OTA することができない。  
    APK を upload するには [Create a Bundle \| Android Things](https://developer.android.com/things/console/app_bundle.html) に従った、 APK を含んだ zip を作成し、それを upload する。
2. *CREATE BUILD CONFIGURATION* して image を作成する
3. 作成した image を download して Raspberry Pi に書き込む
4. Raspberry Pi を通常起動する  
    Create a Bundle の通りに作成した zip に含んだ APK が起動する。
5. OTA 用の image を作成する  
    作成方法は 1 - 2 の通り。
6. *OTA UPDATES* タブで OTA 用に作成した image を選択し *PUSH TO DEVICES* ボタンを押す  
    計測はしていないが image の自動ダウンロードが始まるまで 5、6 時間掛かるようなことが help に書いてある。  
    download が完了すると以下の log が出力される
```
07-30 00:49:43.035   169   169 I update_engine: [0730/004943:INFO:update_manager-inl.h(52)] ChromeOSPolicy::UpdateCheckAllowed: START
07-30 00:49:43.035   169   169 I update_engine: [0730/004943:INFO:chromeos_policy.cc(322)] Allowing update check.
07-30 00:49:43.036   169   169 I update_engine: [0730/004943:INFO:update_manager-inl.h(74)] ChromeOSPolicy::UpdateCheckAllowed: END
07-30 00:49:43.036   169   169 I update_engine: [0730/004943:INFO:update_attempter.cc(862)] Running periodic update.
07-30 00:49:43.036   169   169 I update_engine: [0730/004943:INFO:update_attempter.cc(205)] Last reported daily metrics 4h55m39.93465s ago.
07-30 00:49:43.036   169   169 I update_engine: [0730/004943:INFO:update_attempter.cc(272)] Not updating b/c we already updated and we're waiting for reboot, we'll ping Omaha instead
07-30 00:49:43.036   169   169 I update_engine: [0730/004943:INFO:metrics.cc(142)] Sending 4 for metric UpdateEngine.Check.Result (enum)
07-30 00:49:43.038   169   169 I update_engine: [0730/004943:INFO:metrics.cc(165)] Sending 4h55m39.933865s for metric UpdateEngine.Check.TimeSinceLastCheckMinutes
07-30 00:49:43.038   169   169 I update_engine: [0730/004943:INFO:metrics.cc(181)] Sending 4h55m39.932121s for metric UpdateEngine.Check.TimeSinceLastCheckUptimeMinutes
07-30 00:49:43.038   169   169 I update_engine: [0730/004943:INFO:action_processor.cc(46)] ActionProcessor: starting OmahaRequestAction
07-30 00:49:43.039   169   169 I update_engine: [0730/004943:INFO:action_processor.cc(116)] ActionProcessor: finished last action OmahaRequestAction with code ErrorCode::kSuccess
07-30 00:49:43.039   169   169 I update_engine: [0730/004943:INFO:update_manager-inl.h(52)] ChromeOSPolicy::UpdateCheckAllowed: START
07-30 00:49:43.039   169   169 I update_engine: [0730/004943:INFO:chromeos_policy.cc(316)] Periodic check interval not satisfied, blocking until 7/30/2017 5:50:23 GMT
07-30 00:49:43.039   169   169 I update_engine: [0730/004943:INFO:update_manager-inl.h(74)] ChromeOSPolicy::UpdateCheckAllowed: END
```
7. Reboot する
    download が完了したら Raspberry Pi を reboot する。  
    再起動すると以下の log が出力される。  
    *OTA UPDATES* タブの Status にはすぐ反映されないが `dumpsys package <package>` で version を確認すると新しい version になっていることが確認できる。  

```
01-01 00:00:07.584   169   169 I update_engine: [0101/000007:INFO:main.cc(113)] Chrome OS Update Engine starting
01-01 00:00:07.633   169   169 I update_engine: [0101/000007:INFO:boot_control_android.cc(78)] Loaded boot_control HAL 'AOSP reference bootctrl HAL' version 0.1 authored by 'The Android Open Source Project'.
01-01 00:00:07.633   169   169 I update_engine: [0101/000007:INFO:real_system_state.cc(63)] Booted in dev mode.
01-01 00:00:07.633   169   169 W update_engine: [0101/000007:WARNING:real_system_state.cc(98)] No powerwash-safe directory, using non-volatile one.
01-01 00:00:07.666   169   169 I update_engine: [0101/000007:INFO:omaha_request_params.cc(66)] Initializing parameters for this update attempt
01-01 00:00:07.689   169   169 I update_engine: [0101/000007:INFO:prefs.cc(122)] img-prop-channel-name not present in /data/misc/update_engine/prefs
01-01 00:00:07.690   169   169 I update_engine: [0101/000007:INFO:prefs.cc(122)] img-prop-powerwash-allowed not present in /data/misc/update_engine/prefs
01-01 00:00:07.690   169   169 I update_engine: [0101/000007:INFO:omaha_request_params.cc(182)] Download channel for this attempt = stable-channel
01-01 00:00:07.690   169   169 I update_engine: [0101/000007:INFO:omaha_request_params.cc(77)] Running from channel stable-channel
01-01 00:00:07.694   169   169 I update_engine: [0101/000007:INFO:real_device_policy_provider.cc(167)] No device policies/settings present.
01-01 00:00:07.696   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(864)] Current Response Signature =
01-01 00:00:07.696   169   169 I update_engine: Payload 0:
01-01 00:00:07.696   169   169 I update_engine:   Size = 1352490
01-01 00:00:07.696   169   169 I update_engine:   Sha256 Hash = 888a1225d41b28234d3756a690cadfe0205a2d4ce0381452e7aa4449beaee951
01-01 00:00:07.696   169   169 I update_engine:   Metadata Size = 918
01-01 00:00:07.696   169   169 I update_engine:   Metadata Signature = o6FWPHdrWi/OFzgh5Y7AY2AdM6aBfkM/fIPUhDq4LV/d/mJ87+ve9o8u5gBj+Vg0Qa7XKrzdAHqwPR7U61dPidnlFYzH2No+Raxx8v6VijvKg/q3s36tEZwMQO6+onvvNbofFFWpZ0qv2cQUghWL6A9xeTGm0g6G8yrGmoY+QXVWo/bCR1rEzG2Eo82Kq8i62WE7HA6zBDRx+UWDnNH3RomJZBKhNP8YP83zLmFBiHezSglHPZjMxmaP+Yv9PSvRwboIG9aMGvjylX3S46lw2hkbQxlXEiAh4ezh0hae71DwsC1UsE4TELAFRf1jMzTdVjs7zPleQUAlCA2EhcmHeA==
01-01 00:00:07.696   169   169 I update_engine:   Is Delta = 0
01-01 00:00:07.696   169   169 I update_engine:   NumURLs = 1
01-01 00:00:07.696   169   169 I update_engine:   Candidate Url0 = http://storage.googleapis.com/app-payloads-prod/2ndknh/2/full.payload
01-01 00:00:07.696   169   169 I update_engine: Payload 1:
01-01 00:00:07.696   169   169 I update_engine:   Size = 5829
01-01 00:00:07.696   169   169 I update_engine:   Sha256 Hash = 8c94194a4b391e5ca7386157ca3d1f1c2664a458587c45eed29a6122f823c56a
01-01 00:00:07.696   169   169 I update_engine:   Metadata Size = 133
01-01 00:00:07.696   169   169 I update_engine:   Metadata Signature = bSOI7iPs6C63Bf6pxIL8LmyAf/L7lR1ag9VHgEutb40jxaNQ0APuYFTSLAjIneNqaxjqJRkBxfu7RzWsFfU5EsHvji6IwN+Nx3iwY4raik0ku4ueV/gOXFrlCxxLYukhqupOvBjMB/abR10ExpQ/i7qrovFhOj6+TxjOPaxOVK2yx0bPMbLVODinQFYg+MlkKQMLaElZ83g9yWIk0aKXuTqfG/ofdxMutcQ+Dx06mqGfvILI3p3D1SFWBfmnhERKrGnS+D7yV4S6sdi4VPB//8R5YL1nyP535/e+8d6dFCQI6mnWdKxJVYVZMbKpQZIwhNbQMbCxYo33u+fSLiKntQ==
01-01 00:00:07.696   169   169 I update_engine:   Is Delta = 0
01-01 00:00:07.696   169   169 I update_engine:   NumURLs = 1
01-01 00:00:07.696   169   169 I update_engine:   Candidate Url0 = http://storage.googleapis.com/app-payloads-prod/2ndknh/2/vbmeta.STABLE_2.USERDEBUG.payload
01-01 00:00:07.696   169   169 I update_engine: Payload 2:
01-01 00:00:07.696   169   169 I update_engine:   Size = 221543
01-01 00:00:07.696   169   169 I update_engine:   Sha256 Hash = c96a2c54ed3bba50e36096a7afaaddc17ad03a54c6f8411cf9b6fd1746ee8d68
01-01 00:00:07.696   169   169 I update_engine:   Metadata Size = 165924
01-01 00:00:07.696   169   169 I update_engine:   Metadata Signature = Nuph8/dJlfEMD5vhs5FV5Y3mm5tkOi5UkY2eGkbYTrnbYYOO4YMwkJ2YSOI+cIt/Ka1ubgJzeH1/6+0ZQ9fwobIQL1krKDPnC+AKaY6PhLQZ2Jr+uEx62CJhs3xJj5+2cyeetbVqTCs+eBfmkZqadpHHh02cpjHePKAUGzKZCtJ5SKjYGGgGIKotw4Myj77z4s22aP8EYdJDXSlfheuXiEGOkPtTnquYb+QG1QQV+TEQlwnGUc6c4GNh3AphbnVgNaMZVDHOoBK7+LcKJ5TnIZgMU2gcwXC8CBf8D+OK2DLd8DYAaRdQvioVgA+OmxnWvwf9RYt+6+SxFul7Xjkc4Q==
01-01 00:00:07.696   169   169 I update_engine:   Is Delta = 1
01-01 00:00:07.696   169   169 I update_engine:   NumURLs = 1
01-01 00:00:07.696   169   169 I update_engine:   Candidate Url0 = http://storage.googleapis.com/os-payloads-prod/rpi3/0.0.0.4098522/userdebug_delta_0.0.0.4098522.payload
01-01 00:00:07.696   169   169 I update_engine: Max Failure Count Per Url = 10
01-01 00:00:07.696   169   169 I update_engine: Disable Payload Backoff = 0
01-01 00:00:07.696   169   169 I update_engine:
01-01 00:00:07.699   147   147 I SurfaceFlinger: SurfaceFlinger is starting
01-01 00:00:07.703   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(880)] Payload Attempt Number = 3
01-01 00:00:07.710   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(888)] Full Payload Attempt Number = 2
01-01 00:00:07.733   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(914)] Current URL Index = 0
01-01 00:00:07.734   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(545)] Current download source: Unknown
01-01 00:00:07.748   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(958)] Current URL (Url0)'s Failure Count = 0
01-01 00:00:07.760   147   147 I SurfaceFlinger: SurfaceFlinger's main thread ready to run. Initializing graphics H/W...
01-01 00:00:07.761   147   147 D libEGL  : Emulator forcing qemu.gles value to -1.
01-01 00:00:07.763   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(947)] URL Switch Count = 0
01-01 00:00:07.786   169   169 E update_engine: [0101/000007:ERROR:payload_state.cc(974)] Invalid backoff expiry time (7/31/2017 5:19:44 GMT) in persisted state. Resetting.
01-01 00:00:07.786   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(985)] Backoff Expiry Time = 4/22/2009 19:24:48 GMT
01-01 00:00:07.788   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1039)] Update Timestamp Start = 1/1/1970 0:00:07 GMT
01-01 00:00:07.788   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1114)] Update Duration Uptime = 0s
01-01 00:00:07.803   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1155)] Current bytes downloaded for HttpsServer = 0
01-01 00:00:07.816   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1180)] Total bytes downloaded for HttpsServer = 0
01-01 00:00:07.830   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1155)] Current bytes downloaded for HttpServer = 0
01-01 00:00:07.840   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1180)] Total bytes downloaded for HttpServer = 0
01-01 00:00:07.847   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1155)] Current bytes downloaded for HttpPeer = 0
01-01 00:00:07.862   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1180)] Total bytes downloaded for HttpPeer = 0
01-01 00:00:07.870   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(763)] Number of Reboots during current update attempt = 0
01-01 00:00:07.881   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1192)] Num Responses Seen = 0
01-01 00:00:07.882   169   169 I update_engine: [0101/000007:INFO:prefs.cc(122)] rollback-version not present in /data/misc/update_engine/powerwash-safe/update_engine/prefs
01-01 00:00:07.891   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1379)] p2p First Attempt Timestamp = 4/22/2009 19:24:48 GMT
01-01 00:00:07.900   169   169 I update_engine: [0101/000007:INFO:payload_state.cc(1364)] p2p Num Attempts = 0
01-01 00:00:07.902   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(52)] ChromeOSPolicy::UpdateCheckAllowed: START
01-01 00:00:07.904   169   169 I update_engine: [0101/000007:INFO:chromeos_policy.cc(316)] Periodic check interval not satisfied, blocking until 1/1/1970 0:11:15 GMT
01-01 00:00:07.904   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(74)] ChromeOSPolicy::UpdateCheckAllowed: END
01-01 00:00:07.919   169   169 I update_engine: [0101/000007:INFO:prefs.cc(122)] attempt-in-progress not present in /data/misc/update_engine/prefs
01-01 00:00:07.920   169   169 E update_engine: [0101/000007:ERROR:payload_state.cc(1263)] time_to_reboot is negative - system_updated_at: 7/29/2017 9:54:11 GMT
01-01 00:00:07.924   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(52)] ChromeOSPolicy::P2PEnabled: START
01-01 00:00:07.924   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(74)] ChromeOSPolicy::P2PEnabled: END
01-01 00:00:07.924   169   169 I update_engine: [0101/000007:INFO:update_attempter.cc(1480)] Not starting p2p at startup since it's not enabled.
01-01 00:00:07.924   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(52)] ChromeOSPolicy::P2PEnabledChanged: START
01-01 00:00:07.924   169   169 I update_engine: [0101/000007:INFO:update_manager-inl.h(74)] ChromeOSPolicy::P2PEnabledChanged: END
```

refs.  
[Android Things \| Android Things](https://developer.android.com/things/index.html)  
[Raspberry Pi 3 \| Android Things](https://developer.android.com/things/hardware/raspberrypi.html)  
[System Image Downloads \| Android Things](https://developer.android.com/things/preview/download.html)  
[Android Things Console](https://partner.android.com/things/console)  
[Create a Bundle \| Android Things](https://developer.android.com/things/console/app_bundle.html)

- - -

timestamp  
2017-07-17 (First edition)  
2020-02-07 (Last modify)
