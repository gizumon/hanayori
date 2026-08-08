import { NextRequest, NextResponse } from "next/server";
import {
  bulkUpdateLetters,
  createLettersBulk,
  type BulkCreateInput,
  type BulkLetterPatch,
} from "@/lib/server/letters";
import { sanitizePhotos } from "@/lib/server/photos";
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
  if ("photos" in u) p.photos = sanitizePhotos(u.photos);
  if ("hidePhotos" in u) p.hidePhotos = Boolean(u.hidePhotos);
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

/** 敬称は 3 通りしか無いので、それ以外が来たら「既定に従う」(null)に倒す。 */
function honorOrNull(raw: unknown): Honor | null {
  return raw === "" || raw === "様" || raw === "さん" ? raw : null;
}

/** 一括追加の 1 行を既知フィールドだけに絞る。宛名の無い行は捨てる。 */
function sanitizeCreate(raw: unknown): BulkCreateInput | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const to = String(u.to ?? "").trim();
  if (!to) return null;
  const row: BulkCreateInput = { to };
  // PATCH と同じく、キーの有無 = その項目を送ったかどうか。
  if ("cardName" in u) row.cardName = (u.cardName as string | null) ?? null;
  if ("honor" in u) row.honor = honorOrNull(u.honor);
  if ("tableNo" in u) row.tableNo = (u.tableNo as string | null) ?? null;
  if ("escortName" in u) row.escortName = (u.escortName as string | null) ?? null;
  if ("escortMessage" in u) row.escortMessage = (u.escortMessage as string | null) ?? null;
  if ("escortHonor" in u) row.escortHonor = honorOrNull(u.escortHonor);
  return row;
}

/**
 * 手紙をまとめて作る。`{ rows: [{ to: "山田花子へ", tableNo: "A", ... }] }` を
 * 受け取り、1 つの WriteBatch で作成する。ログイン・メンバーシップ必須。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const body = await request.json();
    const rows = Array.isArray(body?.rows)
      ? body.rows.map(sanitizeCreate).filter((r: BulkCreateInput | null): r is BulkCreateInput => r !== null)
      : [];
    const letters = await createLettersBulk(uid, eventId, rows);
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
