<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# デザイントークン

UI の**文字サイズと色は直書きしない**。役割で決まったトークンを使う。

- 文字サイズ: `FONT_SIZE`（`src/lib/typography.ts`）
- 色: `COLOR`（`src/lib/palette.ts`）／ CSS・Tailwind からは `var(--c-*)`（`src/app/globals.css`）

規約と対象外（手紙・カード・印刷物の意匠色）は [DESIGN.md](DESIGN.md) を参照。
色の直書きは ESLint がエラーにする。
