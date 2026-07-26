# DESIGN — タイポグラフィ規約

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
