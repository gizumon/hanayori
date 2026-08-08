import { withAlpha } from "@/lib/color";
import type { LetterPhoto } from "./types";

/** ratio を持たない写真の既定の縦横比(4:3)。 */
const DEFAULT_RATIO = 4 / 3;

interface LetterPhotosProps {
  photos: LetterPhoto[];
  /** 便箋の紙色。写真の縁をこの色へ溶かして淡く見せる。 */
  paper: string;
  /** 写真の幅(便箋の内側に対する指定)。 */
  width: string;
  /** 本文との間隔。呼び出し側の余白の単位に合わせて渡す。 */
  margin: string;
}

/**
 * 本文のあとに添える写真。白フチのフォトフレームにはせず、縁を紙色へ溶かし、
 * 少し透かして彩度を落とすことで便箋になじませる(「淡く重ねる」見せ方)。
 *
 * 縁のぼかしは mask ではなく紙色のグラデーションを重ねて作る。お手紙は
 * html2canvas で画像として保存できるが、mask-image は解釈されず縁が
 * 立ってしまうため、グラデーションの重ねで同じ見た目を作っている。
 *
 * データ上は複数枚を持てるので配列で受け取り、順に縦へ並べる。
 */
export function LetterPhotos({ photos, paper, width, margin }: LetterPhotosProps) {
  if (photos.length === 0) return null;
  return (
    <>
      {photos.map((photo, i) => (
        <div key={photo.id || i} style={{ position: "relative", width, margin }}>
          <div
            role="img"
            aria-label="思い出の写真"
            style={{
              width: "100%",
              aspectRatio: photo.ratio || DEFAULT_RATIO,
              backgroundImage: `url('${photo.url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.72,
              filter: "saturate(0.85) contrast(0.96)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 76% 76% at 50% 50%, ${withAlpha(paper, 0)} 45%, ${paper} 100%)`,
            }}
          />
        </div>
      ))}
    </>
  );
}
