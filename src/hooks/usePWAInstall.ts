"use client";

import { useEffect, useRef, useState } from "react";

export type PWAInstallPlatform = "chromium" | "ios" | "none";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export function saveDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

function detectPlatform(): PWAInstallPlatform {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari ? "ios" : "none";
}

function checkIsInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== "undefined" ? checkIsInstalled() : false
  );
  const [platform, setPlatform] = useState<PWAInstallPlatform>(() =>
    typeof window !== "undefined" ? detectPlatform() : "none"
  );
  const [canPrompt, setCanPrompt] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
      setPlatform("chromium");
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setCanPrompt(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    deferredPrompt.current = null;
    setCanPrompt(false);
  };

  return { isInstalled, platform, canPrompt, promptInstall };
}
