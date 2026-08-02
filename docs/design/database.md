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
| **Next.js サーバー(Admin SDK)** | 上記に加え、ゲストの手紙閲覧 `/letter/{ulid}`、招待リンクの表示・受諾 `/join/{token}` | サーバー側コードで検証(Admin SDK は Firestore セキュリティルールをバイパスする) |

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
invites/{token}      … 招待リンク(ULID キー、使い切り)
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
| `createdBy` | string | 最初に作った人の uid。**権限差は無い**(§4 参照)、表示と保護のためだけに持つ |
| `memberUids` | string[] | **作成者を含む**全編集メンバーの uid。ルール判定・一覧クエリの両方でこの配列だけを見る |
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
- **メンバーは全員が同じ権限(共同オーナー)**。招待の発行・取消、他メンバーの削除も含めて誰でも行える。`createdBy` だけは書き換え不可で、作成者を他人が外すこともできない(招待した相手に締め出される事故を防ぐ)。
- 手紙数のカウンタは持たない。イベント一覧で件数が必要になったら `letters` への集計クエリ(`count()`)で取得する。
- 想定規模は 1 イベントあたり数名なので `memberUids` 配列で十分。役割が増えたらサブコレクション `members/{uid}` への移行を検討する。

### 3.3 `letters/{letterId}`

お手紙。**ドキュメント ID = ULID**(26 文字、時系列ソート可能、推測困難)。ULID は作成時にサーバー(Route Handler)が発行する — クライアントは `POST /api/events/{eventId}/letters` を叩くだけで、レスポンスで ID を受け取る。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `eventId` | string | 所属イベント(権限判定と、閲覧時の日付・フォント解決に使用) |
| `createdBy` | string \| 無し | 作成した人の uid。共同編集で「誰が書いた手紙か」を示す。**この機能より前の手紙にはフィールドが無い**ので、読み出し側は「作成者不明」にフォールバックする |
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
- 作成者の**表示名も持たない**(`createdBy` は uid のみ)。名前は返却時に `users` から解決する — distinct な uid をまとめて 1 回の `getAll` で引くので、何通あっても往復は 1 回。ニックネーム変更が全手紙に波及しないのはこのため。
- 読み書きはイベントメンバーのみ。Route Handler 内でイベントの `memberUids` を確認してから Admin SDK で読み書きする。

必要なインデックス:

- `letters`: `eventId ASC, createdAt ASC`(イベント詳細画面の手紙一覧用)

### 3.4 `invites/{token}`

招待リンク。**ドキュメント ID = ULID トークン**。`/join/{token}` の URL に載る。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `eventId` | string | 対象イベント |
| `createdBy` | string | 発行者の uid |
| `createdAt` | timestamp | 発行日時 |
| `expiresAt` | timestamp | `createdAt + 7 日`。これを過ぎたリンクは受諾できない |
| `acceptedBy` | string \| null | 受諾者の uid。**null 以外 = 消費済み**で再利用不可 |
| `acceptedAt` | timestamp \| null | 受諾日時 |

**イベントのサブコレクションにしない理由**: 受諾者が持っているのはトークンだけ。トップレベルでトークンをドキュメント ID にすれば単一 `get` で引ける(`letters/{ulid}` と同じ発想)。サブコレクションにすると `eventId` が要るか collection group query になる。

- **ステータスは保存しない**。`acceptedBy` と `expiresAt` から `active` / `expired` / `accepted` を派生させる(時刻依存の状態をドキュメントに固定しない)。
- **取消は物理削除**。`revoked` 状態は持たない。受諾済みレコードは「誰がいつ参加したか」の記録として残す。
- クライアントからは一切読めない(§6)。トークン照合と受諾はサーバー専用。

必要なインデックス:

- `invites`: `eventId ASC, createdAt DESC`(メンバータブの招待一覧用)

## 4. 招待フロー

**実装済み**。招待は**リンク共有のみ**で、メール送信は行わない。参加した人は共同オーナー(既存メンバーと同じ権限)になる。

1. **リンク発行**: メンバーが共通設定 →「メンバー」タブ →「招待リンクを発行」→ `POST /api/events/{eventId}/invites`。ULID を発行し、`expiresAt = now + 7 日` で `invites/{token}` を作る。発行と同時にクライアントが URL をクリップボードへコピーする。
2. **共有**: `https://…/join/{token}` を LINE 等で相手に渡す。`navigator.share` が使える端末では共有シートから直接送れる。
3. **受諾**: 相手が `/join/{token}` を開く → サーバーが状態を読んで画面を出し分ける(未ログインならイベント名を見せてログインへ誘導)。「参加する」ボタンで `POST /api/invites/{token}/accept` → トランザクション内で `memberUids` へ追加し、`acceptedBy` を埋めて消費する。
4. **取消**: メンバーが招待行の ✕ → `DELETE /api/events/{eventId}/invites/{token}` でドキュメントごと削除。そのリンクは即座に失効する。

設計上の要点:

- **リンクは使い切り(1 リンク 1 人)**。発行済みの有効なリンクは 1 イベント 5 件まで(乱発と管理不能化の防止)。
- **`GET` では絶対にトークンを消費しない**。消費は `POST .../accept` だけ。SNS のリンクプレビューやブラウザの prefetch で使い切りのリンクが潰れるのを防ぐため、受諾は必ず明示的なボタン操作を経由させる。
- **受諾はトランザクション**。「未受諾であることの確認」と「消費」を同一トランザクションに入れる。同じリンクを 2 人が同時に開くレースは実際に起こる。
- すでにメンバーの人が開いた場合はリンクを消費せず、そのままイベントへ通す。
- Cloud Functions・招待メール・ステータス管理コレクションは持たない。

メンバー管理:

- メンバーは全員が招待の発行・取消・他メンバーの削除を行える。
- 例外は 2 つだけ — **最後の 1 人は外せない**(イベントが誰からも触れなくなる)、**作成者は他人から外せない**(本人の「退出」は可)。

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
      // メンバーは全員共同オーナー。メンバー構成の変更も含めて許可し、
      // 作成者の記録(createdBy)だけは書き換えさせない。
      allow update: if isSignedIn()
        && request.auth.uid in resource.data.memberUids
        && request.resource.data.createdBy == resource.data.createdBy;
      allow delete: if isSignedIn() && request.auth.uid == resource.data.createdBy;
    }

    // 招待リンク。トークン照合と受諾はサーバー(Admin SDK)専用なので
    // クライアントからの直接アクセスは全面拒否する。
    match /invites/{token} {
      allow read, write: if false;
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
| メンバー / 招待リンク一覧 | `GET /api/events/{eventId}/members` | メンバー確認 → `memberUids` を `users` へ `getAll` + `invites.where("eventId","==",…)` | ✅ |
| 招待リンク発行 | `POST /api/events/{eventId}/invites` | メンバー確認 → 有効なリンクが 5 件未満か確認 → `invites/{ulid}` へ `set` | ✅ |
| 招待リンク取消 | `DELETE /api/events/{eventId}/invites/{token}` | メンバー確認 → 未受諾を確認 → 物理削除 | ✅ |
| メンバーを外す / 退出 | `DELETE /api/events/{eventId}/members/{uid}` | メンバー確認 → 最後の 1 人・作成者のガード → `arrayRemove` | ✅ |
| 招待ページの表示 `/join/{token}` | サーバー SSR | 招待 `get` → イベント `get`(名前を解決)。**トークンは消費しない** | ✅ |
| 招待の受諾 | `POST /api/invites/{token}/accept` | トランザクション: 未受諾・未期限を確認 → `memberUids` へ追加 → `acceptedBy` を埋める | ✅ |

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

- 写真の Cloud Storage 移行(§5)。Storage バケット作成用の Terraform モジュールがまだない
- **同時編集の競合検出**。現状は各操作後にクライアントが明示的に再取得する方式で、複数メンバーが同じ手紙を開いて片方の変更が消えるケースを防げない。招待機能(§4)で共同編集が現実に起こるようになったため、最小対応として保存時に `updatedAt` を突き合わせる楽観ロックを入れるのが次の一手
- イベントの削除 API(ルール上は作成者のみ許可しているが、Route Handler が無い)
- 期限切れ・受諾済み招待ドキュメントの掃除(件数はごく少ないので当面は放置で問題ない)
