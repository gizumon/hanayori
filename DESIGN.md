# DESIGN — デザイン規約

このアプリの UI を統一するための規約です。**タイポグラフィ（文字サイズ）**と**カラー**の 2 つがあります。

- [タイポグラフィ規約](#デザイン規約タイポグラフィ) — 実体は [`src/lib/typography.ts`](src/lib/typography.ts) の `FONT_SIZE`
- [カラー規約](#デザイン規約カラー) — 実体は [`src/lib/palette.ts`](src/lib/palette.ts) の `COLOR` / `globals.css` の `--c-*`

どちらも「見た目の値」ではなく**役割（role）で決まったトークン**を参照します。数値・色の直書きは原則禁止です。

---

# デザイン規約：タイポグラフィ

このアプリの UI（フォーム・見出し・説明文・ボタンなど）の**文字サイズを統一**するための規約です。
各 UI 要素は「見た目の px 値」ではなく、**役割（role）で決まったトークン**を参照します。

- 仕様の正: この `DESIGN.md`
- コード上の実体: [`src/lib/typography.ts`](src/lib/typography.ts) の `FONT_SIZE`

新しい UI を作るとき・既存を直すときは、まずここで役割を選び、対応するトークンを使ってください。
数値の直書き（`fontSize: 13` など）は原則禁止です。

---

## タイプスケール

| トークン | px | 役割 | 主な用途 | 推奨 weight / letter-spacing |
| --- | --- | --- | --- | --- |
| `display` | 30 | ヒーロー特大タイトル | ログイン画面の第一見出しなど | 600 / 0.08em |
| `title` | 20 | ページ・セクション主見出し | 画面/モーダルの `h2` | 600 / 0.12em |
| `heading` | 17 | サブ見出し・ロゴ | ブランド名、ドロワー見出し | 500–600 / 0.1em |
| `subheading` | 15 | 小見出し・カードタイトル | カード名、区切り見出し | 500 / 0.08em |
| `input` | 16 | フォーム入力欄 | `input` / `textarea` / `select` | 400 / — |
| `body` | 14 | 本文（標準の説明文） | 段落・説明文 | 400 / 0.02em・行間 1.6 |
| `bodySm` | 13 | 補足本文・メニュー項目 | メニュー行、二次的な説明 | 400 / 0.04em |
| `label` | 12.5 | コントロールの基準 | フォームラベル・ボタン・トグル | 500 / 0.06em |
| `caption` | 12 | キャプション・注釈 | 補助テキスト | 400 / 0.05em |
| `overline` | 11 | アイキャッチ / エプロン | 「花嫁のお便り」等の字間広め小見出し | 500 / 0.2em〜0.28em・大文字 |
| `micro` | 10.5 | 極小注記・バッジ | ステータス、ごく小さな注記 | 400 / 0.05em |

> weight / letter-spacing / line-height は「その役割で標準的に組み合わせる値」の目安です。
> `FONT_SIZE` が管理するのは **font-size のみ**。色・字間・太さは各コンポーネントで指定して構いませんが、
> 同じ役割では同じ値を使ってください。

### 重要: `input` は 16px 固定

`input` / `textarea` / `select` は **16px 未満にすると iOS Safari がフォーカス時に自動ズーム**します。
入力欄は必ず `FONT_SIZE.input`（16）を使い、小さく見せたい場合も下げないでください。

---

## 使い方

```tsx
import { FONT_SIZE } from "@/lib/typography";

// 見出し
<h2 style={{ fontSize: FONT_SIZE.title, fontWeight: 600, letterSpacing: "0.12em" }}>
  イベント一覧
</h2>

// 説明文
<p style={{ fontSize: FONT_SIZE.body, lineHeight: 1.6, color: "#8C7676" }}>
  ここに説明が入ります。
</p>

// ボタン / ラベル
<button style={{ fontSize: FONT_SIZE.label, letterSpacing: "0.06em" }}>保存</button>

// 入力欄（共通の fieldStyle 経由でも可）
<input style={{ fontSize: FONT_SIZE.input }} />
```

`letter-studio` の入力欄は
[`controls.tsx`](src/components/letter-studio/controls.tsx) の `fieldStyle()` が
`FONT_SIZE.input` を既定で当てるため、そのまま使えば統一されます。

---

## 対象外（トークン化しないもの）

以下は「UI の文字」ではなく**カード/手紙そのものの意匠**で、カードサイズに追従する
`clamp()` の可変サイズを使います。ここは意図的にトークンの対象外です。

- `EscortCardFace.tsx` / `QrCardFace.tsx`（席次・QR カードの描画）
- `wedding-letter/LetterView.tsx` / `EnvelopeScene.tsx`（手紙の描画）
- `app/letter/[id]/opengraph-image.tsx`（OG 画像）
- `landing/Landing.tsx` 内の**装飾カードのモックアップ**（「さくら 様」等のプレビュー）

---

## 迷ったときの決め方

1. それは **入力欄** か？ → `input`
2. **見出し** か？ → 大きさで `display` > `title` > `heading` > `subheading`
3. **本文・説明文** か？ → 標準は `body`、控えめなら `bodySm`
4. **ボタン / ラベル / トグル** か？ → `label`
5. **注釈・キャプション** か？ → `caption`、字間広めのアイキャッチは `overline`、極小は `micro`

該当する役割が無い新種の UI が出たら、勝手に px を足さず、この表とトークンに役割を追加してから使ってください。

---

# デザイン規約：カラー

UI の色を統一するための規約です。`#FFFCF8` と `#FFF7F1` のような**ほぼ同じで微妙に違う色**が
増えないよう、色は必ずトークン経由で参照します。

- 仕様の正: この `DESIGN.md`
- コード上の実体: [`src/lib/palette.ts`](src/lib/palette.ts) の `COLOR`
- CSS 側の実体: [`src/app/globals.css`](src/app/globals.css) の `--c-*` 変数（`COLOR` と同じ値）

TSX のインラインスタイルからは `COLOR.ink` のように、CSS Modules や Tailwind の任意値からは
`var(--c-ink)` のように参照します。**16 進数の直書きは ESLint（`no-restricted-syntax`）でエラー**になります。

## パレット

### 面

| トークン | 値 | 役割 |
| --- | --- | --- |
| `bg` | `#FFF9F5` | アプリ全体の地の色 |
| `surface` | `#FFFCF8` | カード・パネル・モーダルの面 |
| `surfaceRaised` | `#FFFFFF` | 入力欄・チップなど一段手前の面 |
| `surfaceDisabled` | `#F2ECEC` | 操作不可の面 |
| `tint` | `#FBF1F4` | ホバー・選択中の淡い面 |
| `tintRose` | `#FBEEF2` | アイコンチップの面（グラデ始点） |
| `tintRoseDeep` | `#F3D9E3` | アイコンチップのグラデ終点 |

### 線

| トークン | 値 | 役割 |
| --- | --- | --- |
| `border` | `#EBD9DF` | 標準の枠線 |
| `borderSoft` | `#F0E2E7` | 控えめな枠線 |
| `divider` | `#F2E6EB` | 区切り線（ヘッダー下・行間） |
| `borderDash` | `#E3CBD4` | 破線の枠（写真の追加エリアなど） |

### 文字

| トークン | 値 | 役割 |
| --- | --- | --- |
| `ink` | `#5C4A4A` | 主要テキスト |
| `inkSoft` | `#8C7676` | 副次テキスト・説明文 |
| `inkMuted` | `#A38A93` | 補助テキスト（注記・単位） |
| `inkFaint` | `#B4A2A2` | 最も控えめなテキスト・プレースホルダ |
| `inkDisabled` | `#CBB6BE` | 無効状態のテキスト |
| `onAccent` | `#FFF9F5` | アクセント面の上に載る文字 |
| `onInk` | `#D9C6CB` | 濃色面（フッター等）の上に載る文字 |

### アクセント

| トークン | 値 | 役割 |
| --- | --- | --- |
| `accentPale` | `#E2B6C3` | アクセントの淡い側（グラデ始点） |
| `accent` | `#D3A5B4` | ブランドアクセント（主ボタン・選択中） |
| `accentRose` | `#C393A5` | アクセントの濃い側（ホバー・グラデ終点） |
| `accentInk` | `#B08A99` | アクセント寄りの文字・アイコン |
| `accentDeep` | `#9D6F83` | 強調されたアクセント文字（リンクホバー等） |
| `accentOff` | `#E3D2D8` | アクセントの無効状態（オフのトグル） |
| `gold` | `#E3C293` | 箔押し風のゴールド |

### 状態

| トークン | 値 | 役割 |
| --- | --- | --- |
| `danger` | `#B5555F` | 削除・エラー・期限切れ |
| `success` | `#7A9A7E` | 完了・成功 |
| `change` | `#C98A3F` | 変更あり（一括編集の変更マーカー） |
| `warnBg` / `warnInk` | `#F8ECD7` / `#9A7B4A` | 注意バッジの面と文字 |

### カレンダー

| トークン | 値 | 役割 |
| --- | --- | --- |
| `sunday` | `#C97D89` | 日曜 |
| `saturday` | `#7A93B0` | 土曜 |
| `holiday` | `#CBA45C` | 祝日マーク |

## 使い方

```tsx
import { COLOR } from "@/lib/palette";

<div style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
  <p style={{ color: COLOR.inkSoft }}>説明文</p>
  <button style={{ background: COLOR.accent, color: COLOR.onAccent }}>保存</button>
</div>
```

```css
/* CSS Modules */
.card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
}
```

```tsx
// Tailwind の任意値
<span className="text-[var(--c-accent-ink)] hover:bg-[var(--c-tint)]" />
```

CSS 変数名はトークン名のケバブケースです（`accentInk` → `--c-accent-ink`）。

## 対象外（トークン化しないもの）

以下は「UI の色」ではなく**手紙・カード・印刷物そのものの意匠**なので、直書きのままにします
（ESLint でも除外設定済み）。

- `letter-studio/constants.ts` の `THEMES`（テーマ定義そのもの。テーマ色が要るときはここから引く）
- `wedding-letter/`（手紙・封筒の描画）
- `EscortCardFace.tsx` / `QrCardFace.tsx` / `LetterPreviewFace.tsx`（カードの描画）
- `sheetPrint.ts` / `escortPrint.tsx` / `qrCardPrint.tsx`（印刷物）
- `app/letter/[id]/opengraph-image.tsx`（OG 画像）
- `ReviewScreen.tsx` の `GUIDE_COLOR`（印刷ガイド図の作図色）
- `landing/Landing.tsx` 内の**装飾カードのモックアップ**
- Google などの**外部ブランドカラー**

例外を足すときは、そのブロックに `eslint-disable no-restricted-syntax` と**理由**を書いてください。

## 迷ったときの決め方

1. それは **文字** か？ → 濃い順に `ink` > `inkSoft` > `inkMuted` > `inkFaint`。アクセント面の上なら `onAccent`
2. **面（背景）** か？ → 地は `bg`、カードは `surface`、入力欄は `surfaceRaised`、ホバー・選択は `tint`
3. **線** か？ → 標準は `border`、区切りは `divider`
4. **押せるもの・選択中** か？ → `accent` 系。無効なら `accentOff` / `inkDisabled`
5. **状態を伝える色** か？ → `danger` / `success` / `change` / `warnBg`+`warnInk`

近い色が無いからといって新しい 16 進数を足さないでください。まずこの表から役割の近いものを選び、
本当に無ければ**この表と `palette.ts` / `globals.css` の 3 箇所に**役割を追加してから使います。
