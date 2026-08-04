"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import { COLOR } from "@/lib/palette";

/** 一覧・一括編集で共通の検索プレースホルダ。絞り込む対象も同じ。 */
export const LETTER_SEARCH_PLACEHOLDER = "宛名・席札・エスコートカード名・テーブル名で検索";

export interface SearchQuery {
  /** 入力欄に映っている文字。打鍵ごとに変わる。 */
  input: string;
  setInput: (v: string) => void;
  /** 絞り込みに使う文字。input から少し遅れて追いつく。 */
  query: string;
  clear: () => void;
}

/**
 * 検索欄の状態。打鍵のたびに一覧を作り直さないよう、絞り込みへの反映を遅らせる。
 */
export function useSearchQuery(delay = 300): SearchQuery {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input), delay);
    return () => clearTimeout(timer);
  }, [input, delay]);

  return {
    input,
    setInput,
    query,
    clear: () => {
      setInput("");
      setQuery("");
    },
  };
}

interface SearchFieldProps {
  search: SearchQuery;
  placeholder: string;
  ariaLabel: string;
}

/**
 * 虫眼鏡つきの検索欄。文字が入っているあいだだけ右にクリアボタンを出す。
 * 余白は置き場所によって違うので、外側の余白は持たせない。
 */
export function SearchField({ search, placeholder, ariaLabel }: SearchFieldProps) {
  return (
    <div style={{ position: "relative", maxWidth: 360 }}>
      <Search
        size={15}
        strokeWidth={1.8}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: COLOR.accentInk,
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={search.input}
        onChange={(e) => search.setInput(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={styles.field}
        style={fieldStyle({ width: "100%", padding: "9px 34px 9px 34px" })}
      />
      {search.input && (
        <button
          type="button"
          onClick={search.clear}
          aria-label="検索をクリア"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: COLOR.accentInk,
            cursor: "pointer",
          }}
        >
          <X size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * 検索文字がお手紙のどれかの名前に当たるか。
 * 宛名・席札の氏名・エスコート名・卓番を見る(一覧と一括編集で同じ判定)。
 */
export function matchesQuery(
  query: string,
  names: { to: string; cardName: string; escortName: string; tableNo: string }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    names.to.toLowerCase().includes(q) ||
    names.cardName.toLowerCase().includes(q) ||
    names.escortName.toLowerCase().includes(q) ||
    names.tableNo.toLowerCase().includes(q)
  );
}
