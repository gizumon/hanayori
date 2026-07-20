# Hanayori データベース設計(Firestore)

## 1. 前提・要件

- データストアは **Cloud Firestore**(ネイティブモード)。
- **イベント**は作成者がメンバーを招待でき、**作成者とメンバーのみが読み書き**できる。
- イベント内の**お手紙**には **ULID** が発行され、`/letter/{ulid}` の URL を知っていれば**ログイン不要で誰でも閲覧**できる(推測困難な URL による限定公開)。
- 写真バイナリは Firestore に置かず **Cloud Storage** に保存する(1 ドキュメント 1MiB 制限のため)。

### アクセス経路の整理

正規化を保ったまま(手紙側に日付・フォントを複製せずに)ゲスト閲覧を成立させるため、アクセス経路を 2 系統に分ける。

| 経路 | 対象 | 認可 |
| --- | --- | --- |
| **クライアント SDK** | スタジオ(編集画面)の読み書き | Firestore セキュリティルール(メンバーのみ) |
| **Next.js サーバー(Admin SDK)** | ゲストの手紙閲覧 `/letter/{ulid}`、招待の受諾、写真の署名付き URL 発行 | サーバー側コードで検証(ルールはバイパス) |

ゲストは Firestore に直接アクセスしない。したがってルール上は**全コレクションをメンバー限定に保てる**。手紙 → イベントの参照解決(日付・フォント・イベント名)はサーバーが行うため、非正規化が不要になり不整合も起きない。

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

お手紙。**ドキュメント ID = ULID**(26 文字、時系列ソート可能、推測困難)。ULID はクライアントで発行する。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `eventId` | string | 所属イベント(権限判定と、閲覧時の日付・フォント解決に使用) |
| `to` | string | 宛名(例: 「さくらへ」) |
| `body` | string | 本文 |
| `theme` | string | `rose` \| `blue` \| `sage` \| `kinari` |
| `photos` | map[] | 添付写真のリスト(下記)。表示順 = 配列順。現行 UI は 1 枚だが複数枚を許容 |
| `cardName` | string \| null | 席札の氏名(null なら宛名から自動生成) |
| `honor` | string \| null | 手紙個別の敬称。**null = イベント既定に従う**、`様` \| `さん` \| `""`(空文字 = 明示的に敬称なし) |
| `createdAt` | timestamp | 作成日時 |
| `updatedAt` | timestamp | 更新日時 |

`photos` 配列の要素:

| キー | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 写真 ID(ULID)。Storage パスは `letters/{letterId}/photos/{id}.jpg` に規約で対応 |
| `ratio` | number | アスペクト比(横/縦) |

- 挙式日・フォントは**持たない**。イベント側の値が唯一の情報源(single source of truth)で、閲覧時に `eventId` から解決する。設定変更時のファンアウト更新は不要。
- 読み書きはイベントメンバーのみ(ルール内 `get()` で `eventId` の `memberUids` を判定)。ゲスト閲覧はサーバー経由なのでルールでの公開は不要。

必要なインデックス:

- `letters`: `eventId ASC, createdAt ASC`(イベント詳細画面の手紙一覧用)

## 4. 招待フロー

招待は専用コレクションを持たず、**イベントドキュメント上の `inviteToken` 1 フィールド**で実現する。

1. **リンク発行**: 作成者が「招待リンクを発行」→ `inviteToken` に ULID をセット。URL は `https://…/join/{token}`。
2. **受諾**: 招待された人がログインした状態でリンクを開く → Next.js のルートハンドラが Admin SDK で `events.where("inviteToken", "==", token)` を照合し、一致すれば `memberUids` に uid を追加してイベント画面へリダイレクト。
3. **無効化**: 作成者が `inviteToken` を null に(または再発行で差し替え)。過去のリンクは即座に失効する。

- Cloud Functions・招待メール・ステータス管理は持たない。「リンクを知っている人が参加できる、リンクはいつでも無効化できる」という手紙と同じメンタルモデルに揃える。
- 有効期限が必要になったら `inviteTokenExpiresAt`(timestamp)を追加する程度の拡張で対応可能。

## 5. Cloud Storage 構成と写真のアクセス制御

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

| 画面 / 操作 | 経路 | クエリ・処理 |
| --- | --- | --- |
| イベント一覧(ホーム) | クライアント | `events.where("memberUids", "array-contains", uid).orderBy("createdAt")` |
| イベント詳細(手紙一覧) | クライアント | `letters.where("eventId", "==", eventId).orderBy("createdAt")` |
| 手紙の保存 | クライアント | `letters/{ulid}` へ `set`(photos 以外) |
| 写真アップロード | サーバー API | メンバー検証 → Storage 書き込み + `photos[]` 更新 |
| ゲストの手紙閲覧 `/letter/{ulid}` | サーバー SSR | 手紙 `get` → `eventId` からイベント `get`(日付・フォント・イベント名を解決)→ 写真の署名付き URL 発行 |
| 招待リンク発行 / 無効化 | クライアント | 作成者が `inviteToken` を更新 |
| 招待の受諾 `/join/{token}` | サーバー API | トークン照合 → `memberUids` へ追加 |

## 8. 移行メモ(localStorage → Firestore)

1. 初回ログイン時に `wl_studio_v1` が存在すれば、イベント/手紙を上記スキーマへ変換してアップロードするワンショット移行を行う(手紙 ID は既存の短い乱数 ID から ULID へ振り直し、QR/URL は再生成)。
2. dataURL 写真は Blob 化して写真アップロード API 経由で Storage へ移す。
3. 移行完了後に localStorage をクリアし、以降は Firestore を単一の情報源とする(`wl_letters_v1` ミラーは廃止)。
