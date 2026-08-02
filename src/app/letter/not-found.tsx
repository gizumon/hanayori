import { BrandMark } from "@/components/letter-studio/BrandMark";
import { THEMES } from "@/components/letter-studio/constants";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

const ROSE = THEMES.rose;

export default function LetterNotFound() {
  return (
    <div
      className="wedding-letter-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: `radial-gradient(ellipse 120% 60% at 50% -10%, ${ROSE.bg2} 0%, transparent 60%), linear-gradient(175deg, ${ROSE.bg1} 0%, ${ROSE.g1} 55%, ${ROSE.g2} 100%)`,
      }}
    >
      <div
        style={{
          width: "min(400px,92vw)",
          background: COLOR.surface,
          borderRadius: 20,
          padding: "44px 34px",
          boxShadow: "0 20px 60px rgba(150,110,130,0.2)",
          textAlign: "center",
        }}
      >
        <BrandMark size={96} />
        <h1
          style={{
            margin: "0 0 12px",
            fontFamily: "'Shippori Mincho', serif",
            fontSize: FONT_SIZE.title,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: COLOR.ink,
          }}
        >
          お手紙が見つかりませんでした
        </h1>
        <p style={{ margin: 0, fontSize: FONT_SIZE.bodySm, letterSpacing: "0.05em", color: COLOR.inkSoft, lineHeight: 1.8 }}>
          URL が正しいかご確認ください。
          <br />
          お手紙の送り主にもう一度リンクを確認してもらいましょう。
        </p>
      </div>
    </div>
  );
}
