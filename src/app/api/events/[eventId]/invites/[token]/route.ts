import { NextResponse } from "next/server";
import { deleteInvite } from "@/lib/server/invites";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/** 招待リンクの取消。物理削除なので、そのリンクは即座に無効になる。 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; token: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId, token } = await params;
    await deleteInvite(uid, eventId, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
