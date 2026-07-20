import { BrandMark } from "@/components/letter-studio/BrandMark";

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
        background:
          "radial-gradient(ellipse 120% 60% at 50% -10%, #FCF6F8 0%, transparent 60%), linear-gradient(175deg, #F7ECEF 0%, #F1E0E7 55%, #EDD8E1 100%)",
      }}
    >
      <div
        style={{
          width: "min(400px,92vw)",
          background: "#FFFCF8",
          borderRadius: 20,
          padding: "44px 34px",
          boxShadow: "0 20px 60px rgba(150,110,130,0.2)",
          textAlign: "center",
        }}
      >
        <BrandMark size={100} />
        <h1
          style={{
            margin: "0 0 12px",
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "#5C4A4A",
          }}
        >
          お手紙が見つかりませんでした
        </h1>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.05em", color: "#8C7676", lineHeight: 1.8 }}>
          URL が正しいかご確認ください。
          <br />
          お手紙の送り主にもう一度リンクを確認してもらいましょう。
        </p>
      </div>
    </div>
  );
}
