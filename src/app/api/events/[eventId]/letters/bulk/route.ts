import { NextRequest, NextResponse } from "next/server";
import {
  bulkUpdateLetters,
  createLettersBulk,
  type BulkLetterPatch,
} from "@/lib/server/letters";
import { handleRouteError } from "@/lib/server/route-helpers";
import type { Honor, ThemeKey } from "@/lib/server/schema";
import { requireUid } from "@/lib/server/session";

/** JSON に載って届いたパッチを既知フィールドだけに絞る。 */
function sanitize(raw: unknown): BulkLetterPatch | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== "string") return null;
  const p: BulkLetterPatch = { id: u.id };
  // JSON は undefined を落とすので、キーの有無 = 更新意図の有無として扱う。
  if ("to" in u) p.to = String(u.to ?? "");
  if ("body" in u) p.body = String(u.body ?? "");
  if ("theme" in u) p.theme = u.theme as ThemeKey;
  if ("photo" in u) p.photo = (u.photo as string | null) ?? null;
  if ("photoRatio" in u) p.photoRatio = u.photoRatio as number | undefined;
  if ("cardName" in u) p.cardName = (u.cardName as string | null) ?? null;
  if ("honor" in u) p.honor = (u.honor as Honor | null) ?? null;
  if ("tableNo" in u) p.tableNo = (u.tableNo as string | null) ?? null;
  if ("escortName" in u) p.escortName = (u.escortName as string | null) ?? null;
  if ("escortMessage" in u) p.escortMessage = (u.escortMessage as string | null) ?? null;
  if ("escortHonor" in u) p.escortHonor = (u.escortHonor as Honor | null) ?? null;
  if ("escortPhoto" in u) p.escortPhoto = (u.escortPhoto as string | null) ?? null;
  if ("escortPhotoRatio" in u) p.escortPhotoRatio = u.escortPhotoRatio as number | undefined;
  return p;
}

/**
 * 宛名だけの手紙をまとめて作る。`{ names: ["山田花子へ", ...] }` を受け取り、
 * 1 つの WriteBatch で作成する。ログイン・メンバーシップ必須。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const body = await request.json();
    const names = Array.isArray(body?.names) ? body.names.map((n: unknown) => String(n ?? "")) : [];
    const letters = await createLettersBulk(uid, eventId, names);
    return NextResponse.json({ letters }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * 手紙一覧の一括編集。`{ updates: [{ id, ...変更フィールド }] }` を受け取り、
 * 変更のあった手紙だけをまとめて更新する。ログイン・メンバーシップ必須。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const body = await request.json();
    const updates = Array.isArray(body?.updates)
      ? body.updates.map(sanitize).filter((p: BulkLetterPatch | null): p is BulkLetterPatch => p !== null)
      : [];
    const letters = await bulkUpdateLetters(uid, eventId, updates);
    return NextResponse.json({ letters });
  } catch (err) {
    return handleRouteError(err);
  }
}
