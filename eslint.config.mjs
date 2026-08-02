import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const HEX_MESSAGE =
  "色を直書きしないでください。@/lib/palette の COLOR（CSS からは var(--c-*)）を使います。仕様は /DESIGN.md。手紙・カード・印刷物の意匠色だけが例外です。";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // UI の色は必ずトークン経由にする（ほぼ同じで微妙に違う色が増えるのを防ぐ）。
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // 色そのものを定義する場所
      "src/lib/palette.ts",
      "src/components/letter-studio/constants.ts",
      // 手紙・封筒・カード・印刷物の意匠（UI ではなく作品側の色）
      "src/components/wedding-letter/**",
      "src/components/letter-studio/*Face.tsx",
      "src/components/letter-studio/sheetPrint.ts",
      "src/components/letter-studio/escortPrint.tsx",
      "src/components/letter-studio/qrCardPrint.tsx",
      "src/app/letter/**/opengraph-image.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]", message: HEX_MESSAGE },
        { selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]", message: HEX_MESSAGE },
      ],
    },
  },
]);

export default eslintConfig;
