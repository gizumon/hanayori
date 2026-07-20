export type ThemeKey = "rose" | "blue" | "sage" | "kinari";
export type FontKey = "yomogi" | "klee" | "mincho" | "gothic" | "maru";
export type Screen = "login" | "home" | "project" | "editor" | "card";
export type CardOrient = "landscape" | "portrait" | "tent-l" | "tent-p";
export type CardFrame = "line" | "frame" | "minimal";
export type Honor = "" | "様" | "さん" | "なし";
export type ProjectTab = "letters" | "settings";
export type EditorTab = "letter" | "card";

export interface Letter {
  id: string;
  to: string;
  date: string;
  theme: ThemeKey;
  body: string;
  photo: string | null;
  photoRatio?: number;
  cardName?: string;
  honor?: Honor;
}

export interface CardConfig {
  orient: CardOrient;
  honor: Honor;
  frame: CardFrame;
  heading: string;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  date: string;
  letters: Letter[];
  cardConfig?: CardConfig;
  font?: FontKey;
  cardFont?: FontKey;
  cardEnabled?: boolean;
  noDate?: boolean;
}

export type Draft = Partial<Letter>;

export interface StudioState {
  screen: Screen;
  projects: Project[];
  curP: string | null;
  curL: string | null;
  draft: Draft;
  modalShown: boolean;
  newName: string;
  newDate: string;
  toastMsg: string;
  qrModal: Letter | null;
  projTab: ProjectTab;
  edTab: EditorTab;
}

export interface StudioPersisted {
  loggedIn: boolean;
  projects: Project[];
}
