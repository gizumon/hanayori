import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { HttpError } from "./http-error";
import type {
  CardConfigDoc,
  EventDoc,
  FontKey,
  LetterConfigDoc,
} from "./schema";

const DEFAULT_LETTER_CONFIG: LetterConfigDoc = {
  font: "yomogi",
};

const DEFAULT_CARD_CONFIG: CardConfigDoc = {
  enabled: true,
  font: "mincho",
  orient: "landscape",
  honor: "様",
  frame: "line",
  heading: "WEDDING RECEPTION",
  note: "スマホで読み取ると\nあなた宛のお手紙が届きます",
};

/** 旧形式ドキュメントに残っているトップレベルのフィールド。 */
interface LegacyEventFields {
  font?: FontKey;
  cardFont?: FontKey;
  cardEnabled?: boolean;
}

/**
 * 旧形式(font / cardFont / cardEnabled がトップレベル、cardConfig に
 * enabled / font がない)のドキュメントを新形式へ畳み込む。
 * 書き込みは updateEvent が正規化済みの全体を書き戻すことで自然に移行する。
 */
export function normalizeEventDoc(data: EventDoc): EventDoc {
  const legacy = data as EventDoc & LegacyEventFields;
  return {
    ...data,
    letterConfig: {
      ...DEFAULT_LETTER_CONFIG,
      ...(legacy.font ? { font: legacy.font } : {}),
      ...data.letterConfig,
    },
    cardConfig: {
      ...DEFAULT_CARD_CONFIG,
      ...(legacy.cardFont ? { font: legacy.cardFont } : {}),
      ...(legacy.cardEnabled !== undefined ? { enabled: legacy.cardEnabled } : {}),
      ...data.cardConfig,
    },
  };
}

export interface EventJson {
  id: string;
  name: string;
  date: string | null;
  letterConfig: LetterConfigDoc;
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
  rawData: EventDoc
): Promise<EventJson> {
  const data = normalizeEventDoc(rawData);
  const countSnap = await lettersCollection()
    .where("eventId", "==", id)
    .count()
    .get();
  return {
    id,
    name: data.name,
    date: data.date,
    letterConfig: data.letterConfig,
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
    letterConfig: DEFAULT_LETTER_CONFIG,
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
  letterConfig?: Partial<LetterConfigDoc>;
  cardConfig?: Partial<CardConfigDoc>;
}

export async function updateEvent(
  uid: string,
  eventId: string,
  patch: UpdateEventInput
): Promise<EventJson> {
  const { ref, data } = await requireMembership(uid, eventId);
  const current = normalizeEventDoc(data);

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.date !== undefined) update.date = patch.date;
  // 部分マージした完全形を書き戻す。旧形式ドキュメントもこの時点で新形式に移行し、
  // 残っていた旧トップレベルフィールドは削除する。
  if (patch.letterConfig !== undefined) {
    update.letterConfig = { ...current.letterConfig, ...patch.letterConfig };
    update.font = FieldValue.delete();
  }
  if (patch.cardConfig !== undefined) {
    update.cardConfig = { ...current.cardConfig, ...patch.cardConfig };
    update.cardFont = FieldValue.delete();
    update.cardEnabled = FieldValue.delete();
  }

  await ref.update(update);
  const snap = await ref.get();
  return serializeEvent(snap.id, snap.data()!);
}

/** letters.ts からも使うメンバーシップ確認(イベント側)。 */
export { requireMembership as requireEventMembership };
