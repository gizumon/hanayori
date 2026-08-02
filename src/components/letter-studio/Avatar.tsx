"use client";

import { COLOR } from "@/lib/palette";

interface AvatarProps {
  /** プロフィール写真の URL(Google ログイン等)。null なら頭文字を出す。 */
  photoUrl: string | null | undefined;
  /** 表示名。写真が無いときの頭文字に使う。 */
  name: string;
  size: number;
  /** 頭文字のフォントサイズ。省略時は size から比率で決める。 */
  fontSize?: number;
}

/**
 * 円形のユーザーアイコン。写真があればそれ、無ければ頭文字を出す。
 *
 * `<img>` ではなく background-image で描くのは、Next の画像最適化を通さずに
 * 外部ホスト(Google のプロフィール画像 CDN)をそのまま表示するため。
 * トリミングも `cover` に任せられる。
 */
export function Avatar({ photoUrl, name, size, fontSize }: AvatarProps) {
  const initial = name.trim().charAt(0) || "結";
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: photoUrl
          ? `center/cover no-repeat url(${photoUrl})`
          : `linear-gradient(135deg,${COLOR.tintRose},${COLOR.tintRoseDeep})`,
        border: `1px solid ${COLOR.borderSoft}`,
        color: COLOR.accentInk,
        fontSize: fontSize ?? Math.round(size * 0.42),
        fontWeight: 600,
        lineHeight: 1,
        overflow: "hidden",
      }}
    >
      {photoUrl ? "" : initial}
    </span>
  );
}
