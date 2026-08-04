"use client";

import { useParams, useRouter } from "next/navigation";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getFirebaseAuth,
  onAuthStateChanged,
  signOutEverywhere,
  updateDisplayName,
  type User,
} from "@/lib/firebase/auth";
import { api } from "./apiClient";
import { copyText } from "@/lib/clipboard";
import { FONTS } from "./constants";
import { printAllEscortCards as printAllEscortCardsSheet } from "./escortPrint";
import { cardNameFor, escortGeom, escortNameFor, geom } from "./geometry";
import { printAllCards as printAllCardsSheet } from "./qrCardPrint";
import { uploadIfDataUrl } from "./uploadImage";
import type {
  BulkCreateLetter,
  BulkLetterPatch,
  CardConfig,
  Draft,
  EditorTab,
  EscortConfig,
  EventSettingsPatch,
  EventSummary,
  EventTab,
  Letter,
  Screen,
  SettingsTab,
} from "./types";

const EDITOR_TABS = ["letter", "card", "escort"] as const;
const SETTINGS_TABS = ["general", "card", "escort", "members"] as const;
const PREVIEW_KINDS = ["qr", "escort"] as const;
/** 編集ドロワーの `edit` クエリに載せる、新規作成モードを表す特別な値。 */
const NEW_LETTER_ID = "__new__";
/** カード画像保存時のキャプチャ目標幅(px)。一括印刷と同等の解像度になる値。 */
const CAPTURE_TARGET_PX = 1920;

async function establishSession(user: User) {
  const idToken = await user.getIdToken();
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export function useLetterStudio() {
  const router = useRouter();
  const params = useParams<{ eventId?: string }>();

  // --- URL がナビゲーションの source of truth ---
  const curP = params.eventId ?? null;

  // --- Query パラメータ(nuqs)---
  const [edTab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(EDITOR_TABS).withDefault("letter").withOptions({ history: "replace" })
  );
  const [settingsTab, setSettings] = useQueryState(
    "settings",
    parseAsStringLiteral(SETTINGS_TABS)
  );
  const [preview, setPreview] = useQueryState("preview", parseAsString);
  const [previewKind, setPreviewKind] = useQueryState(
    "kind",
    parseAsStringLiteral(PREVIEW_KINDS)
  );
  const [newModal, setNewModal] = useQueryState("new", parseAsBoolean.withDefault(false));
  // 一括追加モーダル(一覧タブから開く)
  const [addModal, setAddModal] = useQueryState("add", parseAsBoolean.withDefault(false));
  // 確認タブ / 一覧から開く 1 通ぶんの編集ドロワー。タブは edTab を共用する。
  const [editId, setEditId] = useQueryState("edit", parseAsString);

  // --- クライアント側データ(URL には載せない)---
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");
  /** ログイン中の uid。手紙の作成者が自分かどうかの判定に使う。 */
  const [userUid, setUserUid] = useState<string | null>(null);
  /** プロフィール写真(Google ログイン等)。無ければ null で、頭文字表示に落ちる。 */
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [projects, setProjects] = useState<EventSummary[]>([]);
  // 手紙一覧はイベント単位でスコープする。lettersFor が現在の eventId と一致
  // するときだけ lettersRaw を採用し、切替時の「クリア」を synchronous な
  // setState 無しで(派生で)表現する。
  const [lettersFor, setLettersFor] = useState<string | null>(null);
  const [lettersRaw, setLettersRaw] = useState<Letter[]>([]);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [hydrated, setHydrated] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingBulk, setCreatingBulk] = useState(false);
  const [deletingLetter, setDeletingLetter] = useState(false);
  const [printingAllEscort, setPrintingAllEscort] = useState(false);
  const [printingAllCards, setPrintingAllCards] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const escortCardRef = useRef<HTMLDivElement | null>(null);
  const savingBulkRef = useRef(false);
  const creatingProjectRef = useRef(false);
  const creatingBulkRef = useRef(false);
  const deletingLetterRef = useRef(false);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2400);
  }, []);

  const refreshEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await api<{ events: EventSummary[] }>("/api/events");
      setProjects(data.events);
      return data.events;
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Firebase Auth がサインイン状態の source of truth。httpOnly セッション
  // クッキーが /api/* を裏で支える。認証が解決したら `hydrated` を立てて
  // 画面のちらつきを隠す。画面(screen)は URL から導出するので、ここでは
  // 認証フラグとイベント取得だけを行い、遷移はしない。
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setAuthed(false);
        setUserName("");
        setUserUid(null);
        setUserPhoto(null);
        setProjects([]);
        setLettersFor(null);
        setLettersRaw([]);
        setHydrated(true);
        return;
      }
      setAuthed(true);
      setUserName(user.displayName || user.email?.split("@")[0] || "");
      setUserUid(user.uid);
      setUserPhoto(user.photoURL);
      setHydrated(true);
      try {
        await refreshEvents();
      } catch {
        try {
          await establishSession(user);
          await refreshEvents();
        } catch {
          setAuthed(false);
        }
      }
    });
    return unsub;
  }, [refreshEvents]);

  // 現在開いているイベントの手紙一覧(スコープ不一致なら空を派生)。参照を
  // 安定させ、下流の effect / memo が毎レンダー再計算しないようにする。
  const letters = useMemo(
    () => (lettersFor === curP ? lettersRaw : []),
    [lettersFor, curP, lettersRaw]
  );

  // イベントを開いたら手紙一覧を取得する。まだそのイベントを読み込んでいない
  // ときだけ走る(project ↔ editor 間の行き来では再取得しない)。setState は
  // async 関数内に閉じてあり、effect 本体からの synchronous な呼び出しは無い。
  useEffect(() => {
    if (!authed || !curP || lettersFor === curP) return;
    let active = true;
    (async () => {
      setLoadingLetters(true);
      try {
        const data = await api<{ letters: Letter[] }>(`/api/events/${curP}/letters`);
        if (!active) return;
        setLettersRaw(data.letters);
        setLettersFor(curP);
      } catch {
        if (active) toast("お手紙の読み込みに失敗しました");
      } finally {
        if (active) setLoadingLetters(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authed, curP, lettersFor, toast]);

  // 伏せられたお手紙(他のメンバーの分)を除いた一覧。中身を見せない設定でも
  // 席札・エスコートカードは全員ぶんを扱うので、`letters` の方も残しておく。
  const visibleLetters = useMemo(() => letters.filter((l) => !l.hidden), [letters]);

  const curProject = projects.find((p) => p.id === curP) || null;
  const cardConf: CardConfig | null = curProject?.cardConfig ?? null;
  const escortConf: EscortConfig | null = curProject?.escortConfig ?? null;

  // 不正な eventId(取得後に見つからない)はイベント一覧へ戻す。
  useEffect(() => {
    if (!authed) return;
    if (curP && !loadingEvents && !curProject) router.replace("/events");
  }, [authed, curP, loadingEvents, curProject, router]);

  // --- ナビゲーション(パスは router、オーバーレイは nuqs setter)---
  const goHome = useCallback(() => {
    void refreshEvents();
    router.push("/events");
  }, [refreshEvents, router]);

  const openProject = useCallback(
    (id: string) => {
      router.push(`/events/${id}`);
    },
    [router]
  );

  /** 新規のお手紙を編集ドロワーで開く(1通ぶんの編集と同じドロワー、ヘッダーだけ「作成」表示)。 */
  const newLetter = useCallback(() => {
    if (!curP) return;
    void setTab("letter");
    void setEditId(NEW_LETTER_ID);
  }, [curP, setEditId, setTab]);

  const openBulkEdit = useCallback(() => {
    if (!curP) return;
    router.push(`/events/${curP}/bulk`);
  }, [curP, router]);

  const openReview = useCallback(() => {
    if (!curP) return;
    router.push(`/events/${curP}/review`);
  }, [curP, router]);

  /** イベント配下のタブ切り替え。一覧 = イベントページ、それ以外は同名のサブルート。 */
  const selectEventTab = useCallback(
    (tab: EventTab) => {
      if (!curP) return;
      router.push(tab === "list" ? `/events/${curP}` : `/events/${curP}/${tab}`);
    },
    [curP, router]
  );

  const openBulkAdd = useCallback(() => {
    void setAddModal(true);
  }, [setAddModal]);
  const closeBulkAdd = useCallback(() => {
    void setAddModal(null);
  }, [setAddModal]);

  /** 1 通ぶんの編集ドロワーを開く。tab は編集画面と同じ query(`tab`)を使う。 */
  const openLetterDrawer = useCallback(
    (id: string, tab: EditorTab = "letter") => {
      void setTab(tab);
      void setEditId(id);
    },
    [setEditId, setTab]
  );
  const closeLetterDrawer = useCallback(() => {
    void setEditId(null);
  }, [setEditId]);

  const openSettings = useCallback(
    (tab: SettingsTab = "general") => {
      void setSettings(tab);
    },
    [setSettings]
  );
  const closeSettings = useCallback(() => {
    void setSettings(null);
  }, [setSettings]);

  const setQrModal = useCallback(
    (l: Letter | null) => {
      if (l) {
        void setPreview(l.id);
        void setPreviewKind("qr");
      } else {
        void setPreview(null);
        void setPreviewKind(null);
      }
    },
    [setPreview, setPreviewKind]
  );

  const setEscortModal = useCallback(
    (l: Letter | null) => {
      if (l) {
        void setPreview(l.id);
        void setPreviewKind("escort");
      } else {
        void setPreview(null);
        void setPreviewKind(null);
      }
    },
    [setPreview, setPreviewKind]
  );

  const setModalShown = useCallback(
    (v: boolean) => {
      if (v) {
        setNewName("");
        setNewDate("");
      }
      void setNewModal(v ? true : null);
    },
    [setNewModal]
  );

  const updateProject = useCallback(
    async (projPatch: object): Promise<boolean> => {
      if (!curP) return false;
      try {
        const data = await api<{ event: EventSummary }>(`/api/events/${curP}`, {
          method: "PATCH",
          body: JSON.stringify(projPatch),
        });
        setProjects((ps) => ps.map((p) => (p.id === data.event.id ? { ...p, ...data.event } : p)));
        return true;
      } catch (err) {
        toast(err instanceof Error ? err.message : "更新に失敗しました");
        return false;
      }
    },
    [curP, toast]
  );

  const saveSettings = useCallback(
    async (settingsPatch: EventSettingsPatch): Promise<boolean> => {
      const ok = await updateProject(settingsPatch);
      if (ok) toast("設定を保存しました");
      return ok;
    },
    [updateProject, toast]
  );

  const letterUrl = useCallback((id: string | null | undefined) => {
    if (!id) return "#";
    if (typeof window === "undefined") return `/letter/${id}`;
    return new URL(`/letter/${id}`, window.location.origin).href;
  }, []);

  const bulkSaveLetters = useCallback(
    async (patches: BulkLetterPatch[]): Promise<boolean> => {
      if (!curP || patches.length === 0) return false;
      if (savingBulkRef.current) return false;
      savingBulkRef.current = true;
      setSavingBulk(true);
      try {
        // 個別保存と同じく、data: URL の写真は送信前に Storage へアップロードして
        // URL 化する(すでに URL のものは uploadIfDataUrl がそのまま返す)。
        const uploaded = await Promise.all(
          patches.map(async (p) => {
            const out: BulkLetterPatch = { ...p };
            if ("photo" in p) out.photo = await uploadIfDataUrl(p.photo);
            if ("escortPhoto" in p) out.escortPhoto = await uploadIfDataUrl(p.escortPhoto);
            return out;
          })
        );
        const data = await api<{ letters: Letter[] }>(`/api/events/${curP}/letters/bulk`, {
          method: "PATCH",
          body: JSON.stringify({ updates: uploaded }),
        });
        const saved = new Map(data.letters.map((l) => [l.id, l]));
        setLettersRaw((ls) => ls.map((l) => saved.get(l.id) ?? l));
        toast("保存しました");
        return true;
      } catch (err) {
        toast(err instanceof Error ? err.message : "保存に失敗しました");
        return false;
      } finally {
        savingBulkRef.current = false;
        setSavingBulk(false);
      }
    },
    [curP, toast]
  );

  /**
   * 編集ドロワーの新規作成モードから1通を作る。作成できたら `edit` クエリを
   * その手紙の id に差し替え、ドロワーは開いたまま(以降は通常の編集)続ける。
   */
  const createLetterFromDrawer = useCallback(
    async (payload: Omit<BulkLetterPatch, "id">): Promise<Letter | null> => {
      if (!curP) return null;
      if (!payload.to?.trim()) {
        toast("宛名を入力してください");
        return null;
      }
      try {
        const [photo, escortPhoto] = await Promise.all([
          uploadIfDataUrl(payload.photo),
          uploadIfDataUrl(payload.escortPhoto),
        ]);
        const data = await api<{ letter: Letter }>(`/api/events/${curP}/letters`, {
          method: "POST",
          body: JSON.stringify({ ...payload, photo, escortPhoto }),
        });
        setLettersRaw((ls) => ls.concat([data.letter]));
        void setEditId(data.letter.id);
        toast("保存しました");
        return data.letter;
      } catch (err) {
        toast(err instanceof Error ? err.message : "保存に失敗しました");
        return null;
      }
    },
    [curP, setEditId, toast]
  );

  /**
   * 宛名(と、一括追加の画面で選んだ項目)から手紙をまとめて作る。
   * 成功したら作成件数を返す。
   */
  const createLettersBulk = useCallback(
    async (rows: BulkCreateLetter[]): Promise<number> => {
      if (!curP) return 0;
      if (creatingBulkRef.current) return 0;
      creatingBulkRef.current = true;
      setCreatingBulk(true);
      try {
        const data = await api<{ letters: Letter[] }>(`/api/events/${curP}/letters/bulk`, {
          method: "POST",
          body: JSON.stringify({ rows }),
        });
        setLettersRaw((ls) => ls.concat(data.letters));
        void setAddModal(null);
        toast(`${data.letters.length}通のお手紙を追加しました`);
        return data.letters.length;
      } catch (err) {
        toast(err instanceof Error ? err.message : "追加に失敗しました");
        return 0;
      } finally {
        creatingBulkRef.current = false;
        setCreatingBulk(false);
      }
    },
    [curP, setAddModal, toast]
  );

  const deleteLetter = useCallback(
    async (id: string) => {
      if (deletingLetterRef.current) return;
      deletingLetterRef.current = true;
      setDeletingLetter(true);
      try {
        await api(`/api/letters/${id}`, { method: "DELETE" });
        setLettersRaw((ls) => ls.filter((l) => l.id !== id));
        toast("削除しました");
      } catch {
        toast("削除に失敗しました");
      } finally {
        deletingLetterRef.current = false;
        setDeletingLetter(false);
      }
    },
    [toast]
  );

  const copyLink = useCallback(
    async (id: string) => {
      const ok = await copyText(letterUrl(id));
      toast(ok ? "リンクをコピーしました" : "コピーに失敗しました");
    },
    [letterUrl, toast]
  );

  const captureCard = useCallback(
    async (
      ref: React.RefObject<HTMLDivElement | null> = cardRef
    ): Promise<HTMLCanvasElement | null> => {
      if (!ref.current) return null;
      const { default: html2canvas } = await import("html2canvas");
      if (document.fonts?.ready) await document.fonts.ready;
      // 画面上のカードはモーダル幅(スマホでは vw 上限で数百pxまで縮む)に
      // 依存するため、固定 scale だと保存画像の解像度が画面サイズ任せになる。
      // 常に一定の出力幅(一括印刷と同等)になるよう表示幅から逆算する。
      const scale = Math.max(3, CAPTURE_TARGET_PX / ref.current.offsetWidth);
      return html2canvas(ref.current, { scale, useCORS: true, backgroundColor: null });
    },
    []
  );

  /** 任意のカードDOM(モーダル内・確認タブの各アイテムなど)を画像として保存する。 */
  const saveCardImage = useCallback(
    async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
      toast("画像を作成しています…");
      const canvas = await captureCard(ref);
      if (!canvas) {
        toast("画像の作成に失敗しました");
        return;
      }
      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast("保存しました");
    },
    [captureCard, toast]
  );

  const saveCard = useCallback(
    () => saveCardImage(cardRef, "qr-card.png"),
    [saveCardImage, cardRef]
  );

  const saveEscortCard = useCallback(
    () => saveCardImage(escortCardRef, "escort-card.png"),
    [saveCardImage, escortCardRef]
  );

  /**
   * 確認タブから「全ゲストぶんをまとめて印刷」。A4 1枚に敷き詰める
   * (チケット風は4枚、カード風は91×55mmのマス目に回転して収め10枚)。
   * 進捗は開いた印刷ウィンドウ側に表示されるので、ここでは開始と結果だけ toast する
   * (別タブに切り替わると元タブの toast は見えなくなるため)。
   */
  const printAllEscortCards = useCallback(
    async (targetLetters: Letter[]) => {
      if (!escortConf || targetLetters.length === 0) return;
      if (printingAllEscort) return;
      setPrintingAllEscort(true);
      toast("印刷を準備しています…");
      try {
        const { opened, printed, failed } = await printAllEscortCardsSheet({
          letters: targetLetters,
          escortConf,
          fontFamily: FONTS[escortConf.font].family,
          fallbackFootText: curProject?.name ?? "",
        });
        if (!opened) {
          toast("ポップアップがブロックされました");
        } else if (printed === 0) {
          toast("印刷用の画像を作成できませんでした");
        } else if (failed > 0) {
          toast(`${printed}枚を印刷ウィンドウに準備しました(${failed}枚は失敗)`);
        } else {
          toast(`${printed}枚を印刷ウィンドウに準備しました`);
        }
      } catch {
        toast("印刷の準備に失敗しました");
      } finally {
        setPrintingAllEscort(false);
      }
    },
    [escortConf, curProject, printingAllEscort, toast]
  );

  /**
   * 確認タブから席札を「全ゲストぶんをまとめて印刷」。91×55mm(横向き)
   * はそのまま、55×91mm(縦向き)は回転して、A4 1枚に10枚敷き詰める。
   * 二つ折り(tent-l / tent-p)は対象外。
   */
  const printAllCards = useCallback(
    async (targetLetters: Letter[]) => {
      if (!cardConf || targetLetters.length === 0) return;
      if (printingAllCards) return;
      setPrintingAllCards(true);
      toast("印刷を準備しています…");
      try {
        const { opened, printed, failed } = await printAllCardsSheet({
          letters: targetLetters,
          cardConf,
          fontFamily: FONTS[cardConf.font].family,
          fallbackFootText: curProject?.name ?? "",
          date: curProject?.date ?? "",
          qrUrlFor: letterUrl,
        });
        if (!opened) {
          toast("ポップアップがブロックされました");
        } else if (printed === 0) {
          toast("印刷用の画像を作成できませんでした");
        } else if (failed > 0) {
          toast(`${printed}枚を印刷ウィンドウに準備しました(${failed}枚は失敗)`);
        } else {
          toast(`${printed}枚を印刷ウィンドウに準備しました`);
        }
      } catch {
        toast("印刷の準備に失敗しました");
      } finally {
        setPrintingAllCards(false);
      }
    },
    [cardConf, curProject, printingAllCards, letterUrl, toast]
  );

  const createProject = useCallback(async () => {
    if (!newName) {
      toast("イベント名を入力してください");
      return;
    }
    if (creatingProjectRef.current) return;
    creatingProjectRef.current = true;
    setCreatingProject(true);
    try {
      const data = await api<{ event: EventSummary }>("/api/events", {
        method: "POST",
        body: JSON.stringify({ name: newName, date: newDate || null }),
      });
      setProjects((ps) => ps.concat([data.event]));
      void setNewModal(null);
      router.push(`/events/${data.event.id}`);
    } catch {
      toast("イベントの作成に失敗しました");
    } finally {
      creatingProjectRef.current = false;
      setCreatingProject(false);
    }
  }, [newName, newDate, router, setNewModal, toast]);

  const logout = useCallback(async () => {
    await signOutEverywhere();
  }, []);

  const updateNickname = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === userName) return;
      const previous = userName;
      // 反映待ちのラグをなくすため、確定を待たず先に表示だけ切り替える。
      // 失敗したら previous に戻す。
      setUserName(trimmed);
      try {
        await updateDisplayName(trimmed);
        toast("ニックネームを更新しました");
      } catch {
        setUserName(previous);
        toast("ニックネームの更新に失敗しました");
      }
    },
    [userName, toast]
  );

  const screen: Screen = !authed ? "login" : curP ? "project" : "home";

  const qrModal = previewKind === "qr" && preview
    ? letters.find((l) => l.id === preview) ?? null
    : null;
  const escortModal = previewKind === "escort" && preview
    ? letters.find((l) => l.id === preview) ?? null
    : null;
  // 新規作成モード(edit クエリが特別な値)かどうか。
  const creatingLetter = editId === NEW_LETTER_ID;
  // 編集ドロワーの対象。一覧の取得前や新規作成モードでは null のまま。
  const drawerLetter =
    editId && !creatingLetter ? letters.find((l) => l.id === editId) ?? null : null;

  const state = useMemo(
    () => ({
      screen,
      userName,
      userUid,
      userPhoto,
      projects,
      curP,
      letters,
      visibleLetters,
      modalShown: newModal,
      addModal,
      editLetter: drawerLetter,
      creatingLetter,
      newName,
      newDate,
      toastMsg,
      qrModal,
      escortModal,
      settingsTab,
      edTab,
    }),
    [
      screen,
      userName,
      userUid,
      userPhoto,
      projects,
      curP,
      letters,
      visibleLetters,
      newModal,
      addModal,
      drawerLetter,
      creatingLetter,
      newName,
      newDate,
      toastMsg,
      qrModal,
      escortModal,
      settingsTab,
      edTab,
    ]
  );

  return {
    state,
    hydrated,
    loadingEvents,
    loadingLetters,
    curProject,
    cardConf,
    escortConf,
    cardRef,
    escortCardRef,
    refreshEvents,
    goHome,
    openProject,
    logout,
    updateNickname,
    setEdTab: (t: EditorTab) => {
      void setTab(t);
    },
    openSettings,
    closeSettings,
    setSettingsTab: (tab: SettingsTab) => {
      void setSettings(tab);
    },
    updateProject,
    saveSettings,
    letterUrl,
    bulkSaveLetters,
    savingBulk,
    createLetterFromDrawer,
    deleteLetter,
    deletingLetter,
    copyLink,
    saveCard,
    saveEscortCard,
    saveCardImage,
    printAllEscortCards,
    printingAllEscort,
    printAllCards,
    printingAllCards,
    createProject,
    creatingProject,
    newLetter,
    openBulkEdit,
    openReview,
    selectEventTab,
    openBulkAdd,
    closeBulkAdd,
    createLettersBulk,
    creatingBulk,
    openLetterDrawer,
    closeLetterDrawer,
    cardNameFor: (l: Draft | Letter | null | undefined) =>
      cardConf ? cardNameFor(l, cardConf) : "お名前",
    escortNameFor: (l: Draft | Letter | null | undefined) =>
      escortConf ? escortNameFor(l, escortConf) : "お名前",
    geom,
    escortGeom,
    edTab,
    setQrModal,
    setEscortModal,
    setModalShown,
    setNewName: (v: string) => setNewName(v),
    setNewDate: (v: string) => setNewDate(v),
    toast,
  };
}

export type LetterStudioApi = ReturnType<typeof useLetterStudio>;
