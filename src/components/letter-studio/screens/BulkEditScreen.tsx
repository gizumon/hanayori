"use client";

import { Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "../Avatar";
import { THEMES } from "../constants";
import { encodeImageFile } from "../imageEncode";
import styles from "../letter-studio.module.css";
import { PhotoPicker } from "../PhotoPicker";
import type { BulkLetterPatch, EventTab, Honor, Letter, Project, SettingsTab } from "../types";
import { CREATOR_ALL, CreatorFilter, useCreatorFilter } from "./CreatorFilter";
import { EventHeader } from "./EventHeader";
import { ListToolbar, type SortOption } from "./ListToolbar";
import {
  LETTER_SEARCH_PLACEHOLDER,
  SearchField,
  matchesQuery,
  useSearchQuery,
} from "./SearchField";
import { FONT_SIZE } from "@/lib/typography";
import { COLOR } from "@/lib/palette";

type CellType = "text" | "theme" | "honor" | "photo";
type BulkField =
  | "to"
  | "theme"
  | "photos"
  | "cardName"
  | "honor"
  | "tableNo"
  | "escortName"
  | "escortMessage"
  | "escortHonor"
  | "escortPhoto";

interface FieldDef {
  key: BulkField;
  label: string;
  type: CellType;
  desc: string;
  placeholder?: string;
  /** テキスト欄の自動生成プレースホルダ(空欄時に実際に使われる値)。 */
  auto?: (l: Letter) => string;
  /** 敬称欄の「既定」が指すイベント既定値。 */
  honorDefault?: Honor;
}

interface CategoryDef {
  key: string;
  label: string;
  /** 名前の列の見出し。対象ごとに呼び名が違う(宛名 / 席札の氏名 / エスコート名)。 */
  nameLabel: string;
  /** 名前の列に出す値。実際にその対象へ印字される名前を返す。 */
  nameOf: (l: Letter) => string;
  fields: FieldDef[];
}

interface BulkEditScreenProps {
  project: Project;
  letters: Letter[];
  /** ログイン中の uid。作成者フィルタで自分を「あなた」と表示するために使う。 */
  currentUid: string | null;
  loading: boolean;
  saving: boolean;
  onBack: () => void;
  onSelectTab: (tab: EventTab) => void;
  /** 共通設定ドロワーを開く。タブ指定なしなら「基本」。 */
  onOpenSettings: (tab?: SettingsTab) => void;
  onSave: (patches: BulkLetterPatch[]) => Promise<boolean>;
  cardNameFor: (l: Letter) => string;
  escortNameFor: (l: Letter) => string;
}


/** 伏せられたお手紙の行に出す一言。一覧・確認のぼかしと同じ趣旨。 */
const HIDDEN_ROW_NOTE = "作成した人だけが直せます";

const HONOR_OPTIONS = (
  def: Honor,
  narrow: boolean
): { value: Honor | null; label: string }[] => [
  // 狭い画面では 4 つのピルを一行に収めたいので「既定」だけにする。
  { value: null, label: narrow ? "既定" : `既定(${def || "なし"})` },
  { value: "様", label: "様" },
  { value: "さん", label: "さん" },
  { value: "", label: "なし" },
];

/** お手紙一覧と同じ並び順。「名前順」の見出しだけ、選んでいる対象の呼び名に合わせる。 */
type SortKey = "createdDesc" | "createdAsc" | "nameAsc";

function sortRows(
  list: Letter[],
  sort: SortKey,
  savedOf: (l: Letter) => Letter,
  nameOf: (l: Letter) => string
): Letter[] {
  const sorted = [...list];
  switch (sort) {
    case "createdAsc":
      sorted.sort((a, b) => savedOf(a).createdAt.localeCompare(savedOf(b).createdAt));
      break;
    case "nameAsc":
      sorted.sort((a, b) => nameOf(savedOf(a)).localeCompare(nameOf(savedOf(b)), "ja"));
      break;
    case "createdDesc":
    default:
      sorted.sort((a, b) => savedOf(b).createdAt.localeCompare(savedOf(a).createdAt));
      break;
  }
  return sorted;
}

export function BulkEditScreen({
  project,
  letters,
  currentUid,
  loading,
  saving,
  onBack,
  onSelectTab,
  onOpenSettings,
  onSave,
  cardNameFor,
  escortNameFor,
}: BulkEditScreenProps) {
  const categories = useMemo<CategoryDef[]>(() => {
    const cats: CategoryDef[] = [
      {
        key: "letter",
        label: "お手紙",
        nameLabel: "宛名",
        nameOf: (l) => l.to.trim() || "(宛名未設定)",
        fields: [
          {
            key: "to",
            label: "宛名",
            type: "text",
            placeholder: "はなこへ",
            desc: "お手紙の宛名。席札・エスコート名の自動生成にも使われます。",
          },
          { key: "theme", label: "色", type: "theme", desc: "お手紙の配色テーマを選びます。" },
          {
            key: "photos",
            label: "写真",
            type: "photo",
            desc: "空欄なら共通設定の既定の写真が使われます。",
          },
        ],
      },
    ];
    if (project.cardConfig.enabled) {
      cats.push({
        key: "card",
        label: "席札",
        nameLabel: "席札の氏名",
        nameOf: cardNameFor,
        fields: [
          {
            key: "cardName",
            label: "席札の氏名",
            type: "text",
            placeholder: "(宛名から自動)",
            auto: cardNameFor,
            desc: "空欄なら宛名から自動で作られます。",
          },
          {
            key: "honor",
            label: "敬称",
            type: "honor",
            honorDefault: project.cardConfig.honor,
            desc: "席札に付ける敬称。「既定」はイベント共通設定に従います。",
          },
        ],
      });
    }
    if (project.escortConfig.enabled) {
      cats.push({
        key: "escort",
        label: "エスコート",
        nameLabel: "エスコート名",
        nameOf: escortNameFor,
        fields: [
          {
            key: "tableNo",
            label: "卓番",
            type: "text",
            placeholder: "A / 1 / はなこ",
            desc: "エスコートカードに表示する卓番号・卓名。",
          },
          {
            key: "escortName",
            label: "エスコート名",
            type: "text",
            placeholder: "(自動)",
            auto: escortNameFor,
            desc: "空欄なら席札の氏名・宛名から自動で作られます。",
          },
          {
            key: "escortMessage",
            label: "一言",
            type: "text",
            placeholder: "今日はよろしくね",
            desc: "エスコートカードに載せる一言メッセージ(任意)。",
          },
          {
            key: "escortHonor",
            label: "敬称",
            type: "honor",
            honorDefault: project.escortConfig.honor,
            desc: "エスコートカードに付ける敬称。",
          },
          {
            key: "escortPhoto",
            label: "写真",
            type: "photo",
            desc: "エスコートカードに載せる写真(任意)。空欄ならイベント既定写真。",
          },
        ],
      });
    }
    return cats;
  }, [project, cardNameFor, escortNameFor]);

  // スマホ幅では列を詰める(名前は短く、コントロールは省略形に)。
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [catKey, setCatKey] = useState("letter");
  const [fieldKey, setFieldKey] = useState<BulkField>("to");
  const [sort, setSort] = useState<SortKey>("createdDesc");
  const search = useSearchQuery();

  const category = categories.find((c) => c.key === catKey) ?? categories[0];
  const field = category.fields.find((f) => f.key === fieldKey) ?? category.fields[0];

  // --- 作業コピー。編集時は行を丸ごと差し替えるので prop の Letter は不変。---
  const [rows, setRows] = useState<Letter[]>(letters);
  const [changed, setChanged] = useState<Set<string>>(() => new Set());
  // 未保存の変更が無いときだけ、letters の更新(取得・保存反映)を rows に取り込む。
  // ref ではなく state で前回値を持ち、render 中に比較して派生する
  // (useLetterStudio の seedKey / HomeScreen の prevSort と同じパターン)。
  const [seeded, setSeeded] = useState(letters);
  if (seeded !== letters && changed.size === 0) {
    setSeeded(letters);
    setRows(letters);
  }

  const baseline = useMemo(() => new Map(letters.map((l) => [l.id, l])), [letters]);

  // 伏せられたお手紙も行としては並べる(どの対象でも、作成者フィルタのアイコンにも
  // 出る)。ただし「お手紙」の項目(宛名・色・写真)はお手紙の中身そのものなので、
  // その行のコントロールは錠前に差し替えて作成者本人だけが直せるようにする。
  const lockedRow = (l: Letter) => category.key === "letter" && Boolean(l.hidden);

  const creatorFilter = useCreatorFilter(letters, currentUid, project.memberCount);

  // 絞り込み・並び替えのキーは「保存済みの値」から採る。編集中の作業コピーで
  // 数えると、宛名を打っている最中に行が消えたり順番が入れ替わったりする。
  const savedOf = (l: Letter) => baseline.get(l.id) ?? l;
  const shownRows = useMemo(() => {
    const list = creatorFilter.apply(rows).filter((r) => {
      const saved = savedOf(r);
      return matchesQuery(search.query, {
        to: saved.to,
        cardName: cardNameFor(saved),
        escortName: escortNameFor(saved),
        tableNo: saved.tableNo ?? "",
      });
    });
    return sortRows(list, sort, savedOf, category.nameOf);
    // creatorFilter.apply / savedOf は creatorFilter.value / baseline にしか依存しない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, baseline, creatorFilter.value, search.query, sort, category, cardNameFor, escortNameFor]);

  // 「名前順」の呼び名は対象で変わる(宛名順 / 席札の氏名順 / エスコート名順)。
  const sortOptions = useMemo<SortOption<SortKey>[]>(
    () => [
      { value: "createdDesc", label: "追加が新しい順" },
      { value: "createdAsc", label: "追加が古い順" },
      { value: "nameAsc", label: `${category.nameLabel}順` },
    ],
    [category.nameLabel]
  );

  // 1 人だけのイベントでは「誰が書いたか」が自明なので、作成者の列は畳む。
  const showCreator = creatorFilter.show;
  // 卓番は名前の下に添える。ただし卓番そのものを編集している列とは重ねない。
  const showTableNo = project.escortConfig.enabled && field.key !== "tableNo";

  // いま編集している写真の列で、共通設定に入っている既定の写真。
  const fieldDefaultPhoto =
    field.key === "photos"
      ? project.letterConfig.defaultPhotos[0]?.url ?? null
      : field.key === "escortPhoto"
        ? project.escortConfig.defaultPhoto
        : null;

  const cellKey = (id: string, f: BulkField) => `${id}:${f}`;
  const changedForField = (f: BulkField) =>
    [...changed].filter((k) => k.endsWith(`:${f}`)).length;
  const changedForCat = (c: CategoryDef) =>
    c.fields.reduce((sum, f) => sum + changedForField(f.key), 0);

  // 敬称の「なし」("")と「既定」(null)は別物なので "" は畳まない。
  // Letter の任意フィールドは undefined になり得るので null に正規化して比較する。
  // 写真の配列(photos)だけは参照ではなく中身で比べる。
  const norm = (v: unknown) => (v === undefined ? null : v);
  const sameValue = (a: unknown, b: unknown) =>
    Array.isArray(a) || Array.isArray(b)
      ? JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
      : norm(a) === norm(b);

  /**
   * セルの値を書き換える。`extra` は同時に動かす関連フィールド(写真の縦横比や
   * 「出さない」フラグ)で、変更ありの印は列のキー 1 つにまとめる。
   */
  function setField(id: string, f: BulkField, value: unknown, extra?: Partial<Letter>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [f]: value, ...extra } : r)));
    setChanged((c) => {
      const next = new Set(c);
      const base = baseline.get(id) as Record<string, unknown> | undefined;
      const k = cellKey(id, f);
      // 関連フィールドだけが動くこともある(「共通設定を使う」↔「なし」)ので、
      // 変更の有無はまとめて見る。
      const patched: Record<string, unknown> = { [f]: value, ...extra };
      const unchanged =
        base && Object.keys(patched).every((key) => sameValue(base[key], patched[key]));
      if (unchanged) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function onPickPhoto(id: string, f: BulkField, file: File) {
    try {
      const { dataUrl, ratio } = await encodeImageFile(file);
      // お手紙の写真は配列。表に出しているのは先頭の 1 枚なので、そこだけ差し替える。
      if (f === "photos") {
        const cur = rows.find((r) => r.id === id)?.photos ?? [];
        setField(id, f, [{ id: cur[0]?.id ?? "", url: dataUrl, ratio }, ...cur.slice(1)], {
          hidePhotos: false,
        });
      } else {
        setField(id, f, dataUrl, { escortPhotoRatio: ratio, hideEscortPhoto: false });
      }
    } catch {
      /* エンコード失敗時は何もしない(トーストは保存時にまとめて出る) */
    }
  }

  /** × で外す。共通設定の既定も使わない状態(「なし」)にする。 */
  function onRemovePhoto(id: string, f: BulkField) {
    if (f === "photos") {
      const cur = rows.find((r) => r.id === id)?.photos ?? [];
      setField(id, f, cur.slice(1), { hidePhotos: true });
    } else {
      setField(id, f, null, { escortPhotoRatio: undefined, hideEscortPhoto: true });
    }
  }

  /** 共通設定の既定写真に戻す。 */
  function onUseDefaultPhoto(id: string, f: BulkField) {
    if (f === "photos") setField(id, f, [], { hidePhotos: false });
    else setField(id, f, null, { escortPhotoRatio: undefined, hideEscortPhoto: false });
  }

  function selectCategory(key: string) {
    const cat = categories.find((c) => c.key === key);
    if (!cat) return;
    setCatKey(key);
    setFieldKey(cat.fields[0].key);
  }

  async function handleSave() {
    const byLetter = new Map<string, Set<BulkField>>();
    changed.forEach((k) => {
      const idx = k.lastIndexOf(":");
      const id = k.slice(0, idx);
      const f = k.slice(idx + 1) as BulkField;
      (byLetter.get(id) ?? byLetter.set(id, new Set()).get(id)!).add(f);
    });
    const rowMap = new Map(rows.map((r) => [r.id, r]));
    const patches: BulkLetterPatch[] = [];
    byLetter.forEach((fields, id) => {
      const row = rowMap.get(id);
      if (!row) return;
      const rr = row as unknown as Record<string, unknown>;
      const p: Record<string, unknown> = { id };
      fields.forEach((f) => {
        p[f] = rr[f] ?? null;
        // 写真の列は関連フィールドも一緒に送る(縦横比と「出さない」)。
        if (f === "photos") p.hidePhotos = row.hidePhotos ?? false;
        if (f === "escortPhoto") {
          p.escortPhotoRatio = row.escortPhotoRatio;
          p.hideEscortPhoto = row.hideEscortPhoto ?? false;
        }
      });
      patches.push(p as BulkLetterPatch);
    });
    const ok = await onSave(patches);
    if (ok) setChanged(new Set());
  }

  function handleRevert() {
    setRows(letters);
    setChanged(new Set());
  }

  const changedCount = changed.size;

  return (
    <>
      <main
        className={styles.fadeup}
        style={{ maxWidth: 1040, margin: "0 auto", padding: "28px clamp(16px,4vw,40px) 120px" }}
      >
        <EventHeader
          project={project}
          currentTab="bulk"
          onBack={onBack}
          onSelectTab={onSelectTab}
          onOpenSettings={onOpenSettings}
        />

        {/* 2 段ピッカー: 対象 → 項目 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 16,
            background: COLOR.surface,
            border: `1px solid ${COLOR.divider}`,
            borderRadius: 14,
            marginBottom: 16,
          }}
        >
          {/* 1 通ぶんの編集ドロワーと同じタブ。 */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "rgba(211,165,180,0.16)",
              borderRadius: 999,
              padding: 4,
              alignSelf: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {categories.map((c) => {
              const active = c.key === category.key;
              const n = changedForCat(c);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => selectCategory(c.key)}
                  style={{
                    position: "relative",
                    padding: "9px 22px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: FONT_SIZE.bodySm,
                    letterSpacing: "0.08em",
                    background: active ? COLOR.surface : "transparent",
                    color: active ? COLOR.ink : COLOR.inkMuted,
                    fontWeight: active ? 600 : 400,
                    boxShadow: active ? "0 2px 8px rgba(150,110,130,0.18)" : "none",
                  }}
                >
                  {c.label}
                  {n > 0 && <Badge value={n} floating />}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {category.fields.map((f) => {
              const active = f.key === field.key;
              const n = changedForField(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFieldKey(f.key)}
                  style={{
                    border: active ? `1px solid ${COLOR.accent}` : `1px solid ${COLOR.border}`,
                    background: active ? COLOR.accent : COLOR.surface,
                    color: active ? COLOR.onAccent : COLOR.ink,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    padding: "8px 15px",
                    borderRadius: 999,
                    fontSize: FONT_SIZE.bodySm,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    boxShadow: active ? "0 3px 10px rgba(211,165,180,0.4)" : "none",
                  }}
                >
                  {f.label}
                  {n > 0 && <Badge value={n} onAccent={active} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 件数・作成者・並び替え。お手紙一覧と同じツールバーを使う。 */}
        {!loading && rows.length > 0 && (
          <ListToolbar
            totalCount={shownRows.length}
            countUnit="件"
            sortValue={sort}
            sortOptions={sortOptions}
            onSortChange={setSort}
            filter={
              creatorFilter.show ? (
                <CreatorFilter
                  options={creatorFilter.options}
                  value={creatorFilter.value}
                  allValue={CREATOR_ALL}
                  onChange={creatorFilter.setValue}
                />
              ) : undefined
            }
          />
        )}
        {!loading && rows.length > 0 && (
          <SearchField
            search={search}
            placeholder={LETTER_SEARCH_PLACEHOLDER}
            ariaLabel="編集するお手紙を検索"
          />
        )}

        <p style={{ margin: "10px 0 14px", fontSize: FONT_SIZE.caption, color: COLOR.inkFaint, letterSpacing: "0.03em" }}>
          {field.desc}
        </p>

        {loading && shownRows.length === 0 ? (
          <p style={{ fontSize: FONT_SIZE.bodySm, color: COLOR.inkSoft }}>読み込んでいます…</p>
        ) : shownRows.length === 0 ? (
          <p style={{ fontSize: FONT_SIZE.bodySm, color: COLOR.inkSoft }}>
            {rows.length === 0
              ? "まだお手紙がありません。"
              : "条件に一致するお手紙が見つかりませんでした。"}
          </p>
        ) : (
          <div
            style={{
              background: COLOR.surface,
              border: `1px solid ${COLOR.divider}`,
              borderRadius: 14,
            }}
          >
            <table
              className={styles.bulkTable}
              style={{
                width: "100%",
                // 見出しの角丸を効かせるため collapse にはしない(境界は td 側で引く)。
                borderCollapse: "separate",
                borderSpacing: 0,
                // 列幅を固定して、長い名前は切り詰める(横スクロールを出さない)。
                tableLayout: "fixed",
              }}
            >
              {/* 名前 / 作成者 / 編集中の項目。残り幅は編集列に渡す。 */}
              <colgroup>
                <col style={{ width: narrow ? "38%" : "30%" }} />
                {showCreator && <col style={{ width: narrow ? 52 : 74 }} />}
                <col />
              </colgroup>
              <thead>
                <tr>
                  <Th narrow={narrow}>{category.nameLabel}</Th>
                  {showCreator && (
                    <Th narrow={narrow} align="center">
                      作成者
                    </Th>
                  )}
                  <Th narrow={narrow}>{field.label}</Th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    field={field}
                    name={category.nameOf(row)}
                    creator={
                      showCreator
                        ? { label: creatorFilter.labelOf(row), photoUrl: row.createdByPhoto ?? null }
                        : null
                    }
                    showTableNo={showTableNo}
                    locked={lockedRow(row)}
                    narrow={narrow}
                    changed={changed.has(cellKey(row.id, field.key))}
                    onText={(v) => setField(row.id, field.key, v)}
                    onTheme={(v) => setField(row.id, field.key, v)}
                    onHonor={(v) => setField(row.id, field.key, v)}
                    defaultPhoto={fieldDefaultPhoto}
                    onPickPhoto={(file) => onPickPhoto(row.id, field.key, file)}
                    onRemovePhoto={() => onRemovePhoto(row.id, field.key)}
                    onUseDefaultPhoto={() => onUseDefaultPhoto(row.id, field.key)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 保存バー。ドロワーのフッターと同じく、画面下端に貼り付く。
          <main> は fadeup の transform アニメーションが position:fixed の
          containing block を作ってしまうので、外に出して兄弟として置く。 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: COLOR.surface,
          borderTop: `1px solid ${COLOR.divider}`,
          padding: "10px clamp(16px,4vw,40px) calc(10px + env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              flex: narrow ? "1 1 100%" : 1,
              minWidth: 0,
              fontSize: FONT_SIZE.bodySm,
              color: COLOR.inkSoft,
              letterSpacing: "0.02em",
            }}
          >
            {changedCount > 0 ? (
              <>
                <b style={{ color: COLOR.change, fontVariantNumeric: "tabular-nums" }}>{changedCount}</b>{" "}
                件のセルを変更中 — 保存するとまとめて反映します
              </>
            ) : (
              "変更はありません"
            )}
          </span>
          <button
            type="button"
            onClick={handleRevert}
            disabled={changedCount === 0 || saving}
            className={styles.btnOutline}
            style={{
              flex: narrow ? "1 1 0" : undefined,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${COLOR.border}`,
              background: "transparent",
              color: COLOR.inkSoft,
              fontSize: FONT_SIZE.label,
              letterSpacing: "0.06em",
              opacity: changedCount === 0 || saving ? 0.45 : 1,
              cursor: changedCount === 0 || saving ? "default" : "pointer",
            }}
          >
            取り消す
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={changedCount === 0 || saving}
            className={styles.btnSolid}
            style={{
              flex: narrow ? "2 1 0" : undefined,
              padding: "11px 24px",
              borderRadius: 999,
              border: "none",
              background: COLOR.accent,
              color: COLOR.onAccent,
              fontSize: FONT_SIZE.body,
              letterSpacing: "0.06em",
              boxShadow: "0 6px 16px rgba(211,165,180,0.4)",
              opacity: changedCount === 0 || saving ? 0.45 : 1,
              cursor: changedCount === 0 || saving ? "default" : "pointer",
            }}
          >
            {saving ? "保存中…" : "まとめて保存"}
          </button>
        </div>
      </div>
    </>
  );
}

function Badge({ value, floating, onAccent }: { value: number; floating?: boolean; onAccent?: boolean }) {
  return (
    <span
      style={{
        ...(floating
          ? { position: "absolute", top: -5, right: -3 }
          : { position: "static" }),
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 999,
        background: onAccent ? COLOR.surfaceRaised : COLOR.change,
        color: onAccent ? COLOR.accentInk : COLOR.onAccent,
        fontSize: FONT_SIZE.micro,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {value}
    </span>
  );
}

/** 表の見出しセル。スクロールしても列の意味が分かるよう上端に貼り付く。 */
function Th({
  children,
  align,
  narrow,
}: {
  children: React.ReactNode;
  align?: "center";
  narrow: boolean;
}) {
  return (
    <th
      scope="col"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        padding: narrow ? "9px 6px" : "9px 12px",
        textAlign: align ?? "left",
        background: COLOR.tint,
        borderBottom: `1px solid ${COLOR.border}`,
        fontSize: FONT_SIZE.overline,
        fontWeight: 600,
        letterSpacing: "0.1em",
        color: COLOR.inkMuted,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {children}
    </th>
  );
}

interface RowProps {
  row: Letter;
  field: FieldDef;
  /** 名前の列に出す値。選んでいる対象に実際に印字される名前。 */
  name: string;
  /** 作成者のアイコン。null = 列そのものを出さない(1 人だけのイベント)。 */
  creator: { label: string; photoUrl: string | null } | null;
  showTableNo: boolean;
  /** 他のメンバーが「見せない」に設定したお手紙。並べるが直せない。 */
  locked: boolean;
  narrow: boolean;
  changed: boolean;
  /** 写真の列で、共通設定に入っている既定の写真。無ければ null。 */
  defaultPhoto: string | null;
  onText: (v: string) => void;
  onTheme: (v: Letter["theme"]) => void;
  onHonor: (v: Honor | null) => void;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onUseDefaultPhoto: () => void;
}

function Row({
  row,
  field,
  name,
  creator,
  showTableNo,
  locked,
  narrow,
  changed,
  defaultPhoto,
  onText,
  onTheme,
  onHonor,
  onPickPhoto,
  onRemovePhoto,
  onUseDefaultPhoto,
}: RowProps) {
  const accent = THEMES[row.theme].accent;
  const cell = {
    padding: narrow ? "9px 6px" : "10px 12px",
    // borderCollapse を使わないので、行の区切りは上辺だけで引く。
    borderTop: `1px solid ${COLOR.divider}`,
    verticalAlign: "middle" as const,
  };

  return (
    <tr className={styles.bulkRow}>
      <td
        style={{
          ...cell,
          // 変更中の行は左端に印を出す(どのセルを直したかが一覧で分かる)。
          boxShadow: changed ? `inset 3px 0 0 ${COLOR.change}` : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {/* お手紙の配色。どの対象を編集していても、行がどのお手紙かの手がかりになる。 */}
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flex: "none",
              background: accent,
              boxShadow: `0 0 0 2px ${COLOR.surfaceRaised}, 0 0 0 3px ${accent}55`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              title={name}
              style={{
                fontSize: narrow ? FONT_SIZE.bodySm : FONT_SIZE.body,
                fontWeight: 600,
                color: COLOR.ink,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>
            {showTableNo && (
              <div style={{ fontSize: FONT_SIZE.micro, color: COLOR.inkFaint, letterSpacing: "0.02em" }}>
                卓 {row.tableNo || "—"}
              </div>
            )}
          </div>
        </div>
      </td>

      {creator && (
        <td style={{ ...cell, textAlign: "center" }}>
          <span
            role="img"
            aria-label={`${creator.label}が作成`}
            title={`${creator.label}が作成`}
            style={{ display: "inline-flex" }}
          >
            <Avatar photoUrl={creator.photoUrl} name={creator.label} size={narrow ? 22 : 26} />
          </span>
        </td>
      )}

      <td style={cell}>
        {locked ? (
          <span
            title={HIDDEN_ROW_NOTE}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: COLOR.inkMuted,
              fontSize: FONT_SIZE.caption,
              letterSpacing: "0.04em",
            }}
          >
            <Lock size={13} strokeWidth={1.8} aria-hidden="true" style={{ flex: "none" }} />
            {narrow ? "直せません" : HIDDEN_ROW_NOTE}
          </span>
        ) : (
          <Control
            row={row}
            field={field}
            narrow={narrow}
            defaultPhoto={defaultPhoto}
            onText={onText}
            onTheme={onTheme}
            onHonor={onHonor}
            onPickPhoto={onPickPhoto}
            onRemovePhoto={onRemovePhoto}
            onUseDefaultPhoto={onUseDefaultPhoto}
          />
        )}
      </td>
    </tr>
  );
}

interface ControlProps {
  row: Letter;
  field: FieldDef;
  narrow: boolean;
  onText: (v: string) => void;
  onTheme: (v: Letter["theme"]) => void;
  onHonor: (v: Honor | null) => void;
  defaultPhoto: string | null;
  onPickPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onUseDefaultPhoto: () => void;
}

function Control({
  row,
  field,
  narrow,
  defaultPhoto,
  onText,
  onTheme,
  onHonor,
  onPickPhoto,
  onRemovePhoto,
  onUseDefaultPhoto,
}: ControlProps) {
  if (field.type === "text") {
    const value = (row[field.key] as string | null) ?? "";
    return (
      <input
        value={value}
        placeholder={field.auto ? field.auto(row) : field.placeholder}
        onChange={(e) => onText(e.target.value)}
        className={styles.field}
        style={{
          // 列幅いっぱい。列の幅は colgroup が決める。
          width: "100%",
          fontSize: FONT_SIZE.input,
          color: COLOR.ink,
          background: COLOR.surfaceRaised,
          border: `1px solid ${COLOR.border}`,
          borderRadius: 9,
          padding: narrow ? "8px 9px" : "9px 11px",
          letterSpacing: "0.02em",
          outline: "none",
        }}
      />
    );
  }

  if (field.type === "theme") {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => {
          const selected = row.theme === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onTheme(k)}
              aria-label={THEMES[k].label}
              aria-pressed={selected}
              title={THEMES[k].label}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                cursor: "pointer",
                padding: 0,
                background: THEMES[k].accent,
                border: selected ? `3px solid ${COLOR.ink}` : `3px solid ${COLOR.surfaceRaised}`,
                boxShadow: `0 0 0 1px ${COLOR.border}, 0 2px 6px rgba(150,110,130,0.18)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (field.type === "honor") {
    const current = (row[field.key] as Honor | null | undefined) ?? null;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {HONOR_OPTIONS(field.honorDefault ?? "", narrow).map(({ value, label }) => {
          const selected = current === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onHonor(value)}
              aria-pressed={selected}
              className={styles.btnOutline}
              style={{
                padding: narrow ? "6px 10px" : "7px 13px",
                borderRadius: 999,
                fontSize: FONT_SIZE.caption,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                background: selected ? COLOR.accent : COLOR.surfaceRaised,
                color: selected ? COLOR.onAccent : COLOR.ink,
                border: selected ? `1px solid ${COLOR.accent}` : `1px solid ${COLOR.border}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // photo。お手紙の写真は配列なので、表には先頭の 1 枚を出す。
  // 枠には実際に出る写真(自分の写真、無ければ共通設定の既定)を入れる。
  const own =
    field.key === "photos" ? row.photos[0]?.url ?? null : (row.escortPhoto as string | null) ?? null;
  const hidden = field.key === "photos" ? Boolean(row.hidePhotos) : Boolean(row.hideEscortPhoto);
  const inherited = !own && !hidden;
  const photo = inherited ? defaultPhoto : own;
  return (
    <PhotoPicker
      photo={photo}
      onPick={onPickPhoto}
      onRemove={onRemovePhoto}
      badge={inherited ? "共通" : null}
      onUseDefault={defaultPhoto && !inherited ? onUseDefaultPhoto : undefined}
      size={narrow ? 44 : 52}
      ariaLabel={field.label}
    />
  );
}
