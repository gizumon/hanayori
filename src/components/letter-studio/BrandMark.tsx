import { COLOR } from "@/lib/palette";
interface BrandMarkProps {
  size?: number;
}

const PETAL = "M50 50 C40 38 40 22 50 13 C60 22 60 38 50 50 Z";

export function BrandMark({ size = 140 }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Hanayori"
      style={{ display: "block", margin: "0 auto 8px" }}
    >
      <g
        fill="none"
        stroke={COLOR.accent}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d={PETAL} transform={`rotate(${angle} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="4" fill={COLOR.accent} />
    </svg>
  );
}
