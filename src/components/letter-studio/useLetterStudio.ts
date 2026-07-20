"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CARD_CONFIG,
  DEMO_BODY,
  LETTERS_MIRROR_KEY,
  STORAGE_KEY,
  uid,
} from "./constants";
import { cardNameFor, geom } from "./geometry";
import type {
  CardConfig,
  Draft,
  EditorTab,
  Letter,
  Project,
  ProjectTab,
  Screen,
  StudioPersisted,
  StudioState,
} from "./types";

const initialState: StudioState = {
  screen: "login",
  projects: [],
  curP: null,
  curL: null,
  draft: {},
  modalShown: false,
  newName: "",
  newDate: "",
  toastMsg: "",
  qrModal: null,
  projTab: "letters",
  edTab: "letter",
};

export function useLetterStudio() {
  const [state, setState] = useState<StudioState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const patch = useCallback((p: Partial<StudioState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const mirrorLetter = useCallback((letter: Letter, cp: Project | null) => {
    let all: Record<string, unknown> = {};
    try {
      all = JSON.parse(localStorage.getItem(LETTERS_MIRROR_KEY) || "{}");
    } catch {
      all = {};
    }
    all[letter.id] = {
      to: letter.to,
      date: cp?.noDate ? "" : cp ? cp.date : letter.date,
      theme: letter.theme,
      body: letter.body,
      photo: letter.photo,
      photoRatio: letter.photoRatio,
      font: cp?.font || "yomogi",
    };
    localStorage.setItem(LETTERS_MIRROR_KEY, JSON.stringify(all));
  }, []);

  // Hydrate from localStorage on mount. Deliberately deferred to an effect
  // (rather than a useState lazy initializer) so the server-rendered and
  // first client-rendered HTML both show the neutral `initialState` and
  // never mismatch; the `hydrated` gate hides that one-frame transition.
  useEffect(() => {
    let saved: StudioPersisted | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      saved = null;
    }
    let demo: Letter | null = null;
    let nextProjects: Project[];
    let nextScreen: Screen;
    if (saved && saved.projects) {
      nextProjects = saved.projects;
      nextScreen = saved.loggedIn ? "home" : "login";
    } else {
      demo = {
        id: "demo",
        to: "さくらへ",
        date: "2026年10月24日(土)",
        theme: "rose",
        body: DEMO_BODY,
        photo: null,
      };
      nextProjects = [
        {
          id: uid(),
          name: "ゆい & 蓮 の結婚式",
          date: "2026年10月24日(土)",
          letters: [demo],
        },
      ];
      nextScreen = initialState.screen;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, a browser-only external system, is exactly what effects are for
    setState((s) => ({ ...s, projects: nextProjects, screen: nextScreen }));
    if (demo) mirrorLetter(demo, null);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist projects/login-state, and keep the guest-facing mirror in sync.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        loggedIn: state.screen !== "login",
        projects: state.projects,
      } satisfies StudioPersisted)
    );
    const cp = state.projects.find((p) => p.id === state.curP) || null;
    if (cp) cp.letters.forEach((l) => mirrorLetter(l, cp));
  }, [hydrated, state.screen, state.projects, state.curP, mirrorLetter]);

  const toast = useCallback((msg: string) => {
    patch({ toastMsg: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => patch({ toastMsg: "" }), 2400);
  }, [patch]);

  const curProject = useMemo(
    () => state.projects.find((p) => p.id === state.curP) || null,
    [state.projects, state.curP]
  );

  const cardConf: CardConfig = useMemo(
    () => ({ ...DEFAULT_CARD_CONFIG, ...(curProject?.cardConfig || {}) }),
    [curProject]
  );

  const go = useCallback(
    (screen: Screen, extra?: Partial<StudioState>) => {
      patch({ screen, ...extra });
    },
    [patch]
  );

  const updateProject = useCallback(
    (projPatch: Partial<Project>) => {
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id === s.curP ? { ...p, ...projPatch } : p
        ),
      }));
    },
    []
  );

  const setCard = useCallback(
    (confPatch: Partial<CardConfig>) => {
      setState((s) => {
        const cp = s.projects.find((p) => p.id === s.curP) || null;
        const conf = {
          ...DEFAULT_CARD_CONFIG,
          ...(cp?.cardConfig || {}),
          ...confPatch,
        };
        return {
          ...s,
          projects: s.projects.map((p) =>
            p.id === s.curP ? { ...p, cardConfig: conf } : p
          ),
        };
      });
    },
    []
  );

  const setDraft = useCallback((d: Draft) => {
    setState((s) => ({ ...s, draft: { ...s.draft, ...d } }));
  }, []);

  const letterUrl = useCallback((id: string | null | undefined) => {
    if (!id) return "#";
    if (typeof window === "undefined") return `/letter/${id}`;
    return new URL(`/letter/${id}`, window.location.origin).href;
  }, []);

  const saveLetter = useCallback(() => {
    setState((s) => {
      const cp = s.projects.find((p) => p.id === s.curP) || null;
      const d: Letter = {
        id: s.draft.id || uid(),
        to: s.draft.to || "",
        date: cp ? (cp.noDate ? "" : cp.date) : "",
        theme: s.draft.theme || "rose",
        body: s.draft.body || "",
        photo: s.draft.photo ?? null,
        photoRatio: s.draft.photoRatio,
        cardName: s.draft.cardName,
        honor: s.draft.honor,
      };
      if (!d.to) {
        toast("宛名を入力してください");
        return s;
      }
      const projects = s.projects.map((p) => {
        if (p.id !== s.curP) return p;
        const exists = p.letters.some((l) => l.id === d.id);
        const letters = exists
          ? p.letters.map((l) => (l.id === d.id ? d : l))
          : p.letters.concat([d]);
        return { ...p, letters };
      });
      mirrorLetter(d, cp);
      toast("保存しました");
      return { ...s, projects };
    });
  }, [mirrorLetter, toast]);

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

  const copyLink = useCallback(async (id: string) => {
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
  }, [letterUrl, toast]);

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
    const dims = geom(cardConf, "#ccc").printDims;
    w.document.write(
      `<html><head><title>QRカード印刷</title><style>@page{size:auto;margin:10mm}body{margin:0;display:flex;justify-content:center;padding-top:10mm}img{${dims}}</style></head><body><img src="${canvas.toDataURL(
        "image/png"
      )}" onload="setTimeout(function(){window.print()},200)"></body></html>`
    );
    w.document.close();
  }, [cardConf, captureCard, toast]);

  const createProject = useCallback(() => {
    setState((s) => {
      if (!s.newName) {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => patch({ toastMsg: "" }), 2400);
        return { ...s, toastMsg: "イベント名を入力してください" };
      }
      const p: Project = {
        id: uid(),
        name: s.newName,
        date: s.newDate || "",
        letters: [],
      };
      return {
        ...s,
        projects: s.projects.concat([p]),
        modalShown: false,
        curP: p.id,
        screen: "project",
      };
    });
  }, [patch]);

  const newLetter = useCallback(() => {
    go("editor", {
      curL: null,
      edTab: "letter",
      draft: {
        id: uid(),
        to: "",
        date: curProject ? (curProject.noDate ? "" : curProject.date) : "",
        theme: "rose",
        body: "",
        photo: null,
      },
    });
  }, [curProject, go]);

  const editLetter = useCallback(
    (letter: Letter) => {
      go("editor", { curL: letter.id, draft: { ...letter }, edTab: "letter" });
    },
    [go]
  );

  const goCardSettings = useCallback(() => {
    const first: Pick<Letter, "to" | "theme"> & { id: string | null } =
      curProject?.letters[0] || { id: null, to: "ゲスト", theme: "rose" };
    go("card", {
      curL: first.id,
      draft: { ...first, id: first.id ?? undefined },
    });
  }, [curProject, go]);

  const projTab: ProjectTab = state.projTab;
  const edTab: EditorTab = state.edTab;

  return {
    state,
    hydrated,
    patch,
    curProject,
    cardConf,
    cardRef,
    go,
    setProjTab: (t: ProjectTab) => patch({ projTab: t }),
    setEdTab: (t: EditorTab) => patch({ edTab: t }),
    updateProject,
    setCard,
    setDraft,
    letterUrl,
    saveLetter,
    upPhoto,
    copyLink,
    saveCard,
    printCard,
    createProject,
    newLetter,
    editLetter,
    goCardSettings,
    cardNameFor: (l: Draft | Letter | null | undefined) =>
      cardNameFor(l, cardConf),
    geom,
    projTab,
    edTab,
    setQrModal: (l: Letter | null) => patch({ qrModal: l }),
    setModalShown: (v: boolean) =>
      patch({ modalShown: v, ...(v ? { newName: "", newDate: "" } : {}) }),
    setNewName: (v: string) => patch({ newName: v }),
    setNewDate: (v: string) => patch({ newDate: v }),
  };
}

export type LetterStudioApi = ReturnType<typeof useLetterStudio>;
