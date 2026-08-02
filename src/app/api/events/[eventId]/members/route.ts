import { NextResponse } from "next/server";
import { listInvitesForEvent } from "@/lib/server/invites";
import { listMembersForEvent } from "@/lib/server/members";
import { handleRouteError } from "@/lib/server/route-helpers";
import { requireUid } from "@/lib/server/session";

/** メンバー一覧と招待リンク一覧。共通設定の「メンバー」タブを開いたときに 1 回だけ叩く。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const uid = await requireUid();
    const { eventId } = await params;
    const [members, invites] = await Promise.all([
      listMembersForEvent(uid, eventId),
      listInvitesForEvent(uid, eventId),
    ]);
    return NextResponse.json({ members, invites, currentUid: uid });
  } catch (err) {
    return handleRouteError(err);
  }
}
