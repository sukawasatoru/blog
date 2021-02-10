Surface Pro 3 Recovery
======================

Surface Pro 3 を復旧するメモ

Suraface Pro 3 からユーティリティを使用して USB に回復ディスクを作ってはいけない
--------------------------------------------------------------------------------

通常の PC で USB メモリなど外部ストレージを使用し復旧する際はその PC で作成した回復ディスクを使用して復旧する。

ただし Surface Pro 3 ではこの方法で復旧することが出来ない。復旧中に SSD のパーティションを書き換えている段階あたりで必ず 問題が発生しました 的なメッセージが表示され失敗されてしまう。

Surface Pro 3 の回復ディスクを作成する
--------------------------------------

ユーティリティを使用せずに回復ディスクを作成すれば問題ない。  
作成にはどの PC を利用しても良い

回復ディスクを作成するためまず
[Download a recovery image for your Surface](https://support.microsoft.com/surfacerecoveryimage)
からイメージをダウンロードする。なおダウンロードするためには予め Surface Pro 3 を自分の Live ID に登録する必要があるため、まだ登録していない場合は登録する。  
イメージは zip でアーカイブされているのでダウンロードが完了したらそれを展開する。
Boot や EFI という名前のディレクトリやファイルが展開される。

次に回復ディスクを作成するために USB メモリをフォーマットする。  
使用するディスクは 8GB - 64GB のものを使用し FAT32 でフォーマットする。
回復ディスクを作成するために最低 8GB が必要。FAT32 でフォーマットできれば恐らく 128GB のメモリを使用しても良いが試していない。

フォーマットが完了したら zip を展開したファイル (Boot や EFI など) をすべて USB メモリの root にコピーする。

回復する
--------

通常の方法で。

ref.  
[Download a recovery image for your Surface](https://support.microsoft.com/surfacerecoveryimage)  
[Creating and using a USB recovery drive](https://support.microsoft.com/help/4023512/surface-creating-and-using-a-usb-recovery-drive)

- - -

timestamp  
2018-01-21 (First edition)
