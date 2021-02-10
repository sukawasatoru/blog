Jenkins
=======

GitHub のために余っている MacBook Pro に Ubuntu と Jenkins Server と Android を build するための Slave を setup したときのメモ

- [OS の Install](#os-の-install)
- [Jenkins の Install 前の準備](#jenkins-の-install-前の準備)
- [Jenkins の Install](#jenkins-の-install)
- [NGINX の Install](#nginx-の-install)
- [Jenkins の setup](#jenkins-の-setup)
- [Slave の setup](#slave-の-setup)
- [Jenkins の Slave の設定](#jenkins-の-slave-の設定)
- [GitHub personal access token の設定](#github-personal-access-token-の設定)
- [Build 確認](#build-確認)
- [gradle.properties の設定](#gradleproperties-の設定)
- [netdata の Install と NGINX の設定](#netdata-の-install-と-nginx-の設定)

OS の Install
-------------

Ubuntu のサイト [The leading operating system for PCs, IoT devices, servers and the cloud \| Ubuntu](https://www.ubuntu.com/) から Server 版 Image を Download する。

version は一般的には LTS で良いと思う。OS を設定するのが好きとか Upgrade の手間を惜しまないのであれば LTS とか気にせず最新のでも良い。

今回は mac 上の Parallels に Install するので新規に VM を作成する。  
Ubuntu だと Parallels の express instllation 機能を使用できるが今回は Ubuntu の Installer を使用した。  
Memory は 1GB を設定した。その他の VM の設定は Default で問題ないが mac との Application の共有や mount や不要な Device を削除した。
一通り設定したら IP Address を固定することで作業がしやすくなるので MAC Address をメモして Router (DHCP Server) の IP を固定する設定をする。  
設定を完了すると Installer が起動する。ここからは特に特別な設定をせず進めた。

Jenkins の Install 前の準備
---------------------------

OS の Install が終わって login 画面まで進んだら login し Jenkins と NGINX を設定する前に作業しやすいように最低限の変更を行った

```bash
# visudo のために default の editor を変更
sudo update-alternatives --config editor

# visudo で NOPASSWD の設定
# visudo を実行したら下の方に以下を設定
# <user 名> ALL=(ALL) NOPASSWD: ALL
sudo visudo

# 更新
sudo apt update
sudo apt upgrade
sudo apt upgrade
sudo apt dist-upgrade
sudo shutdown -r now

# peco と history を組み合わせて操作したいので peco の Install
sudo apt install peco

# 環境変数や History や peco を使いやすくするための key assigin を設定
vim .profile
vim .bashrc
vim .inputrc

# 変更を簡単に反映するために logout して login
# ...

# mac から作業したいので鍵の生成
ssh-keygen -t ed25591 -C "hoge"

mkdir .ssh
chmod 700 .ssh
cat hoge.pub > .ssh/authorized_keys
chmod 644 .ssh/authorized_keys

# mosh 経由で接続したいので mosh の Install
sudo apt install mosh

# mac から接続・~/.ssh/config 設定のために ip の確認
ip a
```

作成した鍵は mac から scp で秘密鍵を転送する。

Jenkins の Install
------------------

Document の通りに Install する

[Jenkins](https://jenkins.io/)  
[Debian Repository for Jenkins](https://pkg.jenkins.io/debian/)

```bash
# Jenkins の為に JVM を Install
sudo apt install openjdk-8-jre-headless

wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -

# 以下を追加
# deb https://pkg.jenkins.io/debian binary/
sudo vim /etc/apt/sources.list

sudo apt update
sudo apt install jenkins
```

Default の設定だと `http://<hostname>:8080/ `が URI になる。
これを `http://<hostname>:8080/jenkins` に変更したいので `/etc/default/jenkins` の一番下にある `JENKINS_ARGS` に `--prefix=$PREFIX` を追加する。  
`JENKINS_ARGS="--webroot=/var/cache/$NAME/war --httpPort=$HTTP_PORT --prefix=$PREFIX"`  
ちなみにこの file は `apt upgrade` で更新すると更新中に上書きをするか聞かれることがあるのでそのときまっさらな状態に上書きしないように注意する。

追加したら `sudo systemctl restart jenkins` で設定を反映させる。

Firewall が有効になっていないので `http://<ip>:8080/jenkins` から確認することが出来る。
確認できたら設定を進めず NGINX の Install を先に行う

NGINX の Install
----------------

`apt install nginx` で Install を行う

Install 後 NGINX を経由して Jenkins を使用できるよう設定を変更する。
Ubuntu の NGINX は `/etc/nginx/sites-available` に設定を書き `/etc/nginx/sites-enable` に Symbolic link を張ることで設定を行う。
設定は今のところは Document [Jenkins behind an NGinX reverse proxy - Jenkins - Jenkins Wiki](https://wiki.jenkins.io/display/JENKINS/Jenkins+behind+an+NGinX+reverse+proxy) に書いてある通りで良い。  
設定を行ったら `sudo nginx -t` で問題ないか確認し `sudo systemctl reload nginx` で設定を反映させる。
問題なく設定できると `http://<ip>/jenkins` で確認できる。

Jenkins の setup
----------------

NGINX で設定した URI から画面通りに進める

途中で Install する Plugin を聞かれるがこの段階では全部チェックを外してしまって良い。
設定が完了するとお馴染みの top page に遷移する。この後お好みで自分の user account を作成しても良いしこのまま admin account で操作しても良い。

GitHub の Repository を Polling して Build を行いたいため必要な Plugin を Install する。
*Manage Jenkins* -> *Manage Plugins* から以下の Plugin を Install した。

|               name                |                                                                                                               description                                                                                                               |
|:--------------------------------- |:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pipeline                          | Jenkinsfile で Build するために使用 [https://plugins.jenkins.io/workflow-aggregator](https://plugins.jenkins.io/workflow-aggregator)                                                                                                    |
| Pipeline: GitHub                  | GitHub から Build するために使用 [https://wiki.jenkins.io/display/JENKINS/Pipeline+Github+Plugin](https://wiki.jenkins.io/display/JENKINS/Pipeline+Github+Plugin)                                                                       |
| GitHub Organization Folder Plugin | GitHub の account にある Repository を polling するために使用。ある特定の Repository だけ polling したいのであれば不要。 [https://plugins.jenkins.io/github-organization-folder](https://plugins.jenkins.io/github-organization-folder) |
| Mask Passwords Plugin             | Jenkinsfile で Credential を使用するなど Output console に出力される token を mask するために使用 [https://plugins.jenkins.io/mask-passwords](https://plugins.jenkins.io/mask-passwords)                                                |
| SSH Slaves                        | Slave を簡単に設定するために使用 [https://plugins.jenkins.io/ssh-slaves ](https://plugins.jenkins.io/ssh-slaves)                                                                                                                        |

Slave の setup
--------------

Android の Build に使用する Slave を setup する。
OS の Install や setup の前準備は上記と同じで良い。

どちらも終わったら Android SDK の setup を行う。
Android SDK を使用するためには JDK の Install と build-tools で使用する package を apt で Install する必要があるため Document [Establishing a Build Environment &nbsp;|&nbsp; Android Open Source Project](https://source.android.com/setup/initializing) を参考に設定する。

```bash
sudo apt install openjdk-8-jdk-headless
sudo apt install git-core gnupg flex bison gperf build-essential zip curl zlib1g-dev gcc-multilib g++-multilib libc6-dev-i386 lib32ncurses5-dev x11proto-core-dev libx11-dev lib32z-dev ccache libgl1-mesa-dev libxml2-utils xsltproc unzip
```

次に Android SDK の download と setup を行う。  
Android SDK は [Download Android Studio and SDK Tools | Android Studio](https://developer.android.com/studio/index.html#downloads) から最新の SDK を Download する。
Download した SDK は /opt に展開して使用することにする。
展開後は自分の環境で Build に必要な package を Install する

```bash
curl -LO https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip
unzip -d android-sdk-linux sdk-tools-linux-3859397.zip
sudo mv android-sdk-linux/ /opt/

# 既存の package を更新
/opt/android-sdk-linux/tools/bin/sdkmanager --update

# 必要な package を確認
/opt/android-sdk-linux/tools/bin/sdkmanager --list

# package の Install
# 使用する Version の build-tools と platforms を指定する
# Gradle v4.1 以降の環境であれば extras は特に必要無い
/opt/android-sdk-linux/tools/bin/sdkmanager 'build-tools;27.0.3' 'platforms;android-27' 'platforms;android-26' 'platforms;android-25' 'platforms;android-24' 'platforms;android-23' 'platforms;android-22' 'platforms;android-21'
```

Android SDK の setup が完了したら次に Jenkins の node として使用する user account と Jenkins から SSH 経由で接続するための鍵を生成する。
鍵は今のところは ed_25519 ではなく RSA を使用するのがトラブル無く良さそう。

```bash
sudo adduser jenkinsbuild
sudo su jenkinsbuild

# ここから jenkinsbuild
ssh-keygen -b 4096 -t rsa -C "ubuntu jenkins"

mkdir .ssh
chmod 700 .ssh/
cat id_rsa-ubuntu-jenkins.pub > .ssh/authorized_keys
chmod 644 .ssh/authorized_keys
```


Jenkins の Slave の設定
-----------------------

秘密鍵は Jenkins の *Credentials* に Copy Paste を行い設定する

Credentials に登録したらそれを用いて Slave を登録する。
*Manage Jenkins* -> *Manage Nodes* から *New Node* で設定を行う。

![jenkins-slave.png](/jenkins-slave.png)

*Remote root directory* は Build 用に作成した user の home directory を指定した。  
*Labels* は Jenkinsfile から使用する Slave を設定するために付けた。  
*Launch method* の *Host Key Verification Strategy* は *Non verifying Verification Strategy* を設定した。  
*Node Properties* の *Environment variables* から Android SDK に必要な環境変数を [Establishing a Build Environment &nbsp;|&nbsp; Android Open Source Project](https://source.android.com/setup/initializing) の Document を参照して定義した。

GitHub personal access token の設定
-----------------------------------

GitHub の Repository を pull、Build Status の更新をするために access token を設定する

GitHub の *Settings* から *Developer settings* -> *Personal access tokens* を選択し *Generate new token* の Button を押す。
必要は権限は *Repo* の *Full control of private repositories* だけでよい。private repository を使用していない場合など必要に応じてさらに権限を絞っても良い。
生成した token は Jenkins の *Credentials* から *Add Credentials* を行う。

*Kind* は Username with password を設定する。  
*Username* は空欄にする。  
*Password* に生成した token を設定する。  
*Description* は分かりやすい適当な値を設定する。  
*ID* は Jenkinsfile で使用する値である。お好みで自分で設定してもよいし空欄にして自動生成させるのも良い。

Build 確認
----------

Build できるまで設定できたので実際に Build を行い設定してみる

Jenkins の *New Item* から *GitHub Organization* を選択する。  
*GitHub Organization* の *Credentials* には GitHub で生成した token を指定し *owner* を適切に設定する。  
そのほかお好みで *Scan Organization Triggers* の *Periodically if not otherwise run* の *Interval* を設定する。  
その他は Default で特に問題ない。

設定すると *owner* で設定した account の Repository の scan が始まる。
Repository の root に Jenkinsfile が格納されていれば Jenkins にその Repository と Branch が登録され Build が始まる。

自分は test 用の repository を作成し以下の Jenkinsfile を書いた。
```jenkinsfile
pipeline {
    agent { label 'android' }

    stages {
        stage('Build') {
            steps {
                sh './gradlew --info --profile --no-daemon build'
            }
        }

        stage('Report') {
            steps {
                withCredentials([string(credentialsId: '5f36d99d-2541-46a5-9ee1-94a9e2ea338e', variable: 'SONAR_LOGIN')]) {
                    sh './gradlew --info --no-daemon -Dsonar.organization=sukawasatoru-github -Dsonar.host.url=https://sonarcloud.io -Dsonar.login=$SONAR_LOGIN sonarqube'
                }
            }
        }
    }
}
```

適切に設定できていればエラー無く Build 出来たことを Jenkins と GitHub の commit status から確認できる。

gradle.properties の設定
------------------------

Slave に Build 用に作成した account の `$HOME/.gradle/gradle.properties` に gradle の設定を行う	

no-daemon と android cache の設定は恐らく必要でそのほか JVM の memory の設定も行う。

```properties
org.gradle.daemon=false
android.enableBuildCache=false
```

netdata の Install と NGINX の設定
----------------------------------

Jenkins の VM と Slave の VM の状態を Browser から確認したいので [netdata](https://github.com/firehol/netdata) の Install を行う。
Install 方法は色々あるが Build されたものを [Installation · firehol/netdata Wiki](https://github.com/firehol/netdata/wiki/Installation) を参考に Install する。


```bash
bash <(curl -Ss https://my-netdata.io/kickstart-static64.sh)
```


Install できたら 2つの netdata を Jenkins で使用している NGINX から参照できるよう設定する。
設定は Document [Running behind nginx · firehol/netdata Wiki](https://github.com/firehol/netdata/wiki/Running-behind-nginx#as-a-subfolder-for-multiple-netdata-servers-via-one-nginx) を参照して行う。ほぼ書かれているとおりに行って問題ない。

refs.  
[The leading operating system for PCs, IoT devices, servers and the cloud | Ubuntu](https://www.ubuntu.com/)  
[Jenkins](https://jenkins.io/)  
[Debian Repository for Jenkins](https://pkg.jenkins.io/debian/)  
[Jenkins behind an NGinX reverse proxy - Jenkins - Jenkins Wiki](https://wiki.jenkins.io/display/JENKINS/Jenkins+behind+an+NGinX+reverse+proxy)  
[Pipeline](https://plugins.jenkins.io/workflow-aggregator)  
[Pipeline Github Plugin - Jenkins - Jenkins Wiki](https://wiki.jenkins.io/display/JENKINS/Pipeline+Github+Plugin)  
[GitHub Organization Folder](https://plugins.jenkins.io/github-organization-folder)  
[Mask Passwords](https://plugins.jenkins.io/mask-passwords)  
[SSH Slaves](https://plugins.jenkins.io/ssh-slaves)  
[Establishing a Build Environment &nbsp;|&nbsp; Android Open Source Project](https://source.android.com/setup/initializing)  
[Download Android Studio and SDK Tools | Android Studio](https://developer.android.com/studio/index.html#downloads)  
[Establishing a Build Environment &nbsp;|&nbsp; Android Open Source Project](https://source.android.com/setup/initializing)  
[firehol/netdata: Get control of your servers. Simple. Effective. Awesome! https://my-netdata.io/](https://github.com/firehol/netdata)  
[Installation · firehol/netdata Wiki](https://github.com/firehol/netdata/wiki/Installation)  
[Running behind nginx · firehol/netdata Wiki](https://github.com/firehol/netdata/wiki/Running-behind-nginx#as-a-subfolder-for-multiple-netdata-servers-via-one-nginx)

- - -

timestamp  
2017-12-24 (First edition)  
2020-02-07 (Last modify)
