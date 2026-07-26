"use client";

import { createContext, useContext } from "react";
import type { LetterStudioApi } from "./useLetterStudio";

const StudioContext = createContext<LetterStudioApi | null>(null);

export const StudioProvider = StudioContext.Provider;

/** ルートページから共有の LetterStudio api を取り出す。 */
export function useStudio(): LetterStudioApi {
  const api = useContext(StudioContext);
  if (!api) {
    throw new Error("useStudio must be used within <StudioShell>");
  }
  return api;
}
