interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 140 }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      role="img"
      aria-label="Hanayori"
      style={{ display: "block", margin: "0 auto 8px" }}
    >
      <circle cx="70" cy="70" r="68" fill="#FCF6F8" />
      <circle cx="70" cy="70" r="68" fill="none" stroke="#EBD9DF" strokeWidth="1.5" />
      <g fill="#D3A5B4">
        <ellipse cx="70" cy="48" rx="10" ry="16" opacity="0.9" />
        <ellipse cx="52" cy="58" rx="10" ry="16" transform="rotate(-48 52 58)" opacity="0.75" />
        <ellipse cx="88" cy="58" rx="10" ry="16" transform="rotate(48 88 58)" opacity="0.75" />
        <ellipse cx="46" cy="80" rx="10" ry="16" transform="rotate(-96 46 80)" opacity="0.6" />
        <ellipse cx="94" cy="80" rx="10" ry="16" transform="rotate(96 94 80)" opacity="0.6" />
      </g>
      <circle cx="70" cy="70" r="9" fill="#E3C293" />
      <path
        d="M70 92 C58 100 54 112 60 122"
        fill="none"
        stroke="#A9BC9E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M70 92 C82 100 86 112 80 122"
        fill="none"
        stroke="#A9BC9E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
