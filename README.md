# Cisco Config Studio

Ciscoのパラメーターシート(Excel)から、設定コマンド・確認用チェックシート・ネットワーク構成図(Mermaid)を生成するツールです。すべての処理はブラウザ内で完結し、入力データが外部サーバーに送信されることはありません。

## ローカルで動かす(開発・動作確認用)

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

## 会社PCなど、Node.jsを入れられない環境での使い方

このアプリは完全にブラウザ内で動く静的サイトとして公開されています。**Node.jsのインストールもgit cloneも不要**で、以下のURLをブラウザで開くだけで使えます。

```
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

ログインも不要なので、社内ネットワークからgithub.comを閲覧できる環境であればそのまま利用できます。

## GitHub Pagesへの公開手順(初回のみ)

1. GitHubで**Public**リポジトリを新規作成し、このプロジェクトをpushする
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```
2. GitHubのリポジトリ画面で **Settings → Pages** を開き、「Build and deployment」の **Source** を `GitHub Actions` に設定する
3. `main` ブランチにpushすると `.github/workflows/deploy-pages.yml` が自動実行され、数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される
4. 以降は `main` にpushするたびに自動で再デプロイされる

### 補足: basePathについて

GitHub Pagesはプロジェクト単位だと `/<リポジトリ名>/` 以下のサブパスで公開されるため、CIビルド時のみ `next.config.ts` が `GITHUB_PAGES_BASE_PATH` 環境変数(ワークフロー内でリポジトリ名から自動設定)を見てパスを調整します。ローカルの `npm run dev` / `npm run build` では何も設定しなくて構いません。

## 課内での標準利用に向けて

- まずは個人のGitHubアカウントで公開し、使い勝手を確認するのがおすすめです。
- 継続的に課の標準ツールとして使う場合は、特定個人のアカウントに依存しないよう、GitHub Organization(無料枠で作成可能)への移管を検討してください。
- 利用者が増える場合は、情報システム部門に外部GitHub Pagesの利用について一声かけておくと、後々のトラブルを避けやすくなります。
