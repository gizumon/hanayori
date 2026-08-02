import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ulid } from "ulid";
import { eventsCollection, invitesCollection } from "./collections";
import { requireEventMembership } from "./events";
import { getAdminFirestore } from "./firebase-admin";
import { HttpError } from "./http-error";
import type { InviteDoc } from "./schema";

/** 招待リンクの有効期間。発行から 7 日。 */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 1 イベントが同時に持てる有効な招待リンクの上限。
 * リンクは使い切りなので複数必要になるが、無制限だと管理不能になるため頭を打つ。
 */
export const MAX_ACTIVE_INVITES = 5;

/** 保存はせず acceptedBy / expiresAt から派生させる(時刻依存の状態を固めない)。 */
export type InviteStatus = "active" | "expired" | "accepted";

export interface InviteJson {
  token: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

function toIso(ts: Timestamp | undefined | null): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

function inviteStatus(data: InviteDoc, now: Timestamp): InviteStatus {
  if (data.acceptedBy) return "accepted";
  if (data.expiresAt.toMillis() <= now.toMillis()) return "expired";
  return "active";
}

function serializeInvite(token: string, data: InviteDoc, now: Timestamp): InviteJson {
  return {
    token,
    status: inviteStatus(data, now),
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
  };
}

/**
 * イベントの招待リンク一覧(受諾済みは除く)。
 * 受諾済みの招待はメンバー一覧に本人が現れるので、同じ情報を二重に見せない。
 */
export async function listInvitesForEvent(
  uid: string,
  eventId: string
): Promise<InviteJson[]> {
  await requireEventMembership(uid, eventId);
  const snap = await invitesCollection()
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "desc")
    .get();
  const now = Timestamp.now();
  return snap.docs
    .map((doc) => serializeInvite(doc.id, doc.data(), now))
    .filter((invite) => invite.status !== "accepted");
}

export async function createInvite(uid: string, eventId: string): Promise<InviteJson> {
  await requireEventMembership(uid, eventId);

  const now = Timestamp.now();
  const existing = await invitesCollection().where("eventId", "==", eventId).get();
  const activeCount = existing.docs.filter(
    (doc) => inviteStatus(doc.data(), now) === "active"
  ).length;
  if (activeCount >= MAX_ACTIVE_INVITES) {
    throw new HttpError(
      400,
      `有効な招待リンクは${MAX_ACTIVE_INVITES}件までです。使わないリンクを取り消してください`
    );
  }

  const token = ulid();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + INVITE_TTL_MS);
  const doc: InviteDoc = {
    eventId,
    createdBy: uid,
    createdAt: now,
    expiresAt,
    acceptedBy: null,
    acceptedAt: null,
  };
  await invitesCollection().doc(token).set(doc);
  return serializeInvite(token, doc, now);
}

/** 招待の取消。履歴を持たず物理削除する。受諾済みのものは削除しない。 */
export async function deleteInvite(uid: string, eventId: string, token: string) {
  await requireEventMembership(uid, eventId);
  const ref = invitesCollection().doc(token);
  const snap = await ref.get();
  const data = snap.data();
  if (!snap.exists || !data || data.eventId !== eventId) {
    throw new HttpError(404, "招待リンクが見つかりません");
  }
  if (data.acceptedBy) {
    throw new HttpError(400, "参加済みの招待リンクは取り消せません");
  }
  await ref.delete();
}

export interface InvitePreview {
  status: InviteStatus | "invalid";
  eventId: string | null;
  eventName: string | null;
}

/**
 * `/join/{token}` の表示用。**トークンを消費しない**。
 * イベント名まで返すのは「何に招待されたのか分からないままログインさせない」ため。
 * トークンを持っている人にしか見えない情報なので、これ以上の絞り込みはしない。
 */
export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const snap = await invitesCollection().doc(token).get();
  const data = snap.data();
  if (!snap.exists || !data) {
    return { status: "invalid", eventId: null, eventName: null };
  }
  const eventSnap = await eventsCollection().doc(data.eventId).get();
  const event = eventSnap.data();
  if (!eventSnap.exists || !event) {
    // イベントが消えている招待は無効扱い。
    return { status: "invalid", eventId: null, eventName: null };
  }
  return {
    status: inviteStatus(data, Timestamp.now()),
    eventId: data.eventId,
    eventName: event.name,
  };
}

export interface AcceptResult {
  eventId: string;
  /** すでにメンバーだった場合 true。このときトークンは消費しない。 */
  alreadyMember: boolean;
}

/**
 * 招待の受諾。使い切りなので「未受諾であることの確認」と「消費」は必ず同一
 * トランザクションに入れる — 同じリンクを 2 人が同時に開くレースが実際に起こる。
 */
export async function acceptInvite(uid: string, token: string): Promise<AcceptResult> {
  const db = getAdminFirestore();
  const inviteRef = invitesCollection().doc(token);

  return db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    const invite = inviteSnap.data();
    if (!inviteSnap.exists || !invite) {
      throw new HttpError(404, "この招待リンクは無効です");
    }
    if (invite.acceptedBy) {
      throw new HttpError(409, "この招待リンクは既に使われています");
    }
    if (invite.expiresAt.toMillis() <= Date.now()) {
      throw new HttpError(410, "この招待リンクは有効期限が切れています");
    }

    const eventRef = eventsCollection().doc(invite.eventId);
    const eventSnap = await tx.get(eventRef);
    const event = eventSnap.data();
    if (!eventSnap.exists || !event) {
      throw new HttpError(404, "イベントが見つかりません");
    }

    // すでにメンバーならリンクを消費せずに通す(本人が二度開いた場合など)。
    if (event.memberUids.includes(uid)) {
      return { eventId: invite.eventId, alreadyMember: true };
    }

    tx.update(eventRef, {
      memberUids: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(inviteRef, {
      acceptedBy: uid,
      acceptedAt: FieldValue.serverTimestamp(),
    });
    return { eventId: invite.eventId, alreadyMember: false };
  });
}
