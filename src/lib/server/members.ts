import { FieldValue } from "firebase-admin/firestore";
import { eventsCollection } from "./collections";
import { requireEventMembership, toMemberJson } from "./events";
import { HttpError } from "./http-error";
import type { EventDoc } from "./schema";
import { getUserProfiles } from "./users";

export interface MemberJson {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  /** 最初にイベントを作った人。権限は他メンバーと同じで、表示と誤操作防止のためだけに使う。 */
  isCreator: boolean;
}

/**
 * 読み込み済みのイベント doc からメンバー一覧を作る。
 * 並び順は memberUids の順(= 作成者が先頭、以降は参加順)をそのまま使う。
 *
 * **メンバーかどうかの確認は呼び出し側の責任**。同じリクエストで招待一覧も返す
 * ルートがあり、そこでイベント doc を 2 回読まないよう検証と分離してある。
 */
export async function membersOfEvent(data: EventDoc): Promise<MemberJson[]> {
  const profiles = await getUserProfiles(data.memberUids);
  return toMemberJson(data.memberUids, data.createdBy, profiles);
}

export interface RemoveMemberResult {
  /** 自分自身を外した(= 退出した)場合 true。呼び出し側はイベント一覧へ戻す。 */
  selfRemoved: boolean;
}

/**
 * メンバーを外す / 自分が退出する。
 *
 * メンバーは全員共同オーナーなので誰でも実行できるが、2 つだけ制限がある:
 * - 最後の 1 人は外せない(イベントが誰からも触れなくなる)
 * - 作成者は他人から外せない(招待した相手に締め出される事故を防ぐ)。本人の退出は可
 */
export async function removeMember(
  uid: string,
  eventId: string,
  targetUid: string
): Promise<RemoveMemberResult> {
  const { ref, data } = await requireEventMembership(uid, eventId);

  if (!data.memberUids.includes(targetUid)) {
    throw new HttpError(404, "そのメンバーは見つかりません");
  }
  if (data.memberUids.length <= 1) {
    throw new HttpError(400, "最後のメンバーは外せません");
  }
  if (targetUid === data.createdBy && targetUid !== uid) {
    throw new HttpError(403, "イベントの作成者を外すことはできません");
  }

  await ref.update({
    memberUids: FieldValue.arrayRemove(targetUid),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { selfRemoved: targetUid === uid };
}

/** イベントが存在し、指定 uid がメンバーかどうか(招待受諾ページの分岐用)。 */
export async function isEventMember(uid: string, eventId: string): Promise<boolean> {
  const snap = await eventsCollection().doc(eventId).get();
  const data = snap.data();
  return Boolean(data?.memberUids.includes(uid));
}
