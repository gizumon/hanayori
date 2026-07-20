"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

async function establishSession(user: User) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("セッションの作成に失敗しました");
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  await establishSession(cred.user);
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await establishSession(cred.user);
}

export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await establishSession(cred.user);
}

export async function updateDisplayName(name: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("ログインしていません");
  await updateProfile(user, { displayName: name });
  // Firestore側のプロフィールにも反映させるため、更新後の name クレームを
  // 含む ID トークンを強制的に取り直してセッションを張り直す。
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("ニックネームの更新に失敗しました");
}

export async function signOutEverywhere() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(getFirebaseAuth());
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "メールアドレスまたはパスワードが正しくありません";
    case "auth/email-already-in-use":
      return "このメールアドレスは既に登録されています";
    case "auth/weak-password":
      return "パスワードは6文字以上にしてください";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません";
    case "auth/popup-closed-by-user":
      return "ログインがキャンセルされました";
    case "auth/operation-not-allowed":
      return "この方法でのログインはまだ設定されていません";
    default:
      return "ログインに失敗しました。もう一度お試しください";
  }
}

export { onAuthStateChanged, getFirebaseAuth };
export type { User };
