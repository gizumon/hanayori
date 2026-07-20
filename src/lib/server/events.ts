import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { HttpError } from "./http-error";
import type { CardConfigDoc, EventDoc, FontKey } from "./schema";

const DEFAULT_CARD_CONFIG: CardConfigDoc = {
  orient: "landscape",
  honor: "様",
  frame: "line",
  heading: "WEDDING RECEPTION",
  note: "スマホで読み取ると\nあなた宛のお手紙が届きます",
};

export interface EventJson {
  id: string;
  name: string;
  date: string | null;
  font: FontKey;
  cardFont: FontKey;
  cardEnabled: boolean;
  cardConfig: CardConfigDoc;
  letterCount: number;
  createdAt: string;
  updatedAt: string;
}

function toIso(ts: Timestamp | undefined): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

async function serializeEvent(
  id: string,
  data: EventDoc
): Promise<EventJson> {
  const countSnap = await lettersCollection()
    .where("eventId", "==", id)
    .count()
    .get();
  return {
    id,
    name: data.name,
    date: data.date,
    font: data.font,
    cardFont: data.cardFont,
    cardEnabled: data.cardEnabled,
    cardConfig: data.cardConfig,
    letterCount: countSnap.data().count,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

async function requireMembership(uid: string, eventId: string) {
  const snap = await eventsCollection().doc(eventId).get();
  const data = snap.data();
  if (!snap.exists || !data) throw new HttpError(404, "イベントが見つかりません");
  if (!data.memberUids.includes(uid)) {
    throw new HttpError(403, "このイベントを操作する権限がありません");
  }
  return { ref: snap.ref, data };
}

export async function listEventsForUser(uid: string): Promise<EventJson[]> {
  const snap = await eventsCollection()
    .where("memberUids", "array-contains", uid)
    .orderBy("createdAt", "asc")
    .get();
  return Promise.all(snap.docs.map((doc) => serializeEvent(doc.id, doc.data())));
}

export async function createEvent(
  uid: string,
  input: { name: string; date: string | null }
): Promise<EventJson> {
  if (!input.name.trim()) throw new HttpError(400, "イベント名を入力してください");

  const now = FieldValue.serverTimestamp();
  const doc: Omit<EventDoc, "createdAt" | "updatedAt"> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    name: input.name,
    date: input.date,
    createdBy: uid,
    memberUids: [uid],
    inviteToken: null,
    font: "yomogi",
    cardFont: "mincho",
    cardEnabled: true,
    cardConfig: DEFAULT_CARD_CONFIG,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await eventsCollection().add(doc as unknown as EventDoc);
  const snap = await ref.get();
  return serializeEvent(snap.id, snap.data()!);
}

export interface UpdateEventInput {
  name?: string;
  date?: string | null;
  font?: FontKey;
  cardFont?: FontKey;
  cardEnabled?: boolean;
  cardConfig?: Partial<CardConfigDoc>;
}

export async function updateEvent(
  uid: string,
  eventId: string,
  patch: UpdateEventInput
): Promise<EventJson> {
  const { ref, data } = await requireMembership(uid, eventId);

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.font !== undefined) update.font = patch.font;
  if (patch.cardFont !== undefined) update.cardFont = patch.cardFont;
  if (patch.cardEnabled !== undefined) update.cardEnabled = patch.cardEnabled;
  if (patch.cardConfig !== undefined) {
    update.cardConfig = { ...data.cardConfig, ...patch.cardConfig };
  }

  await ref.update(update);
  const snap = await ref.get();
  return serializeEvent(snap.id, snap.data()!);
}

/** letters.ts からも使うメンバーシップ確認(イベント側)。 */
export { requireMembership as requireEventMembership };
