GitHub Pages から Cloudflare Pages に移行する
=============================================

このサイトは GitHub Pages で管理していましたが以前から興味があった Cloudfalre Pages に移行しました。

移行したことによるメリットは今の所実感していませんがデメリットも特になさそうです。

既に Cloudflare で DNS を管理していたので移行は簡単でした。

GitHub の gh-pages を Cloudflare Pages で Hosting する
------------------------------------------------------

既存のサイトは Repository に Push されると GitHub Actions が自動で走り Next.js の Build や検索に使用する Index 作成の為に Rust の Build といったことをしています。

静的なサイトの場合ボタンをクリックするだけで移行が完了しました。  
移行までに次の手順を行いました:

1. Cloudflare の Dashboard を開く
1. 左 Pane の *Pages* をクリックする
1. 右 Pane の *Create a project* をクリックする
1. GitHub タブから Connect する
1. Connect 後 Cloudflare のページに戻ってくるので Repository を選択し *Begin setup* をクリックする
1. *Production branch* で *gh-pages* を選択する
1. *Build settings* の TextField を全て空欄にする
1. *Save and Deploy* をクリックする
1. Deploy が完了したら *Custom domain* タブの *Set up a custom domain* をクリックする
1. GitHub Pages に使用している Domain を入力し Continue をクリックする
1. Settings タブから *Configure Preview deployments* をクリックする
1. *None* にチェックを入れて *Save* をクリックする

これで完了です。ここまで 5分もかかりませんでした。

Cloudflare Pages でも Build が出来る
------------------------------------

現在 GitHub Actions でサイトの Build を行なっていますが Cloudflare Pages でも月 500回までは無料で Build できます。

Next.js だけで構築されていたなら Build も移行していいかな、と思いましたがこのサイトは Next.js のほか Rust の Build といったこともしているのでまあ移行しなくても良いか、といったモチベーションのため Build については移行していません。
GitHub Actions 相当のことができるようになったら考えるかな、、、

Wrangler を使って Deploy する
-----------------------------

GitHub Actions を使うのであれば Git 連携せずに [wrangler](https://developers.cloudflare.com/workers/wrangler/get-started/) で Deploy するのが良さそうでした。

既に Git 連携している場合は Pages の *Settings* タブの *Builds & deployments* から *Production branch* と *Prebiew branches* の *Automatic deployments* を *Disable* にしておきます。

GitHub Actions から wrangler で Deploy するには環境変数 *CLOUDFLARE_API_TOKEN* と *CLOUDFLARE_ACCOUNT_ID* が必要です。

*CLOUDFLARE_API_TOKEN* は [API Tokens](https://dash.cloudflare.com/profile/api-tokens) から *Create Token* -> *Create Custom Token* で作成することができます。  
設定項目はいくつかありますが *Permissions* で *Account* / *Cloudflare Pages* / *Edit* を設定し残りはデフォルトのままで *Continue to summary* -> *Create token* とすれば大丈夫です。

*CLOUDFLARE_API_TOKEN* は Dashboard の適当なページを開くと表示されているのでその値を使用します。

*CLOUDFLARE_API_TOKEN* と *CLOUDFLARE_ACCOUNT_ID* の準備ができたらあとは Deploy コマンドを実行するだけで `npx wrangler pages publish --project-name <your project name> .` を実行すると 1分弱で Deploy が完了します。

- - -

timestamp  
2022-05-28 (First edition)  
2022-05-29 (Last modify)
