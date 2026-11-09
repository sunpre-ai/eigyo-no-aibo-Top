# 営業の相棒の玄関

社員が使うURLを固定する、GitHub Pages用の静的な入口です。アプリ本体・業務データ・認証情報は置きません。

## 普段の変更

`config.js` の `gasUrl` 1行で転送先を変更します。初期値は本体 `src/Index.html` の「画面を最新版に更新」リンクから取得した公開URLです。

メンテナンス中は `maintenance: true` にして、`maintenanceMessage` と `resumeAt` を更新します。再開時は `false` に戻します。反映にはGitHub Pagesの再公開が必要です。既に開いている本体を停止する機能ではありません。

## 動くロード画面

3番の案をもとに作成した水色の鳥アイコンがふわっと上下し、吹き出し・星・ドットが動きます。入口を開いて約0.9秒後にGASへ移動します。実際の進捗率を示す表示ではありません。移動が長引く場合の手動ボタンもあります。

GASへ切り替わった後の読込画面はGAS側の管理です。入口のアニメーションを別ドメインのGAS画面の上に表示し続けることはしません。端末の「視差効果／動きを減らす」に対応しています。

## アイコン

- `assets/icon-original.png`：正方形の元画像
- `assets/icon-512.png`、`assets/icon-192.png`：Web用
- `assets/apple-touch-icon.png`：iPhone等用（180px）
- `assets/favicon-32.png`：ブラウザ用

アプリ名は `manifest.json` とApple用メタ情報に設定済みです。iPhoneでは入口URLをSafariで開き「共有 → ホーム画面に追加」を使用します。AndroidやPCでの追加手順・アイコンの保持はブラウザに依存します。自動転送があるため、実際に使う端末でホーム画面登録を確認してください。サービスワーカーやオフライン動作、全画面のPWAは提供しません。

## ローカル確認

追加パッケージは不要です。

```sh
cd /workspace/eigyo-no-aibo-Top
python -m http.server 4173 --bind 127.0.0.1
```

通常の入口はGASへ移動します。ロード画面を確認する際はブラウザの開発用の通信制御で転送を保留できます。メンテナンス表示は `maintenance.html` で確認できます。

## 公開

公開リポジトリで Settings → Pages → Deploy from a branch を選び、初回コミット後の公開ブランチのルートを指定します。公開後、入口からの移動と各端末のアイコンを実機確認してください。GitHubへのpushやPages公開は、ローカルファイル作成とは別の操作です。

この環境はタスクごとに隔離されます。既存チェックアウトを使い、利用者が明示的に求めない限りGit worktreeは作成しません。
