"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFirebaseAuth,
  onAuthStateChanged,
  signOutEverywhere,
  updateDisplayName,
  type User,
} from "@/lib/firebase/auth";
import { cardNameFor, geom } from "./geometry";
import type {
  CardConfig,
  Draft,
  EditorTab,
  EventSettingsPatch,
  EventSummary,
  Letter,
  Screen,
  SettingsTab,
  StudioState,
} from "./types";

const initialState: StudioState = {
  screen: "login",
  userName: "",
  projects: [],
  curP: null,
  curL: null,
  letters: [],
  draft: {},
  modalShown: false,
  newName: "",
  newDate: "",
  toastMsg: "",
  qrModal: null,
  settingsTab: null,
  edTab: "letter",
};

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
  const [state, setState] = useState<StudioState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const savingLetterRef = useRef(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const creatingProjectRef = useRef(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const deletingLetterRef = useRef(false);
  const [deletingLetter, setDeletingLetter] = useState(false);

  const patch = useCallback((p: Partial<StudioState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const toast = useCallback(
    (msg: string) => {
      patch({ toastMsg: msg });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => patch({ toastMsg: "" }), 2400);
    },
    [patch]
  );

  const refreshEvents = useCallback(async () => {
    const data = await api<{ events: EventSummary[] }>("/api/events");
    patch({ projects: data.events });
    return data.events;
  }, [patch]);

  // Firebase Auth is the source of truth for sign-in state; the httpOnly
  // session cookie backs every /api/* call. Both server-rendered and
  // first-client-rendered HTML show the neutral `initialState` (screen:
  // "login") so they never mismatch — the `hydrated` gate hides the
  // one-frame transition once onAuthStateChanged resolves.
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setState((s) => ({
          ...s,
          screen: "login",
          userName: "",
          projects: [],
          letters: [],
          curP: null,
          curL: null,
        }));
        setHydrated(true);
        return;
      }
      const userName = user.displayName || user.email?.split("@")[0] || "";
      try {
        const events = await refreshEvents();
        setState((s) => ({ ...s, projects: events, screen: "home", userName }));
      } catch {
        try {
          await establishSession(user);
          const events = await refreshEvents();
          setState((s) => ({ ...s, projects: events, screen: "home", userName }));
        } catch {
          setState((s) => ({ ...s, screen: "login" }));
        }
      }
      setHydrated(true);
    });
    return unsub;
  }, [refreshEvents]);

  const curProject = state.projects.find((p) => p.id === state.curP) || null;
  const cardConf: CardConfig | null = curProject?.cardConfig ?? null;

  const go = useCallback(
    (screen: Screen, extra?: Partial<StudioState>) => {
      patch({ screen, ...extra });
    },
    [patch]
  );

  const goHome = useCallback(() => {
    patch({ screen: "home", curP: null, curL: null, letters: [] });
    void refreshEvents();
  }, [patch, refreshEvents]);

  const openProject = useCallback(
    async (id: string) => {
      patch({ curP: id, screen: "project" });
      try {
        const data = await api<{ letters: Letter[] }>(`/api/events/${id}/letters`);
        patch({ letters: data.letters });
      } catch {
        toast("お手紙の読み込みに失敗しました");
      }
    },
    [patch, toast]
  );

  const updateProject = useCallback(
    async (projPatch: object): Promise<boolean> => {
      if (!state.curP) return false;
      try {
        const data = await api<{ event: EventSummary }>(`/api/events/${state.curP}`, {
          method: "PATCH",
          body: JSON.stringify(projPatch),
        });
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) => (p.id === data.event.id ? { ...p, ...data.event } : p)),
        }));
        return true;
      } catch {
        toast("更新に失敗しました");
        return false;
      }
    },
    [state.curP, toast]
  );

  const saveSettings = useCallback(
    async (settingsPatch: EventSettingsPatch): Promise<boolean> => {
      const ok = await updateProject(settingsPatch);
      if (ok) toast("設定を保存しました");
      return ok;
    },
    [updateProject, toast]
  );

  const setDraft = useCallback((d: Draft) => {
    setState((s) => ({ ...s, draft: { ...s.draft, ...d } }));
  }, []);

  const letterUrl = useCallback((id: string | null | undefined) => {
    if (!id) return "#";
    if (typeof window === "undefined") return `/letter/${id}`;
    return new URL(`/letter/${id}`, window.location.origin).href;
  }, []);

  const saveLetter = useCallback(async () => {
    if (!state.curP) return;
    if (savingLetterRef.current) return;
    const d = state.draft;
    if (!d.to) {
      toast("宛名を入力してください");
      return;
    }
    const payload = {
      to: d.to,
      body: d.body || "",
      theme: d.theme || "rose",
      photo: d.photo ?? null,
      photoRatio: d.photoRatio,
      cardName: d.cardName ?? null,
      honor: d.honor ?? null,
    };
    savingLetterRef.current = true;
    setSavingLetter(true);
    try {
      const data = d.id
        ? await api<{ letter: Letter }>(`/api/letters/${d.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await api<{ letter: Letter }>(`/api/events/${state.curP}/letters`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
      setState((s) => ({
        ...s,
        draft: { ...s.draft, id: data.letter.id },
        letters: s.letters.some((l) => l.id === data.letter.id)
          ? s.letters.map((l) => (l.id === data.letter.id ? data.letter : l))
          : s.letters.concat([data.letter]),
      }));
      toast("保存しました");
    } catch {
      toast("保存に失敗しました");
    } finally {
      savingLetterRef.current = false;
      setSavingLetter(false);
    }
  }, [state.curP, state.draft, toast]);

  const deleteLetter = useCallback(
    async (id: string) => {
      if (deletingLetterRef.current) return;
      deletingLetterRef.current = true;
      setDeletingLetter(true);
      try {
        await api(`/api/letters/${id}`, { method: "DELETE" });
        setState((s) => ({
          ...s,
          letters: s.letters.filter((l) => l.id !== id),
          ...(s.draft.id === id ? { draft: {}, screen: "project" as const } : {}),
        }));
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

  const upPhoto = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const w = Math.min(900, img.width);
          const h = Math.round((img.height * w) / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          setDraft({
            photo: canvas.toDataURL("image/jpeg", 0.82),
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

  const captureCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import("html2canvas");
    if (document.fonts?.ready) await document.fonts.ready;
    return html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
  }, []);

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
    toast("印刷を準備しています…");
    const canvas = await captureCard();
    if (!canvas) {
      toast("印刷の準備に失敗しました");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) {
      toast("ポップアップがブロックされました");
      return;
    }
    const dims = cardConf
      ? geom(cardConf, "#ccc").printDims
      : "width:91mm;height:55mm";
    w.document.write(
      `<html><head><title>QRカード印刷</title><style>@page{size:auto;margin:10mm}body{margin:0;display:flex;justify-content:center;padding-top:10mm}img{${dims}}</style></head><body><img src="${canvas.toDataURL(
        "image/png"
      )}" onload="setTimeout(function(){window.print()},200)"></body></html>`
    );
    w.document.close();
  }, [cardConf, captureCard, toast]);

  const createProject = useCallback(async () => {
    if (!state.newName) {
      toast("イベント名を入力してください");
      return;
    }
    if (creatingProjectRef.current) return;
    creatingProjectRef.current = true;
    setCreatingProject(true);
    try {
      const data = await api<{ event: EventSummary }>("/api/events", {
        method: "POST",
        body: JSON.stringify({ name: state.newName, date: state.newDate || null }),
      });
      setState((s) => ({
        ...s,
        projects: s.projects.concat([data.event]),
        modalShown: false,
        curP: data.event.id,
        screen: "project",
        letters: [],
      }));
    } catch {
      toast("イベントの作成に失敗しました");
    } finally {
      creatingProjectRef.current = false;
      setCreatingProject(false);
    }
  }, [state.newName, state.newDate, toast]);

  const newLetter = useCallback(() => {
    go("editor", {
      curL: null,
      edTab: "letter",
      draft: {
        to: "",
        theme: "rose",
        body: "",
        photo: null,
      },
    });
  }, [go]);

  const editLetter = useCallback(
    (letter: Letter) => {
      go("editor", { curL: letter.id, draft: { ...letter }, edTab: "letter" });
    },
    [go]
  );

  const logout = useCallback(async () => {
    await signOutEverywhere();
  }, []);

  const updateNickname = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed === state.userName) return;
      const previous = state.userName;
      // 反映待ちのラグをなくすため、確定を待たず先に表示だけ切り替える。
      // 失敗したら previous に戻す。
      setState((s) => ({ ...s, userName: trimmed }));
      try {
        await updateDisplayName(trimmed);
        toast("ニックネームを更新しました");
      } catch {
        setState((s) => ({ ...s, userName: previous }));
        toast("ニックネームの更新に失敗しました");
      }
    },
    [state.userName, toast]
  );

  return {
    state,
    hydrated,
    curProject,
    cardConf,
    cardRef,
    go,
    goHome,
    openProject,
    logout,
    updateNickname,
    setEdTab: (t: EditorTab) => patch({ edTab: t }),
    openSettings: (tab: SettingsTab = "general") => patch({ settingsTab: tab }),
    closeSettings: () => patch({ settingsTab: null }),
    setSettingsTab: (tab: SettingsTab) => patch({ settingsTab: tab }),
    updateProject,
    saveSettings,
    setDraft,
    letterUrl,
    saveLetter,
    savingLetter,
    deleteLetter,
    deletingLetter,
    upPhoto,
    copyLink,
    saveCard,
    printCard,
    createProject,
    creatingProject,
    newLetter,
    editLetter,
    cardNameFor: (l: Draft | Letter | null | undefined) =>
      cardConf ? cardNameFor(l, cardConf) : "お名前",
    geom,
    edTab: state.edTab,
    setQrModal: (l: Letter | null) => patch({ qrModal: l }),
    setModalShown: (v: boolean) =>
      patch({ modalShown: v, ...(v ? { newName: "", newDate: "" } : {}) }),
    setNewName: (v: string) => patch({ newName: v }),
    setNewDate: (v: string) => patch({ newDate: v }),
  };
}

export type LetterStudioApi = ReturnType<typeof useLetterStudio>;
