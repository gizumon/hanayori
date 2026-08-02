"use client";

import { ChevronDown, Plus, Search, SquarePen, UserPlus, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FONTS } from "../constants";
import { fieldStyle } from "../controls";
import styles from "../letter-studio.module.css";
import type { EventTab, Letter, Project } from "../types";
import { EventHeader } from "./EventHeader";
import { LetterRow } from "./LetterRow";
import { ListToolbar, type SortOption } from "./ListToolbar";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

const addMenuItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  width: "100%",
  padding: "10px 12px",
  border: "none",
  background: "none",
  textAlign: "left" as const,
  borderRadius: 10,
  cursor: "pointer",
};

const addMenuIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 9,
  background: COLOR.tintRose,
  flex: "none",
  marginTop: 1,
};

const addMenuTitleStyle = {
  fontSize: FONT_SIZE.bodySm,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: COLOR.ink,
};

const addMenuCaptionStyle = {
  fontSize: FONT_SIZE.caption,
  letterSpacing: "0.03em",
  color: COLOR.inkSoft,
  lineHeight: 1.5,
  marginTop: 2,
};

type SortKey = "createdDesc" | "createdAsc" | "nameAsc";

const SORT_OPTIONS: SortOption<SortKey>[] = [
  { value: "createdDesc", label: "追加が新しい順" },
  { value: "createdAsc", label: "追加が古い順" },
  { value: "nameAsc", label: "宛名順" },
];

const PAGE_SIZE = 8;

/** 作成者フィルタの「すべて」。uid と衝突しない値にする。 */
const CREATOR_ALL = "__all__";
/** 作成者フィルタの「作成者不明」(この機能より前に作られた手紙)。 */
const CREATOR_UNKNOWN = "__unknown__";

/** 手紙の createdBy をフィルタのキーに落とす。未設定は「不明」にまとめる。 */
function creatorKeyOf(letter: Letter): string {
  return letter.createdBy || CREATOR_UNKNOWN;
}

function sortLetters(letters: Letter[], sort: SortKey): Letter[] {
  const sorted = [...letters];
  switch (sort) {
    case "createdAsc":
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case "nameAsc":
      sorted.sort((a, b) => a.to.localeCompare(b.to, "ja"));
      break;
    case "createdDesc":
    default:
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}

interface ProjectScreenProps {
  project: Project;
  letters: Letter[];
  /** ログイン中の uid。自分が書いた手紙を「あなた」と表示するために使う。 */
  currentUid: string | null;
  loadingLetters: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  onSelectTab: (tab: EventTab) => void;
  onBulkAdd: () => void;
  onNewLetter: () => void;
  onEditLetter: (letter: Letter) => void;
  onShowQr: (letter: Letter) => void;
  onShowEscort: (letter: Letter) => void;
  onCopyLink: (id: string) => void;
  onDeleteLetter: (letter: Letter) => void;
  deletingLetter: boolean;
  letterUrl: (id: string) => string;
  cardNameFor: (letter: Letter) => string;
  escortNameFor: (letter: Letter) => string;
}

export function ProjectScreen({
  project,
  letters,
  currentUid,
  loadingLetters,
  onBack,
  onOpenSettings,
  onSelectTab,
  onBulkAdd,
  onNewLetter,
  onEditLetter,
  onShowQr,
  onShowEscort,
  onCopyLink,
  onDeleteLetter,
  deletingLetter,
  letterUrl,
  cardNameFor,
  escortNameFor,
}: ProjectScreenProps) {
  const cardEnabled = project.cardConfig.enabled;
  const escortEnabled = project.escortConfig.enabled;
  const pFont = FONTS[project.letterConfig.font].family;
  const cFont = FONTS[project.cardConfig.font].family;

  const [sort, setSort] = useState<SortKey>("createdDesc");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [creator, setCreator] = useState<string>(CREATOR_ALL);
  const [shown, setShown] = useState(PAGE_SIZE);

  // 1 人だけのイベントでは「誰が書いたか」は自明なので、作成者まわりは一切出さない。
  const showCreators = project.memberCount > 1;

  /** 作成者の表示名。自分は「あなた」、名前が引けない人は「作成者不明」。 */
  const creatorLabelOf = (letter: Letter): string => {
    if (letter.createdBy && letter.createdBy === currentUid) return "あなた";
    return letter.createdByName || "作成者不明";
  };

  // 絞り込みの選択肢は、実際に手紙を持っている作成者だけから作る。
  // メンバー一覧から作ると「1 通も書いていない人」が並んで選びにくくなる。
  const creatorOptions = useMemo(() => {
    const byKey = new Map<string, { label: string; count: number }>();
    for (const letter of letters) {
      const key = creatorKeyOf(letter);
      const entry = byKey.get(key);
      if (entry) entry.count += 1;
      else byKey.set(key, { label: creatorLabelOf(letter), count: 1 });
    }
    const rest = [...byKey.entries()]
      // 「あなた」を先頭に、残りは名前順。不明は常に末尾。
      .sort(([aKey, a], [bKey, b]) => {
        if (aKey === CREATOR_UNKNOWN) return 1;
        if (bKey === CREATOR_UNKNOWN) return -1;
        if (aKey === currentUid) return -1;
        if (bKey === currentUid) return 1;
        return a.label.localeCompare(b.label, "ja");
      })
      .map(([value, { label, count }]) => ({ value, label: `${label}（${count}）` }));
    return [{ value: CREATOR_ALL, label: "すべての作成者" }, ...rest];
    // creatorLabelOf は currentUid にしか依存しない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters, currentUid]);

  // 入力から300ms経ってから絞り込みに反映する(打鍵のたびに再計算しない)。
  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput), 300);
    return () => clearTimeout(timer);
  }, [queryInput]);
  // 並び替え/検索/作成者を変えたら先頭から数え直す(render 中の派生)。
  const [prevSort, setPrevSort] = useState(sort);
  const [prevQuery, setPrevQuery] = useState(query);
  const [prevCreator, setPrevCreator] = useState(creator);
  if (prevSort !== sort || prevQuery !== query || prevCreator !== creator) {
    setPrevSort(sort);
    setPrevQuery(query);
    setPrevCreator(creator);
    setShown(PAGE_SIZE);
  }
  // 選んでいた作成者の手紙が全部消えたら「すべて」に戻す(空の一覧に固定されないように)。
  if (creator !== CREATOR_ALL && !creatorOptions.some((o) => o.value === creator)) {
    setCreator(CREATOR_ALL);
  }

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addMenuOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byCreator =
      creator === CREATOR_ALL ? letters : letters.filter((l) => creatorKeyOf(l) === creator);
    if (!q) return byCreator;
    return byCreator.filter((l) => {
      const to = l.to.toLowerCase();
      const card = cardNameFor(l).toLowerCase();
      const escort = escortNameFor(l).toLowerCase();
      const table = (l.tableNo ?? "").toLowerCase();
      return to.includes(q) || card.includes(q) || escort.includes(q) || table.includes(q);
    });
  }, [letters, query, creator, cardNameFor, escortNameFor]);
  const sorted = useMemo(() => sortLetters(filtered, sort), [filtered, sort]);
  const visible = sorted.slice(0, shown);

  return (
    <main
      className={styles.fadeup}
      style={{ maxWidth: 960, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 80px" }}
    >
      <EventHeader
        project={project}
        currentTab="list"
        onBack={onBack}
        onSelectTab={onSelectTab}
        onOpenSettings={onOpenSettings}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div ref={addMenuRef} style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            onClick={() => setAddMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
            className={styles.btnSolid}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 18px 12px 22px",
              borderRadius: 999,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.body,
              fontWeight: 600,
              letterSpacing: "0.06em",
              boxShadow: "0 6px 16px rgba(211,165,180,0.35)",
            }}
          >
            <Plus size={17} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
            お手紙を追加
            <ChevronDown
              size={15}
              strokeWidth={2}
              aria-hidden="true"
              style={{
                flex: "none",
                marginLeft: 2,
                transform: addMenuOpen ? "rotate(180deg)" : undefined,
                transition: "transform 0.15s ease",
              }}
            />
          </button>
          {addMenuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 10,
                width: "min(300px,88vw)",
                background: COLOR.surfaceRaised,
                border: `1px solid ${COLOR.border}`,
                borderRadius: 14,
                boxShadow: "0 14px 38px rgba(150,110,130,0.24)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAddMenuOpen(false);
                  onNewLetter();
                }}
                className={styles.optionRow}
                style={addMenuItemStyle}
              >
                <span style={addMenuIconStyle}>
                  <SquarePen size={15} strokeWidth={1.8} color={COLOR.accentInk} aria-hidden="true" />
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={addMenuTitleStyle}>1通ずつ書く</span>
                  <span style={addMenuCaptionStyle}>宛名から本文まで、その場で仕上げます</span>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAddMenuOpen(false);
                  onBulkAdd();
                }}
                className={styles.optionRow}
                style={addMenuItemStyle}
              >
                <span style={addMenuIconStyle}>
                  <UserPlus size={15} strokeWidth={1.8} color={COLOR.accentInk} aria-hidden="true" />
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={addMenuTitleStyle}>名前をまとめて追加</span>
                  <span style={addMenuCaptionStyle}>宛名だけ一気に登録。本文はあとで書けます</span>
                </span>
              </button>
            </div>
          )}
        </div>
        {!loadingLetters && letters.length > 0 && (
          <ListToolbar
            totalCount={sorted.length}
            countUnit="通"
            sortValue={sort}
            sortOptions={SORT_OPTIONS}
            onSortChange={setSort}
            filter={
              // 作成者が実質 1 人なら選択肢にならないので出さない。
              showCreators && creatorOptions.length > 2
                ? {
                    value: creator,
                    options: creatorOptions,
                    onChange: setCreator,
                    ariaLabel: "作成者で絞り込む",
                    icon: (
                      <UserRound
                        size={13}
                        strokeWidth={1.8}
                        color={COLOR.accentInk}
                        aria-hidden="true"
                        style={{ flex: "none" }}
                      />
                    ),
                  }
                : undefined
            }
          />
        )}
        {!loadingLetters && letters.length > 0 && (
          <div style={{ position: "relative", maxWidth: 360, marginBottom: 4 }}>
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
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="宛名・席札・エスコートカード名・テーブル名で検索"
              aria-label="お手紙を検索"
              className={styles.field}
              style={fieldStyle({ width: "100%", padding: "9px 34px 9px 34px" })}
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput("");
                  setQuery("");
                }}
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
        )}
        {!loadingLetters && letters.length === 0 && (
          <p
            style={{
              margin: "2px 0 4px",
              fontSize: FONT_SIZE.bodySm,
              color: COLOR.inkFaint,
              letterSpacing: "0.04em",
            }}
          >
            まだお手紙がありません。上のボタンから最初の1通を追加しましょう。
          </p>
        )}
        {!loadingLetters && letters.length > 0 && sorted.length === 0 && (
          <p
            style={{
              margin: "2px 0 4px",
              fontSize: FONT_SIZE.bodySm,
              color: COLOR.inkFaint,
              letterSpacing: "0.04em",
            }}
          >
            条件に一致するお手紙が見つかりませんでした。
          </p>
        )}
        {loadingLetters &&
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: COLOR.surface,
                border: `1px solid ${COLOR.borderSoft}`,
                padding: "16px 16px 14px 32px",
                boxShadow: "0 6px 20px rgba(150,110,130,0.12)",
              }}
            >
              <div className={styles.skeleton} style={{ height: 18, width: "30%" }} />
              <div className={styles.skeleton} style={{ height: 12, width: "70%" }} />
              <div className={styles.skeleton} style={{ height: 12, width: "45%" }} />
              <div className={styles.skeleton} style={{ height: 20, width: "38%", borderRadius: 999 }} />
            </div>
          ))}
        {!loadingLetters &&
          visible.map((l) => (
            <LetterRow
              key={l.id}
              letter={l}
              cardEnabled={cardEnabled}
              escortEnabled={escortEnabled}
              pFont={pFont}
              cFont={cFont}
              cardName={cardNameFor(l)}
              escortName={escortNameFor(l)}
              creatorLabel={showCreators ? creatorLabelOf(l) : null}
              letterUrl={letterUrl(l.id)}
              deletingLetter={deletingLetter}
              onEdit={() => onEditLetter(l)}
              onShowQr={() => onShowQr(l)}
              onShowEscort={() => onShowEscort(l)}
              onCopyLink={() => onCopyLink(l.id)}
              onDelete={() => onDeleteLetter(l)}
            />
          ))}
        {!loadingLetters && sorted.length > shown && (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className={styles.btnOutline}
            style={{
              display: "block",
              width: "100%",
              padding: "13px 20px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surfaceRaised,
              color: COLOR.ink,
              fontSize: FONT_SIZE.bodySm,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            さらに表示（残り {sorted.length - shown} 件）
          </button>
        )}
      </div>

      <h4
        style={{
          margin: "36px 0 4px",
          fontSize: FONT_SIZE.body,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: COLOR.inkSoft,
        }}
      >
        全手紙共通ページ
      </h4>
      <p style={{ margin: "0 0 14px", fontSize: FONT_SIZE.caption, color: COLOR.inkFaint, letterSpacing: "0.05em" }}>
        お手紙の最後からリンクできる共通コンテンツ(近日公開)
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 14,
          maxWidth: 680,
        }}
      >
        {["新郎新婦プロフィール", "座席表", "お料理メニュー"].map((label) => (
          <div
            key={label}
            style={{
              background: "rgba(255,252,248,0.55)",
              border: `1px dashed ${COLOR.borderDash}`,
              borderRadius: 14,
              padding: 18,
              color: COLOR.inkFaint,
            }}
          >
            <div style={{ fontSize: FONT_SIZE.body, letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: FONT_SIZE.overline, letterSpacing: "0.08em" }}>Coming soon</div>
          </div>
        ))}
      </div>
    </main>
  );
}
