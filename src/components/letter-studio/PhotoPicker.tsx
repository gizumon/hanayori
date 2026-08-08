"use client";

import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { IMAGE_ACCEPT } from "./imageEncode";
import styles from "./letter-studio.module.css";
import { COLOR } from "@/lib/palette";
import { FONT_SIZE } from "@/lib/typography";

interface PhotoPickerProps {
  /** 枠に出す写真の URL。null = 何も入っていない。 */
  photo: string | null;
  /** 写真が選ばれた。切り取りが要る場所は、呼び出し側がここで CropModal を出す。 */
  onPick: (file: File) => void;
  onRemove: () => void;
  /** 枠の一辺(px)。表のセルでは小さく、ドロワーでは大きく。 */
  size?: number;
  /** 何も入っていないときに枠の中へ出す短い文言。狭い場所では省く。 */
  label?: string;
  /**
   * 枠に出しているのが共通設定から来た写真であることを示す印(「共通設定」など)。
   * このお手紙で選んだ写真のときは渡さない。
   */
  badge?: string | null;
  /**
   * 渡すと「共通設定の写真を使う」を枠の下に出す。× で外したあと、選び直す
   * 代わりに共通設定へ戻せるようにするためのもの。
   */
  onUseDefault?: () => void;
  /** スクリーンリーダー用の名前(「席札の写真」など)。 */
  ariaLabel: string;
}

/**
 * 写真の選択。**枠そのものがボタン**で、押す(またはドラッグ&ドロップ)と選択、
 * もう一度押すと入れ替え、右上の × で外す。「写真を選ぶ」「変更」「削除」の
 * ボタンを並べる代わりに、枠の中に見えているものを直接触る形にしてある。
 *
 * 共通設定に既定の写真があるときは、それが最初から枠に入って見える(`badge` で
 * 共通設定から来ていることを示す)。× で外すと空になり、`onUseDefault` から
 * いつでも共通設定に戻せる。
 *
 * ファイル入力は隠さず読み上げ用に残してある(`display:none` にするとキーボードで
 * 到達できなくなるため)。フォーカスは枠の縁で示す。
 */
export function PhotoPicker({
  photo,
  onPick,
  onRemove,
  size = 96,
  label,
  badge,
  onUseDefault,
  ariaLabel,
}: PhotoPickerProps) {
  const [dropping, setDropping] = useState(false);

  const take = (file: File | undefined) => {
    setDropping(false);
    if (file && file.type.startsWith("image/")) onPick(file);
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, flex: "none" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <label
          className={styles.photoTile}
          onDragOver={(e) => {
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            e.preventDefault();
            take(e.dataTransfer.files?.[0]);
          }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            overflow: "hidden",
            border: photo
              ? `1px solid ${dropping ? COLOR.accent : COLOR.border}`
              : `1px dashed ${dropping ? COLOR.accent : COLOR.borderDash}`,
            background: photo ? COLOR.surfaceRaised : dropping ? COLOR.tint : COLOR.surface,
            backgroundImage: photo ? `url('${photo}')` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            aria-label={ariaLabel}
            className={styles.srOnly}
            onChange={(e) => {
              take(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {photo ? (
            // 写真が入っているときは、押せることをホバー/フォーカスのときだけ伝える。
            <span
              aria-hidden="true"
              className={styles.photoTileHint}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(60,42,46,0.42)",
                color: COLOR.onAccent,
                fontSize: FONT_SIZE.micro,
                letterSpacing: "0.08em",
              }}
            >
              入れ替え
            </span>
          ) : (
            <span
              aria-hidden="true"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                color: COLOR.inkFaint,
                textAlign: "center",
                padding: "0 6px",
              }}
            >
              <ImagePlus size={size >= 72 ? 22 : 16} strokeWidth={1.6} />
              {label && <span style={{ fontSize: FONT_SIZE.micro, letterSpacing: "0.04em" }}>{label}</span>}
            </span>
          )}
        </label>
        {photo && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${ariaLabel}を外す`}
            title="外す"
            className={styles.photoRemove}
            style={{
              position: "absolute",
              top: -7,
              right: -7,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.inkSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              boxShadow: "0 2px 6px rgba(150,110,130,0.25)",
            }}
          >
            <X size={12} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
        {photo && badge && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 5,
              bottom: 5,
              padding: "2px 6px",
              borderRadius: 999,
              background: "rgba(60,42,46,0.62)",
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.micro,
              letterSpacing: "0.04em",
              lineHeight: 1.4,
              pointerEvents: "none",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {onUseDefault && (
        <button
          type="button"
          onClick={onUseDefault}
          className={styles.btnOutline}
          style={{
            alignSelf: "flex-start",
            maxWidth: "100%",
            padding: "5px 10px",
            borderRadius: 999,
            border: `1px solid ${COLOR.border}`,
            background: COLOR.surfaceRaised,
            color: COLOR.accentInk,
            fontSize: FONT_SIZE.micro,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          共通設定の写真を使う
        </button>
      )}
    </div>
  );
}
