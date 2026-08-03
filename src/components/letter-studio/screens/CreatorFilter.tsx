"use client";

import { useMemo, useState } from "react";
import { Avatar } from "../Avatar";
import styles from "../letter-studio.module.css";
import type { Letter } from "../types";
import { COLOR } from "@/lib/palette";

export interface CreatorOption {
  /** 作成者の uid(不明な作成者はまとめ用の擬似キー)。 */
  value: string;
  label: string;
  photoUrl: string | null;
  /** その人が書いた手紙の数。ツールチップに出す。 */
  count: number;
}

interface CreatorFilterProps {
  options: CreatorOption[];
  /** 選択中の作成者。`allValue` なら絞り込みなし。 */
  value: string;
  allValue: string;
  onChange: (value: string) => void;
}

const AVATAR_SIZE = 26;
/** 重なりの深さ。MemberAvatars と同じ比率にして、アイコンの並びの見え方を揃える。 */
const OVERLAP = Math.round(AVATAR_SIZE * -0.28);

/**
 * 重ねた作成者アイコンそのものを絞り込みスイッチにする。
 * 選ぶと本人だけが色を保ち、他はグレーに退く。もう一度押すと解除(= すべて表示)。
 * 「すべて」の項目やドロップダウンを持たないぶん、1 タップで行き来できる。
 */
export function CreatorFilter({ options, value, allValue, onChange }: CreatorFilterProps) {
  const filtering = value !== allValue;

  return (
    <div
      role="group"
      aria-label="作成者で絞り込む"
      style={{
        display: "inline-flex",
        alignItems: "center",
        // 並び替えのピルと同じ高さ・縁にして、ツールバーの一列として揃える。
        padding: "4px 9px",
        borderRadius: 999,
        border: `1px solid ${COLOR.border}`,
        background: COLOR.surfaceRaised,
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        const dimmed = filtering && !active;
        return (
          <button
            key={opt.value}
            type="button"
            // 排他選択だが「押して解除」もできるので radio ではなくトグルとして扱う。
            aria-pressed={active}
            aria-label={
              active
                ? `${opt.label}での絞り込みを解除`
                : `${opt.label}が作成したお手紙だけ表示（${opt.count}通）`
            }
            title={`${opt.label}（${opt.count}通）`}
            onClick={() => onChange(active ? allValue : opt.value)}
            className={styles.avatarToggle}
            style={{
              display: "flex",
              position: "relative",
              // 選んだ人を重なりの一番上に出す。
              zIndex: active ? 2 : 1,
              marginLeft: i === 0 ? 0 : OVERLAP,
              padding: 0,
              border: "none",
              borderRadius: "50%",
              background: "none",
              // 内側=選択の縁取り、外側=土台の色で重なりを切り抜く輪郭。
              boxShadow: active
                ? `0 0 0 2px ${COLOR.accent}, 0 0 0 4px ${COLOR.surfaceRaised}`
                : `0 0 0 2px ${COLOR.surfaceRaised}`,
              // 外れている人は色を抜いて背面に沈める(消さずに戻り道を残す)。
              filter: dimmed ? "grayscale(1)" : undefined,
              opacity: dimmed ? 0.4 : 1,
            }}
          >
            <Avatar photoUrl={opt.photoUrl} name={opt.label} size={AVATAR_SIZE} />
          </button>
        );
      })}
    </div>
  );
}

/** 作成者フィルタの「すべて」。uid と衝突しない値にする。 */
export const CREATOR_ALL = "__all__";
/** 作成者フィルタの「作成者不明」(この機能より前に作られた手紙)。 */
const CREATOR_UNKNOWN = "__unknown__";

/** 手紙の createdBy をフィルタのキーに落とす。未設定は「不明」にまとめる。 */
function creatorKeyOf(letter: Letter): string {
  return letter.createdBy || CREATOR_UNKNOWN;
}

export interface CreatorFilterState {
  /** 選択中のキー。`CREATOR_ALL` なら絞り込みなし。 */
  value: string;
  setValue: (value: string) => void;
  options: CreatorOption[];
  /** 絞り込みを画面に出す価値があるか(作成者が実質1人なら false)。 */
  show: boolean;
  /** 選択中の作成者だけに絞る。絞り込みなしならそのまま返す。 */
  apply: <T extends Letter>(list: T[]) => T[];
  /** 作成者の表示名。自分は「あなた」、名前が引けない人は「作成者不明」。 */
  labelOf: (letter: Letter) => string;
}

/**
 * 作成者アイコンでの絞り込みの状態。お手紙一覧・一括編集・確認タブで共用する。
 * 選択肢は「実際に手紙を持っている作成者」だけから作る
 * (メンバー一覧から作ると 1 通も書いていない人が並んで選びにくくなる)。
 */
export function useCreatorFilter(
  letters: Letter[],
  currentUid: string | null,
  memberCount: number
): CreatorFilterState {
  const [value, setValue] = useState<string>(CREATOR_ALL);

  const labelOf = (letter: Letter): string => {
    if (letter.createdBy && letter.createdBy === currentUid) return "あなた";
    return letter.createdByName || "作成者不明";
  };

  const options = useMemo<CreatorOption[]>(() => {
    const byKey = new Map<string, CreatorOption>();
    for (const letter of letters) {
      const key = creatorKeyOf(letter);
      const entry = byKey.get(key);
      if (entry) entry.count += 1;
      else
        byKey.set(key, {
          value: key,
          label: labelOf(letter),
          photoUrl: letter.createdByPhoto ?? null,
          count: 1,
        });
    }
    return [...byKey.values()]
      // 「あなた」を先頭に、残りは名前順。不明は常に末尾。
      .sort((a, b) => {
        if (a.value === CREATOR_UNKNOWN) return 1;
        if (b.value === CREATOR_UNKNOWN) return -1;
        if (a.value === currentUid) return -1;
        if (b.value === currentUid) return 1;
        return a.label.localeCompare(b.label, "ja");
      });
    // labelOf は currentUid にしか依存しない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters, currentUid]);

  // 選んでいた作成者の手紙が全部消えたら「すべて」に戻す(空の一覧に固定されないように)。
  if (value !== CREATOR_ALL && !options.some((o) => o.value === value)) {
    setValue(CREATOR_ALL);
  }

  return {
    value,
    setValue,
    options,
    // 1 人だけのイベントでは「誰が書いたか」は自明。作成者が 1 人でも絞る意味がない。
    show: memberCount > 1 && options.length > 1,
    apply: (list) => (value === CREATOR_ALL ? list : list.filter((l) => creatorKeyOf(l) === value)),
    labelOf,
  };
}
