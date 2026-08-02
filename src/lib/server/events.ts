import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { HttpError } from "./http-error";
import type {
  CardConfigDoc,
  EscortConfigDoc,
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
  nameOverride: "",
};

const DEFAULT_ESCORT_CONFIG: EscortConfigDoc = {
  enabled: false,
  style: "ticket",
  font: "gothic",
  honor: "様",
  heading: "WELCOME TO OUR WEDDING",
  tableLabel: "TABLE",
  nameOverride: "",
  defaultPhoto: null,
  defaultPhotoRatio: null,
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
    // 既存イベントにはこのフィールドが無い。既定は「誰も見せていない」。
    letterSharingUids: data.letterSharingUids ?? [],
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
    escortConfig: {
      ...DEFAULT_ESCORT_CONFIG,
      ...data.escortConfig,
    },
  };
}

export interface EventJson {
  id: string;
  name: string;
  date: string | null;
  /**
   * 自分が作ったお手紙を他のメンバーにも見せる設定にしているか(取得した本人の分)。
   * 他のメンバーがどうしているかは返さない。
   */
  shareMyLetters: boolean;
  letterConfig: LetterConfigDoc;
  cardConfig: CardConfigDoc;
  escortConfig: EscortConfigDoc;
  letterCount: number;
  /** 共同編集メンバーの人数。1 人なら UI は作成者まわりの表示を省く。 */
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

function toIso(ts: Timestamp | undefined): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

/** `uid` は取得した本人。自分の「お手紙を見せる」設定を返すために要る。 */
async function serializeEvent(
  id: string,
  rawData: EventDoc,
  uid: string
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
    shareMyLetters: (data.letterSharingUids ?? []).includes(uid),
    letterConfig: data.letterConfig,
    cardConfig: data.cardConfig,
    escortConfig: data.escortConfig,
    letterCount: countSnap.data().count,
    memberCount: data.memberUids.length,
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
  return Promise.all(snap.docs.map((doc) => serializeEvent(doc.id, doc.data(), uid)));
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
    letterSharingUids: [],
    letterConfig: DEFAULT_LETTER_CONFIG,
    cardConfig: DEFAULT_CARD_CONFIG,
    escortConfig: DEFAULT_ESCORT_CONFIG,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await eventsCollection().add(doc as unknown as EventDoc);
  const snap = await ref.get();
  return serializeEvent(snap.id, snap.data()!, uid);
}

export interface UpdateEventInput {
  name?: string;
  date?: string | null;
  /** 自分が作ったお手紙を他のメンバーにも見せるか。触れるのは常に自分の分だけ。 */
  shareMyLetters?: boolean;
  letterConfig?: Partial<LetterConfigDoc>;
  cardConfig?: Partial<CardConfigDoc>;
  escortConfig?: Partial<EscortConfigDoc>;
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
  // 自分の uid を出し入れするだけなので、他のメンバーの設定は変えられない。
  if (patch.shareMyLetters !== undefined) {
    update.letterSharingUids = patch.shareMyLetters
      ? FieldValue.arrayUnion(uid)
      : FieldValue.arrayRemove(uid);
  }
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
  if (patch.escortConfig !== undefined) {
    update.escortConfig = { ...current.escortConfig, ...patch.escortConfig };
  }

  await ref.update(update);
  const snap = await ref.get();
  return serializeEvent(snap.id, snap.data()!, uid);
}

/** letters.ts からも使うメンバーシップ確認(イベント側)。 */
export { requireMembership as requireEventMembership };
