# Cisco Config Studio

Ciscoのパラメーターシート(Excel)から設定コマンド・確認用チェックシート・ネットワーク構成図(Mermaid)を生成する社内ツール。**完全にクライアントサイドで動作する静的サイト**(`next.config.ts`で`output: "export"`)。バックエンド・APIは存在せず、今後も追加しない前提(入力データが外部に送信されないことが設計上の売り)。

## 開発・デプロイ

```bash
npm run dev    # http://localhost:3000
npm run build  # 静的エクスポートを out/ に生成
npm run lint
```

`main`へのpushで`.github/workflows/deploy-pages.yml`が自動実行され、GitHub Pagesに公開される。GitHub Pagesはプロジェクトサブパス(`/<repo名>/`)配下で公開されるため、CIビルド時のみ環境変数`GITHUB_PAGES_BASE_PATH`経由で`next.config.ts`の`basePath`を設定している(ワークフロー内でリポジトリ名から自動設定、ローカル開発では何も設定不要)。

## 既知の制約・ハマりどころ

- **`next/font/google`は使わない。** Turbopack + Google Fontsの組み合わせが、GitHub ActionsのLinuxランナー上でのみ`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`という既知の不具合を起こす(ローカルMacでは再現しないため気づきにくい)。フォントはOS標準の日本語フォントスタックにフォールバックしている(`app/globals.css`の`--font-sans`)。
- **`xlsx`(SheetJS)の無料版は、データ検証・条件付き書式・フリーズペインの書き込みに対応していない。** 実際に試して確認済み。使えるのはセルの値とセルコメント(ノート)のみ。パラメーターシートの入力ガイドは、別列の「入力例」ではなく**セルコメント**で実現している([lib/excelTemplate.ts](lib/excelTemplate.ts)の`setComment`/`setHeaderComments`)。本格的なデータ検証(ドロップダウン制限・不正値のブロック)が必要になった場合は`exceljs`への乗り換えが必要(動作検証済み、`lib/excelTemplate.ts`の書き換えで対応可能)。
- **アップロードされたExcelがAIP(Azure Information Protection/Microsoft Purview)の機密度ラベルで暗号化されていると、ブラウザ上では読み込めない。** これは仕様上の制約であり、バグではない(サードパーティJSライブラリでは復号不可能)。`lib/excelParser.ts`の`isEncryptedOfficeContainer`でOLE2/CFBシグネチャを検出し、AIP解除を促す案内を表示している。社内の「外部ダウンロードファイルに自動でAIPがかかる」ポリシーが原因で頻発するため、このエラーメッセージは消さないこと。
- データはサーバーに一切送信されない。この前提を壊す変更(API Route追加、外部送信処理の追加等)は要注意。

## アーキテクチャ概要

| ファイル | 役割 |
|---|---|
| `lib/devices.ts` | 対応機種データベース(手書き。Cisco公式APIとの連携なし。機種追加時は手動でここに追記) |
| `lib/types.ts` | パラメーターシートのデータ型(`ParameterSheet`が唯一の正)|
| `lib/excelSchema.ts` | Excelシート名・列見出しの定義。パーサーとテンプレート生成の両方がここを参照する単一の情報源 |
| `lib/excelTemplate.ts` | パラメーターシートのExcelテンプレートを生成(ダウンロード用) |
| `lib/excelParser.ts` | アップロードされたExcelの読み込み・バリデーション |
| `lib/configGenerator.ts` | パース結果からCisco IOS/IOS-XEコマンドを生成。出力順は `ACL→NAT→VLAN→インターフェース→ルーティング`(ACL/NATはインターフェース側から参照されるため、Cisco CLIの仕様上これより前に定義が必要) |
| `lib/checksheet.ts` | 設定投入後の確認用チェックシートを生成 |
| `lib/mermaidDiagram.ts` | トポロジー情報からMermaid記法のネットワーク図を生成(`graph TD`で上から下に階層化、スイッチ/ルーター/APが中段、PC/サーバー等の端末は見えないリンクで最下段に強制配置) |

コマンド生成は固定のコマンド体系(Ciscoの一般的なIOS/IOS-XE構文)を手書きしているだけで、公式ドキュメントとの自動照合は行っていない。機種固有の構文差異(`device.os`フィールドは現状未使用)は、機能を追加するタイミングで都度対応する。

## デザインの方針

- デジタル庁デザインシステム(`@digital-go-jp/design-tokens` / `@digital-go-jp/tailwind-theme-plugin`)をベースにした**ダークテーマ固定**(ライト/ダーク切り替えなし)。コントラスト比はWCAG AA基準で検証済み
- UIコンポーネントは`components/ui/`配下。色は`app/globals.css`で定義したセマンティックトークン(`app-bg`/`app-surface`/`app-text`/`app-accent`等)を使う。`solid-gray-*`などの生トークンをコンポーネントで直接使わない
- 処理が一瞬で終わる場合でも、`lib/minDuration.ts`で最低限の表示時間を確保し、ローディング表現が一瞬でチラつかないようにしている

## テスト用サンプル

`samples/`に記入済みのデモ用パラメーターシートあり(ダミー値のみ、実際の機密情報は含まない)。新機能を試す際は、この構造を参考に拡張したテストファイルをNode(`xlsx`パッケージ)で生成し、ブラウザの`input[type=file]`に`DataTransfer`経由で注入してアップロードをシミュレートするのが手早い(ダウンロードリンクの`blob:`URLをフックしてバイト列を取得する手法も有効)。
