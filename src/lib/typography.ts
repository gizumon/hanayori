/**
 * Typography tokens — the single source of truth for UI font sizes.
 *
 * Every piece of chrome (forms, headings, descriptions, buttons, labels…)
 * should size its text from `FONT_SIZE` rather than hard-coding a number,
 * so a given kind of UI element reads at one consistent size everywhere.
 *
 * The role → px mapping, and the weight / letter-spacing / line-height that
 * conventionally go with each role, are documented in /DESIGN.md. Keep the two
 * in sync: DESIGN.md is the spec, this file is its machine-readable form.
 *
 * Out of scope: the fluid `clamp()` sizes used to render the letter/card
 * artwork itself (EscortCardFace, QrCardFace, LetterView, opengraph-image,
 * and the decorative card mock-ups on the landing page). Those scale with the
 * card, not with the UI, and are intentionally left as-is.
 */
export const FONT_SIZE = {
  /** ヒーロー特大タイトル（ログイン等の第一印象） */
  display: 30,
  /** ページ / セクションの主見出し（h2 相当） */
  title: 20,
  /** サブ見出し・ロゴ・モーダル見出し */
  heading: 17,
  /** 小見出し・カードタイトル */
  subheading: 15,
  /** フォーム入力欄（16px 未満だと iOS で自動ズームするため固定） */
  input: 16,
  /** 本文（標準の説明文） */
  body: 14,
  /** 補足本文・メニュー項目・二次的な説明文 */
  bodySm: 13,
  /** フォームラベル・ボタン・トグルなどコントロールの基準サイズ */
  label: 12.5,
  /** キャプション・注釈・補助テキスト */
  caption: 12,
  /** アイキャッチ / エプロン（字間を広げて使う小さな見出し） */
  overline: 11,
  /** 極小注記・バッジ */
  micro: 10.5,
} as const;

export type FontSizeToken = keyof typeof FONT_SIZE;
