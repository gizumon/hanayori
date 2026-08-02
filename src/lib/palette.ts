/**
 * Color tokens — the single source of truth for UI colors.
 *
 * Every piece of chrome (背景・カード面・枠線・文字・アクセント…) should take its
 * color from `COLOR` rather than hard-coding a hex, so the same role reads as the
 * exact same color everywhere. 「ほぼ同じだけど微妙に違う色」が増えるのを防ぐのが目的です。
 *
 * CSS Modules / Tailwind の任意値からは、同じ値を `globals.css` の CSS 変数
 * （`var(--c-ink)` など）として参照できます。両者は必ず同じ値に保つこと。
 *
 * The role → color mapping is documented in /DESIGN.md. Keep the two in sync:
 * DESIGN.md is the spec, this file is its machine-readable form.
 *
 * Out of scope: 手紙・カード・印刷物そのものの意匠色（THEMES のテーマ定義、
 * wedding-letter/, *CardFace, *Print, 席次表プレビュー SVG, ランディングの装飾）と
 * Google などの外部ブランドカラー。これらは UI ではなく作品側の色なので直書きのままです。
 */
export const COLOR = {
  // ── 面 ────────────────────────────────────────────────────────────────
  /** アプリ全体の地の色 */
  bg: "#FFF9F5",
  /** カード・パネル・モーダルの面 */
  surface: "#FFFCF8",
  /** 入力欄・チップなど一段手前の面 */
  surfaceRaised: "#FFFFFF",
  /** 操作不可の面 */
  surfaceDisabled: "#F2ECEC",
  /** ホバー・選択中の淡い面 */
  tint: "#FBF1F4",
  /** アイコンチップの面（グラデーション始点） */
  tintRose: "#FBEEF2",
  /** アイコンチップのグラデーション終点 */
  tintRoseDeep: "#F3D9E3",

  // ── 線 ────────────────────────────────────────────────────────────────
  /** 標準の枠線 */
  border: "#EBD9DF",
  /** 控えめな枠線 */
  borderSoft: "#F0E2E7",
  /** 区切り線（ヘッダー下・行間） */
  divider: "#F2E6EB",
  /** 破線の枠（写真の追加エリアなど） */
  borderDash: "#E3CBD4",

  // ── 文字 ──────────────────────────────────────────────────────────────
  /** 主要テキスト */
  ink: "#5C4A4A",
  /** 副次テキスト・説明文 */
  inkSoft: "#8C7676",
  /** 補助テキスト（注記・単位） */
  inkMuted: "#A38A93",
  /** 最も控えめなテキスト・プレースホルダ */
  inkFaint: "#B4A2A2",
  /** 無効状態のテキスト */
  inkDisabled: "#CBB6BE",
  /** アクセント面（ボタン等）の上に載る文字 */
  onAccent: "#FFF9F5",
  /** 濃色面（フッター等）の上に載る文字 */
  onInk: "#D9C6CB",

  // ── アクセント ────────────────────────────────────────────────────────
  /** アクセントの淡い側（グラデーション始点） */
  accentPale: "#E2B6C3",
  /** ブランドアクセント（主ボタン・選択中） */
  accent: "#D3A5B4",
  /** アクセントの濃い側（ホバー・グラデーション終点） */
  accentRose: "#C393A5",
  /** アクセント寄りの文字・アイコン */
  accentInk: "#B08A99",
  /** 強調されたアクセント文字（リンクホバー・選択中ラベル） */
  accentDeep: "#9D6F83",
  /** アクセントの無効状態（オフのトグル・押せないボタン） */
  accentOff: "#E3D2D8",
  /** 箔押し風のゴールド */
  gold: "#E3C293",

  // ── 状態 ──────────────────────────────────────────────────────────────
  /** 削除・エラー・期限切れ */
  danger: "#B5555F",
  /** 完了・成功 */
  success: "#7A9A7E",
  /** 変更あり（一括編集の変更マーカー） */
  change: "#C98A3F",
  /** 注意バッジの面 */
  warnBg: "#F8ECD7",
  /** 注意バッジの文字 */
  warnInk: "#9A7B4A",

  // ── カレンダー ────────────────────────────────────────────────────────
  /** 日曜 */
  sunday: "#C97D89",
  /** 土曜 */
  saturday: "#7A93B0",
  /** 祝日マーク */
  holiday: "#CBA45C",
} as const;

export type ColorToken = keyof typeof COLOR;
