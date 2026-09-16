# RARβ Cloudflare R2 一時PDF保管｜実装提案（未実装）

最終更新: 2026-09-16

> STATUS: PROPOSED / NOT IMPLEMENTED
>
> このファイルは設計確認用。RARβ本番コード・Firebase公開版・Cloudflare設定には影響しない。
> Owner（でかぷ）の確認後にのみ実装する。

## 確認済み正式要件

- 協力者が公式募集カタログPDF＋公式測尺PDFを提出する。
- 2 PDFをCloudflare R2 `rar-beta-pdf-temp` に一時保管する。
- Ownerは提出された実PDFを採点ソースとして受け取る。
- 採点は No.1〜10 → … → No.81〜82 の手動ロット開始を維持する。
- 82頭完了＋RAR本体への結果送信成功後、該当2 PDFを即削除する。
- 未処理PDFはR2 Lifecycleで提出20日後に自動削除する。
- SHA-256、ファイル名、ページ数、提出者、日時、採点結果、QA等の軽量データのみ永続化可能。
- R2 SecretをクライアントHTMLへ埋め込まない。
- Public AccessはDisabledを維持する。

## 現在のRARβとの差分監査

現行 `rar-beta-release/rar-builder.html` は NO_PDF_PERSISTENCE 版。

現在のContributor送信:
1. ブラウザ内でPDFを読み込む
2. SHA-256 / ページ数 / 測尺照合を実施
3. Firestore `builderSubmissions` へメタデータのみ保存
4. PDF bytesは保存しない

現在のOwner:
- `builderSubmissions` のメタデータのみ取得
- `採点にセット` は受信検証情報を採点ソース扱いする
- 実PDFは受信しない

現在のDeploy Workflow:
- `.github/workflows/rar-beta-firebase-deploy.yml` のAuditが
  - `NO_PDF_PERSISTENCE`
  - `PDF本体は保存しません`
  を必須文字列として検査している。
- R2正式版実装時はこのAudit契約も同時に置換が必要。

Firestore Rules:
- `builderSubmissions` はContributor create、Manager read/update/deleteが可能。
- R2 object key / upload state / deletion state等の軽量メタデータ追加時は許可フィールド方針を再監査する。

## 推奨アーキテクチャ（確認待ち）

### 1. Upload
RARβ Contributor
→ 認証済みバックエンドへUpload URL要求
→ バックエンドが短時間Presigned PUT URLを発行
→ ブラウザがPDFをR2へ直接PUT
→ 成功後にFirestoreへsubmission metadataを記録

### 2. Owner Download
RARβ Owner
→ バックエンドへDownload URL要求
→ Owner権限を検証
→ 短時間Presigned GET URLを発行
→ OwnerブラウザがR2から実PDFを取得

### 3. Completion Delete
82頭採点完了
→ RAR本体への結果送信成功を確認
→ バックエンドが対象submissionの2 objectをR2から削除
→ Firestoreは `pdf_deleted_at` 等の軽量状態だけ残す

### 4. Failsafe
未処理object
→ R2 Lifecycle `delete-after-20-days`
→ 提出20日後に削除

## Presigned URL発行バックエンド候補

既存のGoogle Cloud Runを利用する案。

理由:
- RAR課金リスクMASTERに既存登録済みで、新しい課金サービスを増やさない。
- R2 Access Key / Secretをサーバー側だけに保持できる。
- ブラウザにR2 Secretを配布せずに済む。
- PUT/GETのPDF bytesはPresigned URLでR2とブラウザが直接通信でき、Cloud RunへPDF本体を常時中継する必要がない。

※ Cloud Runの具体的サービス・既存backend実体はrepo内からは確認できていないため、実装前に実在構成を特定する。

## CORS提案

RARβ本番originだけを許可する最小構成候補:

```json
[
  {
    "AllowedOrigins": [
      "https://rar-project-5a27e.web.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

DELETEはブラウザに許可せず、バックエンド側だけで実行する。

## 想定R2 Object Key

例:
- `submissions/{submissionId}/catalog.pdf`
- `submissions/{submissionId}/measurements.pdf`

永続メタデータにはobject keyを保持可能だが、Public URLは保持しない。

## Firestore submission schema候補

現行フィールドを維持しつつ追加候補:
- `storage_policy: "R2_TEMPORARY"`
- `r2.catalog_object_key`
- `r2.measurements_object_key`
- `upload_status`
- `pdf_deleted_at`
- `pdf_delete_reason`
- `result_sent_at`

Secret / Presigned URL自体はFirestoreへ保存しない。

## 実装時の変更対象

1. `rar-beta-release/rar-builder.html`
   - Contributor送信をR2 upload対応へ置換
   - Owner一覧から実PDF取得
   - 受信PDFを採点ソースに設定
   - 結果送信成功後Delete API呼び出し
2. `rar-beta-release/firestore.rules`
   - submission metadata schemaの権限制御監査
3. `.github/workflows/rar-beta-firebase-deploy.yml`
   - NO_PDF_PERSISTENCE監査契約をR2_TEMPORARY契約へ変更
4. Backend
   - Presigned PUT
   - Presigned GET
   - DeleteObject
   - Firebase Auth token / Owner権限検証
5. Cloudflare R2 CORS
   - Firebase Hosting originのみ許可

## セキュリティ固定事項

- R2 Access Key / SecretはXMind保管。
- 値そのものをGitHub通常ファイル・RAR MASTER・チャット本文へ保存しない。
- HTMLへSecretを埋め込まない。
- R2 Public AccessはDisabled。
- Presigned URLは短時間・特定object・特定methodに限定。
- BrowserからDELETEを直接許可しない。

## 実装開始条件

Owner（でかぷ）が上記構成を確認し「この構成で進める」と承認した後のみ、runtimeコード変更へ進む。
