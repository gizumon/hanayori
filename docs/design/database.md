# Hanayori データベース設計(Firestore)

## 1. 前提・要件

- データストアは **Cloud Firestore**(ネイティブモード)。
- **イベント**は作成者がメンバーを招待でき、**作成者とメンバーのみが読み書き**できる。
- イベント内の**お手紙**には **ULID** が発行され、`/letter/{ulid}` の URL を知っていれば**ログイン不要で誰でも閲覧**できる(推測困難な URL による限定公開)。
- 写真バイナリは Firestore に置かず **Cloud Storage** に保存する(1 ドキュメント 1MiB 制限のため)。

### アクセス経路の整理(実装済み)

**Firestore への読み書きはすべて Next.js サーバー(Route Handler + Admin SDK)経由に統一した。** クライアント(ブラウザ)は Firestore に直接触れない。理由は 2 つ:

1. 正規化を保ったまま(手紙側に日付・フォントを複製せずに)ゲスト閲覧を成立させるため。手紙 → イベントの参照解決はサーバーが行う。
2. stg/prod が同一 Firestore を共有し、コレクション名の環境プレフィックス(`dev_` / `stg_` / `prod_`、[§9](#9-実装メモ環境プレフィックスとセッション認証) 参照)で分離する設計上、この判定は **Cloud Run のランタイム環境変数**(`APP_ENV`)で行う必要がある。Next.js の `NEXT_PUBLIC_*` はビルド時に静的埋め込みされる([Dockerfile](../../Dockerfile) 参照)ため、ブラウザ側では環境を判定できない。サーバーに寄せることでこの問題を回避している。

| 経路 | 対象 | 認可 |
| --- | --- | --- |
| **ブラウザ → Route Handler**(`fetch`) | スタジオ(ログイン中の編集画面)の読み書き全般 | Firebase Auth の ID トークンから発行した **httpOnly セッションクッキー**をサーバーが検証し、`memberUids` を手動チェック |
| **Next.js サーバー(Admin SDK)** | 上記に加え、ゲストの手紙閲覧 `/letter/{ulid}`、招待リンクの受諾(未実装) | サーバー側コードで検証(Admin SDK は Firestore セキュリティルールをバイパスする) |

Admin SDK は常にルールをバイパスするため、`firestore.rules` はこの用途では実行されない。ルールは「将来クライアントから直接 Firestore を叩く経路(例: リアルタイム購読)を足す場合の防御層」として維持している。ルール上のパス(`/events/{eventId}`)は環境プレフィックスなしの前提で書かれている点に注意 — プレフィックス付きコレクションに直接アクセスする経路を追加する場合はルールも合わせて調整すること。

### 現行クライアント実装との対応

| 現行の型(`types.ts`) | 移行先 |
| --- | --- |
| `Project` | `events/{eventId}` ドキュメント |
| `Project.letters[]` | `letters/{letterId}`(トップレベル、`eventId` で紐付け) |
| `Project.cardConfig` (`CardConfig`) | `events/{eventId}.cardConfig`(マップ) |
| `Project.noDate` | 廃止 — `events.date` を null 許容にして表現 |
| `Letter.photo`(dataURL 1 枚) | Cloud Storage `letters/{letterId}/photos/{photoId}.jpg` + `letters.photos[]`(複数枚対応) |
| `wl_letters_v1` ミラー | 廃止 — ゲスト閲覧はサーバーがイベントを参照して解決 |

## 2. コレクション構成

```
users/{uid}          … ユーザープロフィール
events/{eventId}     … イベント(アクセス制御の起点)
letters/{letterId}   … お手紙(ULID キー)
```

**手紙をイベントのサブコレクションにしない理由**: ゲストは URL の ULID だけで手紙に到達する。トップレベルで ULID をドキュメント ID にすれば、サーバーは単一の `get` で手紙を引け、パスに `eventId` を含める必要がない。

## 3. 各コレクション詳細

### 3.1 `users/{uid}`

Firebase Authentication の `uid` をキーとするプロフィール。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `displayName` | string | 表示名(例: 「ゆい」) |
| `email` | string | メールアドレス |
| `photoUrl` | string \| null | アバター URL |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

- 本人のみ読み書き可。
- 所属イベントの一覧は `events` を `memberUids array-contains uid` でクエリするため、ここには持たない。

### 3.2 `events/{eventId}`

イベント本体。アクセス制御の起点。`eventId` は Firestore 自動 ID。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `name` | string | イベント名(例: 「ゆい & 蓮 の結婚式」) |
| `date` | string \| null | 挙式日の表示文字列。**null = 日付を使わない** |
| `createdBy` | string | 作成者の uid |
| `memberUids` | string[] | **作成者を含む**全編集メンバーの uid。ルール判定・一覧クエリの両方でこの配列だけを見る |
| `inviteToken` | string \| null | 招待リンク用トークン(ULID)。**null = 招待リンク無効** |
| `font` | string | お手紙フォント (`yomogi` \| `klee` \| `mincho` \| `gothic` \| `maru`) |
| `cardFont` | string | 席札フォント(同上) |
| `cardEnabled` | boolean | 席札を作成するか |
| `cardConfig` | map | 席札の共通設定(下記) |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

`cardConfig` マップ:

| キー | 型 | 値 |
| --- | --- | --- |
| `orient` | string | `landscape` \| `portrait` \| `tent-l` \| `tent-p` |
| `honor` | string | `様` \| `さん` \| `""`(**空文字 = 敬称なし**) |
| `frame` | string | `line` \| `frame` \| `minimal` |
| `heading` | string | 見出し(例: `WEDDING RECEPTION`) |
| `note` | string | QR 案内文(改行含む) |

- 読み書きとも `memberUids` に含まれるユーザーのみ。
- `createdBy` / `memberUids` / `inviteToken` の変更は作成者のみ(メンバーが自分を脱退させる更新だけ例外的に許可)。
- 手紙数のカウンタは持たない。イベント一覧で件数が必要になったら `letters` への集計クエリ(`count()`)で取得する。
- 想定規模は 1 イベントあたり数名なので `memberUids` 配列で十分。役割が増えたらサブコレクション `members/{uid}` への移行を検討する。

### 3.3 `letters/{letterId}`

お手紙。**ドキュメント ID = ULID**(26 文字、時系列ソート可能、推測困難)。ULID は作成時にサーバー(Route Handler)が発行する — クライアントは `POST /api/events/{eventId}/letters` を叩くだけで、レスポンスで ID を受け取る。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `eventId` | string | 所属イベント(権限判定と、閲覧時の日付・フォント解決に使用) |
| `to` | string | 宛名(例: 「さくらへ」) |
| `body` | string | 本文 |
| `theme` | string | `rose` \| `blue` \| `sage` \| `kinari` |
| `photos` | map[] | 添付写真のリスト(下記)。表示順 = 配列順。現行 UI は 1 枚だが複数枚を許容できる形にしてある |
| `cardName` | string \| null | 席札の氏名(null なら宛名から自動生成) |
| `honor` | string \| null | 手紙個別の敬称。**null = イベント既定に従う**、`様` \| `さん` \| `""`(空文字 = 明示的に敬称なし) |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

`photos` 配列の要素(**暫定実装**。§5 参照):

| キー | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 写真 ID。将来 Storage へ移行する際もこの ID を Storage パスの一部として使う |
| `dataUrl` | string | **暫定**: 圧縮済み JPEG の data URL をそのまま格納(Storage バケット未整備のため)。将来はこのキーを署名付き URL 参照に置き換える |
| `ratio` | number \| null | アスペクト比(横/縦) |

- 挙式日・フォントは**持たない**。イベント側の値が唯一の情報源(single source of truth)で、閲覧時に `eventId` から解決する。設定変更時のファンアウト更新は不要。
- 読み書きはイベントメンバーのみ。Route Handler 内でイベントの `memberUids` を確認してから Admin SDK で読み書きする。

必要なインデックス:

- `letters`: `eventId ASC, createdAt ASC`(イベント詳細画面の手紙一覧用)

## 4. 招待フロー

**未実装**(設計のみ)。`events.inviteToken` フィールドはスキーマに用意済みだが、発行・受諾の API はまだない。

招待は専用コレクションを持たず、**イベントドキュメント上の `inviteToken` 1 フィールド**で実現する。

1. **リンク発行**: 作成者が「招待リンクを発行」→ `inviteToken` に ULID をセット。URL は `https://…/join/{token}`。
2. **受諾**: 招待された人がログインした状態でリンクを開く → Next.js のルートハンドラが Admin SDK で `events.where("inviteToken", "==", token)` を照合し、一致すれば `memberUids` に uid を追加してイベント画面へリダイレクト。
3. **無効化**: 作成者が `inviteToken` を null に(または再発行で差し替え)。過去のリンクは即座に失効する。

- Cloud Functions・招待メール・ステータス管理は持たない。「リンクを知っている人が参加できる、リンクはいつでも無効化できる」という手紙と同じメンタルモデルに揃える。
- 有効期限が必要になったら `inviteTokenExpiresAt`(timestamp)を追加する程度の拡張で対応可能。

## 5. Cloud Storage 構成と写真のアクセス制御

**未整備**(目標設計)。`gizumon-hanayori` プロジェクトには Firebase Storage の既定バケットがまだ作成されておらず、対応する Terraform モジュールもない。バケット作成は Terraform 管理下に置く方針のため、現状は §3.3 の通り `photos[].dataUrl` に圧縮 JPEG を直接埋め込む暫定実装で動いている(1 通あたり写真 1 枚・数十〜150KB 程度に収まる想定で、Firestore の 1MiB ドキュメント上限には余裕がある)。以下は Storage 移行時の目標設計。

```
letters/{letterId}/photos/{photoId}.jpg
```

- パスは `photos/{photoId}` 形式で**複数枚に対応**。`photoId` は手紙ドキュメントの `photos[].id` と規約で対応させ、Storage 側の一覧(list)には依存しない。
- **バケットは非公開**。公開ダウンロード URL(永続トークン付き URL)は使わない。
- **閲覧**: ゲストページ `/letter/{ulid}` のサーバーレンダリング時に、Admin SDK で**短命の署名付き URL**(有効期限 15 分程度)を発行して埋め込む。URL が SNS 等に転載されても期限切れで無効になる。
- **アップロード**: メンバーが API ルート経由でアップロードする。サーバーが (1) 認証トークン検証 → (2) イベントメンバーであること → (3) サイズ・コンテンツタイプ・枚数上限を検証してから Storage へ書き込み、`letters.photos[]` を同時に更新する。Storage セキュリティルールでは Firestore のメンバーシップを参照できないため、書き込み検証はサーバーに集約し、Storage ルールはクライアント直接アクセスを全面拒否とする。
- クライアントは現行実装同様、アップロード前に最大幅 900px / JPEG 品質 0.82 へ縮小する。

## 6. セキュリティルール(骨子)

ゲストアクセスをサーバー(Admin SDK)に寄せたため、ルールは「メンバー限定」だけの単純な形になる。

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isEventMember(eventId) {
      return isSignedIn()
        && request.auth.uid in get(/databases/$(database)/documents/events/$(eventId)).data.memberUids;
    }

    match /users/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;
    }

    match /events/{eventId} {
      allow read: if isSignedIn() && request.auth.uid in resource.data.memberUids;
      allow create: if isSignedIn()
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.memberUids == [request.auth.uid];
      allow update: if isSignedIn()
        && request.auth.uid in resource.data.memberUids
        && (
          // 作成者は全フィールド変更可
          request.auth.uid == resource.data.createdBy
          // メンバーはメンバー構成・招待トークン以外を変更可
          || (
            request.resource.data.createdBy == resource.data.createdBy
            && request.resource.data.memberUids == resource.data.memberUids
            && request.resource.data.inviteToken == resource.data.inviteToken
          )
          // 自分自身の脱退のみ例外的に許可
          || request.resource.data.memberUids ==
               resource.data.memberUids.removeAll([request.auth.uid])
        );
      allow delete: if isSignedIn() && request.auth.uid == resource.data.createdBy;
    }

    match /letters/{letterId} {
      // list は必ず where("eventId", "==", …) 付きクエリで行う前提
      allow read: if isEventMember(resource.data.eventId);
      allow create: if isEventMember(request.resource.data.eventId)
        && request.resource.data.photos == [];   // photos はサーバー経由でのみ更新
      allow update: if isEventMember(resource.data.eventId)
        && request.resource.data.eventId == resource.data.eventId
        && request.resource.data.photos == resource.data.photos;  // 同上
      allow delete: if isEventMember(resource.data.eventId);
    }
  }
}
```

注意点:

- ゲストの手紙閲覧・招待受諾・写真 URL 発行はすべて Admin SDK 経由のため、ルールには現れない(サーバーコードが認可の責任を持つ)。
- `isEventMember()` はルール内 `get()` を 1 回消費する。手紙の読み書きが高頻度になる場合はカスタムクレームへの移行を検討。
- `photos` の書き換えをルールで禁止しているのは、Storage への実体アップロードと配列更新をサーバーで一体に扱い、実体のない参照や参照のない実体(孤児ファイル)を防ぐため。

## 7. 主なアクセスパターン

「経路」は「ブラウザが叩く先」。実装状況の凡例: ✅ 実装済み / ⬜ 未実装(設計のみ)。

| 画面 / 操作 | 経路 | クエリ・処理 | 状態 |
| --- | --- | --- | --- |
| ログイン | `POST /api/auth/session` | Firebase Auth の ID トークンを検証し、httpOnly セッションクッキーを発行 | ✅ |
| イベント一覧(ホーム) | `GET /api/events` | `events.where("memberUids","array-contains",uid).orderBy("createdAt")` + 手紙数を `count()` で集計 | ✅ |
| イベント作成 | `POST /api/events` | `events` へ `add`(`memberUids: [uid]`) | ✅ |
| イベント設定変更 | `PATCH /api/events/{eventId}` | メンバー確認 → 部分更新 | ✅ |
| イベント詳細(手紙一覧) | `GET /api/events/{eventId}/letters` | メンバー確認 → `letters.where("eventId","==",eventId).orderBy("createdAt")` | ✅ |
| 手紙の作成 | `POST /api/events/{eventId}/letters` | メンバー確認 → ULID 発行 → `letters/{ulid}` へ `set` | ✅ |
| 手紙の更新 | `PATCH /api/letters/{letterId}` | 手紙 `get` →`eventId` からメンバー確認 → 部分更新 | ✅ |
| ゲストの手紙閲覧 `/letter/{ulid}` | サーバー SSR | 手紙 `get` → `eventId` からイベント `get`(日付・フォントを解決)。開封アニメーション(`WeddingLetter.dc.html` を移植)付き | ✅ |
| 招待リンク発行 / 無効化 | サーバー API | 作成者が `inviteToken` を更新 | ⬜ |
| 招待の受諾 `/join/{token}` | サーバー API | トークン照合 → `memberUids` へ追加 | ⬜ |

## 8. localStorage モックからの移行

本番ユーザーが存在しない段階で Firestore 実装に切り替えたため、データ移行は行っていない(`localStorage` の `wl_studio_v1` / `wl_letters_v1` は単純に読まなくなった)。

## 9. 実装メモ: 環境プレフィックスとセッション認証

### 環境プレフィックス

stg/prod は同一 Firestore データベースを共有する(`infrastructure/environments/10_shared/main.tf` 参照)。コレクション名の先頭に `APP_ENV` から決まるプレフィックスを付けて分離する。

| `APP_ENV` | プレフィックス | 用途 |
| --- | --- | --- |
| 未設定 / `development` | `dev_` | ローカル開発(`npm run dev`)。実プロジェクト `gizumon-hanayori` の Firestore に書き込むが、stg/prod のコレクションとは名前空間が分かれているため衝突しない |
| `staging` | `stg_` | Cloud Run stg |
| `production` | `prod_` | Cloud Run prod |

実装は `src/lib/server/env.ts`(`collectionPrefix()`)と `src/lib/server/collections.ts`(`eventsCollection()` / `lettersCollection()`)。

### セッション認証

- クライアント(`src/lib/firebase/client.ts`, `src/lib/firebase/auth.ts`)は Firebase Auth の Web SDK で Google ポップアップ / メール・パスワードのサインインのみを行う。
- サインイン成功後、ID トークンを `POST /api/auth/session` に渡し、サーバーが `firebase-admin` の `createSessionCookie()` で httpOnly セッションクッキー(有効期限 14 日)を発行する(`src/lib/server/session.ts`)。以降のすべての `/api/*` リクエストはこのクッキーで認可する。
- ログアウトは `DELETE /api/auth/session` でクッキーを破棄し、クライアント側でも `signOut()` する。
- Google ログインは Identity Platform 側で `google.com` プロバイダがまだ有効化されていない(`infrastructure/modules/firebase_auth` の `google_oauth_client_id` が未設定)。GCP Console で OAuth クライアントを手動作成し、`10_shared/terraform.tfvars` に `google_oauth_client_id` / `google_oauth_client_secret` を設定して `terraform apply` するまでは、ログイン画面の Google ボタンはエラーになる。メール/パスワードは Identity Platform 側で有効化済みですぐ使える。

### ローカル開発時の認証情報

`firebase-admin`(Admin SDK)はローカルでは `gcloud auth application-default login` の Application Default Credentials を使う(サービスアカウントキーのファイルは使わない)。Cloud Run 上では Workload Identity(アタッチされたサービスアカウント)を自動的に使う。`.env.local` は `.env.local.example` をコピーして作成し、Firebase Web アプリの設定値(`firebase apps:sdkconfig WEB <appId> --project gizumon-hanayori` で取得可能)を埋める。

### 未実装・今後の課題

- 招待リンクの発行・受諾 API(`events.inviteToken` を使った §4 のフロー)
- 写真の Cloud Storage 移行(§5)。Storage バケット作成用の Terraform モジュールがまだない
- リアルタイム更新(現状は各操作後にクライアントが明示的に再取得する方式。複数メンバーが同時編集するケースは考慮していない)
