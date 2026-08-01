"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
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
import { FONTS } from "./constants";
import {
  printAllEscortCards as printAllEscortCardsSheet,
  printErrorHtml,
  printLoadingHtml,
} from "./escortPrint";
import { cardNameFor, escortGeom, escortNameFor, geom } from "./geometry";
import { uploadIfDataUrl } from "./uploadImage";
import { IMAGE_MAX_WIDTH, encodeCanvas } from "./imageEncode";
import type {
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
const SETTINGS_TABS = ["general", "card", "escort"] as const;
const PREVIEW_KINDS = ["qr", "escort"] as const;

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

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
  const pathname = usePathname();
  const params = useParams<{ eventId?: string; letterId?: string }>();

  // --- URL がナビゲーションの source of truth ---
  const curP = params.eventId ?? null;
  const curL = params.letterId && params.letterId !== "new" ? params.letterId : null;
  const isNew = pathname?.endsWith("/letters/new") ?? false;
  const isEditor = isNew || curL !== null;

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
  const [projects, setProjects] = useState<EventSummary[]>([]);
  // 手紙一覧はイベント単位でスコープする。lettersFor が現在の eventId と一致
  // するときだけ lettersRaw を採用し、切替時の「クリア」を synchronous な
  // setState 無しで(派生で)表現する。
  const [lettersFor, setLettersFor] = useState<string | null>(null);
  const [lettersRaw, setLettersRaw] = useState<Letter[]>([]);
  const [draft, setDraftState] = useState<Draft>({});
  // draft を seed した対象("new:<eventId>" か letterId)。render 中に比較して
  // 開くたび一度だけ seed する(HomeScreen の prevSort と同じパターン)。
  const [seedKey, setSeedKey] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [escortCropSrc, setEscortCropSrc] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingBulk, setCreatingBulk] = useState(false);
  const [deletingLetter, setDeletingLetter] = useState(false);
  const [printingAllEscort, setPrintingAllEscort] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const escortCardRef = useRef<HTMLDivElement | null>(null);
  const savingLetterRef = useRef(false);
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
        setProjects([]);
        setLettersFor(null);
        setLettersRaw([]);
        setHydrated(true);
        return;
      }
      setAuthed(true);
      setUserName(user.displayName || user.email?.split("@")[0] || "");
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

  const curProject = projects.find((p) => p.id === curP) || null;
  const cardConf: CardConfig | null = curProject?.cardConfig ?? null;
  const escortConf: EscortConfig | null = curProject?.escortConfig ?? null;

  const setDraft = useCallback((d: Draft) => {
    setDraftState((prev) => ({ ...prev, ...d }));
  }, []);

  // 編集画面に入ったら、対象の手紙(または新規の空)から draft を「開くたび
  // 一度だけ」seed する。effect ではなく render 中に前回値(seedKey)と比較して
  // 更新する(HomeScreen の prevSort と同じ、React 公認の派生パターン)。
  // 条件付きなので無限ループにはならず、編集途中も上書きしない。
  const seedTarget = !isEditor ? null : isNew ? `new:${curP}` : curL;
  if (seedTarget !== seedKey) {
    if (seedTarget === null) {
      // 編集画面を離れた。次に同じ手紙を開いたとき再 seed できるよう解除。
      setSeedKey(null);
    } else if (isNew) {
      setSeedKey(seedTarget);
      setDraftState({ to: "", theme: "rose", body: "", photo: null });
    } else {
      // 一覧未取得なら letter が見つからず seedKey を進めない → 取得後に再試行。
      const letter = lettersRaw.find((l) => l.id === curL);
      if (letter) {
        setSeedKey(seedTarget);
        setDraftState({ ...letter });
      }
    }
  }

  // 不正な eventId / letterId(取得後に見つからない)は一覧へ戻す。
  useEffect(() => {
    if (!authed) return;
    if (curP && !loadingEvents && !curProject) {
      router.replace("/events");
      return;
    }
    if (curL && !isNew && !loadingLetters && letters.length > 0 && !letters.some((l) => l.id === curL)) {
      router.replace(`/events/${curP}`);
    }
  }, [authed, curP, curL, isNew, loadingEvents, loadingLetters, curProject, letters, router]);

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

  const backToProject = useCallback(() => {
    router.push(curP ? `/events/${curP}` : "/events");
  }, [curP, router]);

  const newLetter = useCallback(() => {
    if (!curP) return;
    router.push(`/events/${curP}/letters/new`);
  }, [curP, router]);

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

  const saveLetter = useCallback(async () => {
    if (!curP) return;
    if (savingLetterRef.current) return;
    if (!draft.to) {
      toast("宛名を入力してください");
      return;
    }
    savingLetterRef.current = true;
    setSavingLetter(true);
    try {
      // 画像は data: URL のままドラフトで保持している。保存時にだけ Storage へ
      // アップロードして URL 化する(Firestore には URL のみ保存)。すでに URL の
      // 場合(既存手紙の再編集)は再アップロードしない。
      const [photo, escortPhoto] = await Promise.all([
        uploadIfDataUrl(draft.photo),
        uploadIfDataUrl(draft.escortPhoto),
      ]);
      // アップ済み URL をドラフトへ反映して、再保存時の二重アップを防ぐ。
      if (photo !== (draft.photo ?? null) || escortPhoto !== (draft.escortPhoto ?? null)) {
        setDraftState((prev) => ({ ...prev, photo, escortPhoto }));
      }
      const payload = {
        to: draft.to,
        body: draft.body || "",
        theme: draft.theme || "rose",
        photo,
        photoRatio: draft.photoRatio,
        cardName: draft.cardName ?? null,
        honor: draft.honor ?? null,
        tableNo: draft.tableNo ?? null,
        escortName: draft.escortName ?? null,
        escortMessage: draft.escortMessage ?? null,
        escortHonor: draft.escortHonor ?? null,
        escortPhoto,
        escortPhotoRatio: draft.escortPhotoRatio,
      };
      const data = draft.id
        ? await api<{ letter: Letter }>(`/api/letters/${draft.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await api<{ letter: Letter }>(`/api/events/${curP}/letters`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const saved = data.letter;
      setDraftState((prev) => ({ ...prev, id: saved.id }));
      setLettersRaw((ls) =>
        ls.some((l) => l.id === saved.id)
          ? ls.map((l) => (l.id === saved.id ? saved : l))
          : ls.concat([saved])
      );
      // 新規保存だった場合は URL を確定手紙に置き換える。seedKey を先に確定手紙
      // に進めておき、URL 変化で draft が再 seed されない(＝ちらつかない)ように。
      if (isNew) {
        setSeedKey(saved.id);
        router.replace(`/events/${curP}/letters/${saved.id}`);
      }
      toast("保存しました");
    } catch (err) {
      toast(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      savingLetterRef.current = false;
      setSavingLetter(false);
    }
  }, [curP, draft, isNew, router, toast]);

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

  /** 宛名だけの手紙をまとめて作る。成功したら作成件数を返す。 */
  const createLettersBulk = useCallback(
    async (names: string[]): Promise<number> => {
      if (!curP) return 0;
      if (creatingBulkRef.current) return 0;
      creatingBulkRef.current = true;
      setCreatingBulk(true);
      try {
        const data = await api<{ letters: Letter[] }>(`/api/events/${curP}/letters/bulk`, {
          method: "POST",
          body: JSON.stringify({ names }),
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
        if (draft.id === id) {
          setDraftState({});
          router.push(curP ? `/events/${curP}` : "/events");
        }
        toast("削除しました");
      } catch {
        toast("削除に失敗しました");
      } finally {
        deletingLetterRef.current = false;
        setDeletingLetter(false);
      }
    },
    [curP, draft.id, router, toast]
  );

  const upPhoto = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const w = Math.min(IMAGE_MAX_WIDTH, img.width);
          const h = Math.round((img.height * w) / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          setDraft({
            photo: encodeCanvas(canvas),
            photoRatio: +(w / h).toFixed(4),
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [setDraft]
  );

  const copyLink = useCallback(
    async (id: string) => {
      const url = letterUrl(id);
      try {
        await navigator.clipboard.writeText(url);
        toast("リンクをコピーしました");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          toast("リンクをコピーしました");
        } catch {
          toast("コピーに失敗しました");
        }
        ta.remove();
      }
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
      return html2canvas(ref.current, { scale: 3, useCORS: true, backgroundColor: null });
    },
    []
  );

  const saveCard = useCallback(async () => {
    toast("画像を作成しています…");
    const canvas = await captureCard();
    if (!canvas) {
      toast("画像の作成に失敗しました");
      return;
    }
    const a = document.createElement("a");
    a.download = "qr-card.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast("保存しました");
  }, [captureCard, toast]);

  const printCard = useCallback(async () => {
    // モバイル(特に iOS Safari)は非同期処理を挟んだ後の window.open を
    // 「ユーザー操作直後」とみなさずブロックすることがあるため、キャプチャの
    // 前にウィンドウを確保しておき、準備画面はそのウィンドウ内に表示する。
    const w = window.open("", "_blank");
    if (!w) {
      toast("ポップアップがブロックされました");
      return;
    }
    w.document.write(
      printLoadingHtml({
        windowTitle: "QRカード印刷",
        title: "QRカードを準備中です",
        sub: "もうすこしで完成します",
      })
    );
    w.document.close();
    toast("印刷を準備しています…");
    const canvas = await captureCard();
    if (w.closed) return;
    if (!canvas) {
      toast("印刷の準備に失敗しました");
      w.document.open();
      w.document.write(
        printErrorHtml({ windowTitle: "QRカード印刷", message: "時間をおいて、もう一度<br/>お試しください" })
      );
      w.document.close();
      return;
    }
    const dims = cardConf ? geom(cardConf, "#ccc").printDims : "width:91mm;height:55mm";
    w.document.open();
    w.document.write(
      `<html><head><title>QRカード印刷</title><style>@page{size:auto;margin:10mm}body{margin:0;display:flex;justify-content:center;padding-top:10mm}img{${dims}}</style></head><body><img src="${canvas.toDataURL(
        "image/png"
      )}" onload="setTimeout(function(){window.print()},200)"></body></html>`
    );
    w.document.close();
  }, [cardConf, captureCard, toast]);

  const saveEscortCard = useCallback(async () => {
    toast("画像を作成しています…");
    const canvas = await captureCard(escortCardRef);
    if (!canvas) {
      toast("画像の作成に失敗しました");
      return;
    }
    const a = document.createElement("a");
    a.download = "escort-card.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast("保存しました");
  }, [captureCard, toast]);

  const printEscortCard = useCallback(async () => {
    // printCard と同様、キャプチャ前にウィンドウを確保してモバイルでの
    // ポップアップブロックを避ける。
    const w = window.open("", "_blank");
    if (!w) {
      toast("ポップアップがブロックされました");
      return;
    }
    w.document.write(
      printLoadingHtml({
        windowTitle: "エスコートカード印刷",
        title: "エスコートカードを準備中です",
        sub: "もうすこしで完成します",
      })
    );
    w.document.close();
    toast("印刷を準備しています…");
    const canvas = await captureCard(escortCardRef);
    if (w.closed) return;
    if (!canvas) {
      toast("印刷の準備に失敗しました");
      w.document.open();
      w.document.write(
        printErrorHtml({
          windowTitle: "エスコートカード印刷",
          message: "時間をおいて、もう一度<br/>お試しください",
        })
      );
      w.document.close();
      return;
    }
    const dims = escortConf ? escortGeom(escortConf.style).printDims : "width:182mm;height:65mm";
    w.document.open();
    w.document.write(
      `<html><head><title>エスコートカード印刷</title><style>@page{size:auto;margin:10mm}body{margin:0;display:flex;justify-content:center;padding-top:10mm}img{${dims}}</style></head><body><img src="${canvas.toDataURL(
        "image/png"
      )}" onload="setTimeout(function(){window.print()},200)"></body></html>`
    );
    w.document.close();
  }, [escortConf, captureCard, toast]);

  /**
   * 確認タブから「全ゲストぶんをまとめて印刷」。ticket 風のみ対応(A4 1枚に4枚)。
   * 進捗は開いた印刷ウィンドウ側に表示されるので、ここでは開始と結果だけ toast する
   * (別タブに切り替わると元タブの toast は見えなくなるため)。
   */
  const printAllEscortCards = useCallback(
    async (targetLetters: Letter[]) => {
      if (!escortConf || escortConf.style !== "ticket" || targetLetters.length === 0) return;
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

  // アップロードしたらまずクロップモーダルを開く。切り取り確定でドラフトに入る。
  const upEscortPhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => setEscortCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const applyEscortCrop = useCallback((dataUrl: string, ratio: number) => {
    setDraftState((prev) => ({ ...prev, escortPhoto: dataUrl, escortPhotoRatio: ratio }));
    setEscortCropSrc(null);
  }, []);

  const cancelEscortCrop = useCallback(() => setEscortCropSrc(null), []);

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

  const screen: Screen = !authed
    ? "login"
    : isEditor
      ? "editor"
      : curP
        ? "project"
        : "home";

  const qrModal = previewKind === "qr" && preview
    ? letters.find((l) => l.id === preview) ?? null
    : null;
  const escortModal = previewKind === "escort" && preview
    ? letters.find((l) => l.id === preview) ?? null
    : null;
  // 編集ドロワーの対象。一覧の取得前は null のままで、取得後に解決する。
  const drawerLetter = editId ? letters.find((l) => l.id === editId) ?? null : null;

  const state = useMemo(
    () => ({
      screen,
      userName,
      projects,
      curP,
      curL,
      letters,
      draft,
      modalShown: newModal,
      addModal,
      editLetter: drawerLetter,
      newName,
      newDate,
      toastMsg,
      qrModal,
      escortModal,
      escortCropSrc,
      settingsTab,
      edTab,
    }),
    [
      screen,
      userName,
      projects,
      curP,
      curL,
      letters,
      draft,
      newModal,
      addModal,
      drawerLetter,
      newName,
      newDate,
      toastMsg,
      qrModal,
      escortModal,
      escortCropSrc,
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
    goHome,
    openProject,
    backToProject,
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
    setDraft,
    letterUrl,
    saveLetter,
    savingLetter,
    bulkSaveLetters,
    savingBulk,
    deleteLetter,
    deletingLetter,
    upPhoto,
    copyLink,
    saveCard,
    printCard,
    saveEscortCard,
    printEscortCard,
    printAllEscortCards,
    printingAllEscort,
    upEscortPhoto,
    applyEscortCrop,
    cancelEscortCrop,
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
