import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/firebase-admin";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "@/lib/server/session";
import { upsertUserProfile } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const [sessionCookie] = await Promise.all([
    createSessionCookie(idToken),
    upsertUserProfile(decoded.uid, {
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      photoUrl: decoded.picture ?? null,
    }),
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
