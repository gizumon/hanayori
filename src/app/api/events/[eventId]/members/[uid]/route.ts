import { NextResponse } from "next/server";
import { removeMember } from "@/lib/server/members";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/** メンバーを外す。自分自身を指定した場合は「イベントから退出」になる。 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; uid: string }> }
) {
  try {
    const actorUid = await requireUid();
    const { eventId, uid: targetUid } = await params;
    const result = await removeMember(actorUid, eventId, targetUid);
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
