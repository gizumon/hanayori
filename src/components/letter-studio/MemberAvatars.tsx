"use client";

import { Avatar } from "./Avatar";
import styles from "./letter-studio.module.css";
import type { EventMember } from "./types";
import { memberDisplayName } from "./useEventMembers";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

/** 重なりの深さ。アイコンの大きさが変わっても見え方が崩れない比率。 */
const OVERLAP_RATIO = -0.29;
/** これより多いぶんは「+N」にまとめる。 */
const DEFAULT_MAX = 4;

interface MemberAvatarsProps {
  members: EventMember[];
  size?: number;
  max?: number;
  /**
   * 重なりを切り抜く縁取りの色。載せる面の色を渡す
   * (ページの地なら COLOR.bg、カードの上なら COLOR.surface)。
   */
  ringColor?: string;
  /** 押したときの動作。省略すると静的な表示になる(カードの中など、入れ子にできない場所)。 */
  onOpen?: () => void;
}

/**
 * イベントの共同編集メンバーを、重ねた丸アイコンで並べる。
 * 「誰と作っているか」を人数の数字より早く伝えるための表示。
 */
export function MemberAvatars({
  members,
  size = 24,
  max = DEFAULT_MAX,
  ringColor = COLOR.bg,
  onOpen,
}: MemberAvatarsProps) {
  if (members.length === 0) return null;

  const overlap = Math.round(size * OVERLAP_RATIO);
  const ring = `0 0 0 2px ${ringColor}`;
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  const names = shown.map(memberDisplayName).join("、") + (rest > 0 ? ` ほか${rest}人` : "");

  const content = (
    <>
      {shown.map((m, i) => (
        <span
          key={m.uid}
          style={{
            display: "flex",
            marginLeft: i === 0 ? 0 : overlap,
            borderRadius: "50%",
            boxShadow: ring,
          }}
        >
          <Avatar photoUrl={m.photoUrl} name={memberDisplayName(m)} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: size,
            height: size,
            padding: "0 5px",
            marginLeft: overlap,
            borderRadius: 999,
            background: COLOR.surfaceRaised,
            border: `1px solid ${COLOR.borderSoft}`,
            boxShadow: ring,
            color: COLOR.inkSoft,
            fontSize: FONT_SIZE.caption,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          +{rest}
        </span>
      )}
    </>
  );

  const layout = { display: "flex", alignItems: "center", flex: "none" } as const;

  if (!onOpen) {
    return (
      <span style={layout} title={names} aria-label={`メンバー${members.length}人`} role="img">
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`メンバー${members.length}人。共同編集の設定を開く`}
      title={names}
      className={styles.avatarStack}
      style={{ ...layout, padding: 0, border: "none", background: "none", cursor: "pointer" }}
    >
      {content}
    </button>
  );
}
