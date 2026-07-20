import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";
import { HttpError } from "./http-error";

export const SESSION_COOKIE_NAME = "session";
/** Firebase session cookie の最大有効期限(2 週間) */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
}

export async function getSessionUid(): Promise<string | null> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function requireUid(): Promise<string> {
  const uid = await getSessionUid();
  if (!uid) throw new HttpError(401, "ログインが必要です");
  return uid;
}
