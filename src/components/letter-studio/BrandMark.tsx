interface BrandMarkProps {
  /** マークの高さ(px)。幅は元画像の比率から決まります。 */
  size?: number;
}

/** ロゴ画像（scripts/generate-icons.js が出力）の実寸。幅を高さから算出するために使います。 */
const INTRINSIC = { width: 411, height: 420 };

export function BrandMark({ size = 140 }: BrandMarkProps) {
  const width = Math.round((size * INTRINSIC.width) / INTRINSIC.height);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/logo-mark.png"
      alt="Hanayori"
      width={width}
      height={size}
      style={{ display: "block", margin: "0 auto 8px" }}
    />
  );
}
