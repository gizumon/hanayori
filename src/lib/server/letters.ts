import { cache } from "react";
import { ulid } from "ulid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { eventsCollection, lettersCollection } from "./collections";
import { normalizeEventDoc, requireEventMembership } from "./events";
import { HttpError } from "./http-error";
import {
  photosFromInput,
  photosToJson,
  resolvePhotos,
  type LetterPhotoInput,
  type LetterPhotoJson,
} from "./photos";
import { getUserProfiles } from "./users";
import type {
  EscortFieldsDoc,
  FontKey,
  Honor,
  LetterDoc,
  LetterPhoto,
  ThemeKey,
} from "./schema";

export interface LetterJson {
  id: string;
  /** 作成者の uid。旧データには無いので null。 */
  createdBy: string | null;
  /** 作成者の表示名。`withCreatorNames` が users から解決して埋める。 */
  createdByName: string | null;
  /** 作成者のアバター URL(Google ログイン等)。無ければ null。 */
  createdByPhoto: string | null;
  /** 他の人が作ったお手紙で、中身(本文・写真)を伏せて返した場合 true。 */
  hidden: boolean;
  to: string;
  body: string;
  theme: ThemeKey;
  /**
   * このお手紙の写真。並びは配列の順。データとしては何枚でも持てるが、画面から
   * 追加できるのは今のところ 1 枚だけ(`MAX_LETTER_PHOTOS`)。
   * 空ならイベント既定(`letterConfig.defaultPhotos`)が使われる。
   */
  photos: LetterPhotoJson[];
  /** true = このお手紙では写真を出さない(イベント既定も使わない)。 */
  hidePhotos: boolean;
  cardName: string | null;
  honor: Honor | null;
  tableNo: string | null;
  escortName: string | null;
  escortMessage: string | null;
  escortHonor: Honor | null;
  escortPhoto: string | null;
  escortPhotoRatio?: number;
  /** true = このお手紙のエスコートカードには写真を出さない(イベント既定も使わない)。 */
  hideEscortPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 一度の一括追加で作れる手紙の上限(WriteBatch の 500 件制限に対する安全側の値)。 */
const MAX_BULK_CREATE = 200;

function toIso(ts: Timestamp | undefined): string {
  return (ts ?? Timestamp.now()).toDate().toISOString();
}

function photoFromInput(
  photo: string | null | undefined,
  photoRatio: number | undefined,
  id: string
): LetterPhoto | null {
  if (!photo) return null;
  return { id, dataUrl: photo, ratio: photoRatio ?? null };
}

function escortFromInput(input: EscortInput): EscortFieldsDoc {
  const photo = photoFromInput(input.escortPhoto, input.escortPhotoRatio, "escort");
  return {
    tableNo: input.tableNo ?? null,
    name: input.escortName ?? null,
    message: input.escortMessage ?? null,
    honor: input.escortHonor ?? null,
    photo,
    // 写真を入れたら「出さない」は解除する(相反する状態を残さない)。
    hidePhoto: photo ? false : input.hideEscortPhoto ?? false,
  };
}

function serializeLetter(id: string, data: LetterDoc): LetterJson {
  const escort = data.escort;
  return {
    id,
    createdBy: data.createdBy ?? null,
    createdByName: null,
    createdByPhoto: null,
    hidden: false,
    to: data.to,
    body: data.body,
    theme: data.theme,
    photos: photosToJson(data.photos),
    hidePhotos: data.hidePhotos ?? false,
    cardName: data.cardName,
    honor: data.honor,
    tableNo: escort?.tableNo ?? null,
    escortName: escort?.name ?? null,
    escortMessage: escort?.message ?? null,
    escortHonor: escort?.honor ?? null,
    escortPhoto: escort?.photo?.dataUrl ?? null,
    escortPhotoRatio: escort?.photo?.ratio ?? undefined,
    hideEscortPhoto: escort?.hidePhoto ?? false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

/** create/update 双方で使うエスコート系の入力。 */
interface EscortInput {
  tableNo?: string | null;
  escortName?: string | null;
  escortMessage?: string | null;
  escortHonor?: Honor | null;
  escortPhoto?: string | null;
  escortPhotoRatio?: number;
  hideEscortPhoto?: boolean;
}

/**
 * `createdBy` の uid を表示名に解決して埋める。
 *
 * 手紙側に名前を複製せず、返すときに users から引く(挙式日・フォントを手紙に
 * 持たせないのと同じ方針)。distinct な uid をまとめて 1 回の `getAll` で引くので、
 * 何通あっても往復は 1 回。プロフィールが無い uid は null のままにして、
 * 表示側で「作成者不明」にフォールバックさせる。
 */
async function withCreatorNames(letters: LetterJson[]): Promise<LetterJson[]> {
  const uids = [...new Set(letters.map((l) => l.createdBy).filter((v): v is string => !!v))];
  if (uids.length === 0) return letters;
  const profiles = await getUserProfiles(uids);
  return letters.map((letter) => {
    if (!letter.createdBy) return letter;
    const profile = profiles.get(letter.createdBy);
    return {
      ...letter,
      createdByName: profile?.displayName?.trim() || profile?.email?.split("@")[0] || null,
      createdByPhoto: profile?.photoUrl ?? null,
    };
  });
}

/**
 * 他のメンバーが作ったお手紙の中身を伏せる。
 *
 * お手紙の中身(本文・写真)を返すのは、作った本人と、作った人が「見せる」を
 * 選んでいる(= `letterSharingUids` に入っている)場合だけ。席札・エスコート
 * カードは全員ぶんを扱えるままにしたいので、宛名・席札名・卓番といったカード系の
 * フィールドは残す。`createdBy` を持たない旧データは持ち主が決まらないので伏せない。
 *
 * 一覧にはお手紙自体は並び、本文の位置だけがぼかしになる(`hidden` を見て
 * クライアントが描き分ける)。本文と写真はここで落として返さないので、
 * ぼかしの下に本物の中身は無い。
 */
function maskHiddenLetters(
  letters: LetterJson[],
  uid: string,
  sharingUids: string[]
): LetterJson[] {
  return letters.map((letter) =>
    !letter.createdBy || letter.createdBy === uid || sharingUids.includes(letter.createdBy)
      // 伏せるときはイベント既定の写真も出さない(中身に触れさせない)。
      ? letter
      : { ...letter, hidden: true, body: "", photos: [], hidePhotos: true }
  );
}

async function requireLetterMembership(uid: string, letterId: string) {
  const snap = await lettersCollection().doc(letterId).get();
  const data = snap.data();
  if (!snap.exists || !data) throw new HttpError(404, "お手紙が見つかりません");
  const { data: event } = await requireEventMembership(uid, data.eventId);
  return { ref: snap.ref, data, event };
}

export async function listLettersForEvent(
  uid: string,
  eventId: string
): Promise<LetterJson[]> {
  const { data: event } = await requireEventMembership(uid, eventId);
  const snap = await lettersCollection()
    .where("eventId", "==", eventId)
    .orderBy("createdAt", "asc")
    .get();
  const letters = await withCreatorNames(
    snap.docs.map((doc) => serializeLetter(doc.id, doc.data()))
  );
  return maskHiddenLetters(letters, uid, event.letterSharingUids ?? []);
}

export interface CreateLetterInput extends EscortInput {
  to: string;
  body: string;
  theme: ThemeKey;
  photos?: LetterPhotoInput[] | null;
  hidePhotos?: boolean;
  cardName?: string | null;
  honor?: Honor | null;
}

export async function createLetter(
  uid: string,
  eventId: string,
  input: CreateLetterInput
): Promise<LetterJson> {
  if (!input.to.trim()) throw new HttpError(400, "宛名を入力してください");
  await requireEventMembership(uid, eventId);

  const id = ulid();
  const now = FieldValue.serverTimestamp();
  const doc: Omit<LetterDoc, "createdAt" | "updatedAt"> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    eventId,
    createdBy: uid,
    to: input.to,
    body: input.body,
    theme: input.theme,
    photos: photosFromInput(input.photos),
    hidePhotos: input.hidePhotos ?? false,
    cardName: input.cardName ?? null,
    honor: input.honor ?? null,
    escort: escortFromInput(input),
    createdAt: now,
    updatedAt: now,
  };
  await lettersCollection().doc(id).set(doc as unknown as LetterDoc);
  const snap = await lettersCollection().doc(id).get();
  const [letter] = await withCreatorNames([serializeLetter(snap.id, snap.data()!)]);
  return letter;
}

/** 一括追加の 1 通ぶん。宛名は必須、残りは CSV で送られてきた列だけ入る。 */
export interface BulkCreateInput extends EscortInput {
  to: string;
  cardName?: string | null;
  honor?: Honor | null;
}

/**
 * 手紙をまとめて作る。宛名は必須で、席札・エスコートの項目は送られてきた列だけを
 * 埋める。本文・写真は空のまま作り、あとから一括編集や個別編集で埋めていく前提。
 * ULID は昇順なので、createdAt が同一秒でも一覧の並び(createdAt → __name__)は
 * 入力順を保つ。
 */
export async function createLettersBulk(
  uid: string,
  eventId: string,
  rows: BulkCreateInput[]
): Promise<LetterJson[]> {
  await requireEventMembership(uid, eventId);
  const cleaned = rows
    .map((row) => ({ ...row, to: row.to.trim() }))
    .filter((row) => row.to);
  if (cleaned.length === 0) throw new HttpError(400, "宛名を入力してください");
  if (cleaned.length > MAX_BULK_CREATE) {
    throw new HttpError(400, `一度に追加できるのは${MAX_BULK_CREATE}名までです`);
  }

  const col = lettersCollection();
  const batch = col.firestore.batch();
  const now = FieldValue.serverTimestamp();
  const refs = cleaned.map((row) => {
    const ref = col.doc(ulid());
    batch.set(ref, {
      eventId,
      createdBy: uid,
      to: row.to,
      body: "",
      theme: "rose",
      photos: [],
      hidePhotos: false,
      cardName: row.cardName ?? null,
      honor: row.honor ?? null,
      escort: escortFromInput(row),
      createdAt: now,
      updatedAt: now,
    } as unknown as LetterDoc);
    return ref;
  });
  await batch.commit();

  const snaps = await Promise.all(refs.map((r) => r.get()));
  return withCreatorNames(snaps.map((s) => serializeLetter(s.id, s.data()!)));
}

export interface UpdateLetterInput extends EscortInput {
  to?: string;
  body?: string;
  theme?: ThemeKey;
  photos?: LetterPhotoInput[] | null;
  hidePhotos?: boolean;
  cardName?: string | null;
  honor?: Honor | null;
}

/** patch にエスコート系フィールドが 1 つでも含まれるか。 */
function hasEscortPatch(patch: UpdateLetterInput): boolean {
  return (
    patch.tableNo !== undefined ||
    patch.escortName !== undefined ||
    patch.escortMessage !== undefined ||
    patch.escortHonor !== undefined ||
    patch.escortPhoto !== undefined ||
    patch.escortPhotoRatio !== undefined ||
    patch.hideEscortPhoto !== undefined
  );
}

/**
 * パッチ 1 件から Firestore の update ペイロードを構築する。undefined の
 * フィールドは触らない(部分更新)。エスコート系は既存 doc を土台にマージする。
 * 単体更新・一括更新の共通ロジック。
 */
function buildLetterUpdate(patch: UpdateLetterInput, data: LetterDoc): Record<string, unknown> {
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (patch.to !== undefined) update.to = patch.to;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.theme !== undefined) update.theme = patch.theme;
  if (patch.cardName !== undefined) update.cardName = patch.cardName;
  if (patch.honor !== undefined) update.honor = patch.honor;
  if (patch.hidePhotos !== undefined) update.hidePhotos = patch.hidePhotos;
  if (patch.photos !== undefined) {
    const photos = photosFromInput(patch.photos);
    update.photos = photos;
    // 写真を入れたら「出さない」は解除する(相反する状態を残さない)。
    if (photos.length > 0) update.hidePhotos = false;
  }
  // エスコート系は既存値をベースにパッチをマージして書き戻す。
  if (hasEscortPatch(patch)) {
    const cur = data.escort;
    const curPhoto = { photo: cur?.photo?.dataUrl ?? null, ratio: cur?.photo?.ratio ?? undefined };
    update.escort = escortFromInput({
      tableNo: patch.tableNo !== undefined ? patch.tableNo : cur?.tableNo ?? null,
      escortName: patch.escortName !== undefined ? patch.escortName : cur?.name ?? null,
      escortMessage:
        patch.escortMessage !== undefined ? patch.escortMessage : cur?.message ?? null,
      escortHonor: patch.escortHonor !== undefined ? patch.escortHonor : cur?.honor ?? null,
      escortPhoto: patch.escortPhoto !== undefined ? patch.escortPhoto : curPhoto.photo,
      escortPhotoRatio:
        patch.escortPhoto !== undefined ? patch.escortPhotoRatio : curPhoto.ratio,
      hideEscortPhoto:
        patch.hideEscortPhoto !== undefined ? patch.hideEscortPhoto : cur?.hidePhoto ?? false,
    });
  }
  return update;
}

export async function updateLetter(
  uid: string,
  letterId: string,
  patch: UpdateLetterInput
): Promise<LetterJson> {
  const { ref, data, event } = await requireLetterMembership(uid, letterId);
  await ref.update(buildLetterUpdate(patch, data));
  const snap = await ref.get();
  const letters = await withCreatorNames([serializeLetter(snap.id, snap.data()!)]);
  // 他の人のお手紙の席札・卓番だけを直したときも、返す中身は伏せたままにする。
  const [letter] = maskHiddenLetters(letters, uid, event.letterSharingUids ?? []);
  return letter;
}

/** 一括更新のパッチ 1 件。id で対象を指定し、残りは部分更新。 */
export interface BulkLetterPatch extends UpdateLetterInput {
  id: string;
}

/**
 * 手紙一覧の一括編集。変更のあった手紙だけをまとめて 1 つの WriteBatch で
 * 更新する。イベントのメンバーシップは一度だけ確認し、各手紙が本当にその
 * イベントに属するかを検証してから書き込む。
 */
export async function bulkUpdateLetters(
  uid: string,
  eventId: string,
  patches: BulkLetterPatch[]
): Promise<LetterJson[]> {
  const { data: event } = await requireEventMembership(uid, eventId);
  if (patches.length === 0) return [];

  const col = lettersCollection();
  // 型付き ref.get() を使う(firestore.getAll は DocumentData に退化する)。
  const refs = patches.map((p) => col.doc(p.id));
  const snaps = await Promise.all(refs.map((r) => r.get()));

  const batch = col.firestore.batch();
  snaps.forEach((snap, i) => {
    const data = snap.data();
    if (!snap.exists || !data) throw new HttpError(404, "お手紙が見つかりません");
    if (data.eventId !== eventId) throw new HttpError(403, "権限がありません");
    batch.update(snap.ref, buildLetterUpdate(patches[i], data));
  });
  await batch.commit();

  const updated = await Promise.all(refs.map((r) => r.get()));
  const letters = await withCreatorNames(updated.map((s) => serializeLetter(s.id, s.data()!)));
  return maskHiddenLetters(letters, uid, event.letterSharingUids ?? []);
}

export async function deleteLetter(uid: string, letterId: string): Promise<void> {
  const { ref } = await requireLetterMembership(uid, letterId);
  await ref.delete();
}

export interface GuestLetterView {
  to: string;
  body: string;
  theme: ThemeKey;
  /** 本文のあとに載せる写真。お手紙の写真とイベント既定を解決したあとの結果。 */
  photos: LetterPhotoJson[];
  /** イベント側の値を都度解決する(手紙には複製しない)。 */
  date: string | null;
  font: FontKey;
  /** 席札用の宛名(OGP 等で使用)。未設定なら null。 */
  cardName: string | null;
  /** この手紙の敬称。null = イベント既定に従う。 */
  honor: Honor | null;
  /** イベント既定の敬称。 */
  eventHonor: Honor;
}

/**
 * ULID を知っていれば誰でも読める、ログイン不要のゲスト向け取得。
 * メンバーシップは確認しない。
 */
export const getLetterForGuest = cache(
  async (letterId: string): Promise<GuestLetterView | null> => {
    const letterSnap = await lettersCollection().doc(letterId).get();
    const letterData = letterSnap.data();
    if (!letterSnap.exists || !letterData) return null;

    const eventSnap = await eventsCollection().doc(letterData.eventId).get();
    const eventData = eventSnap.data();
    if (!eventSnap.exists || !eventData) return null;

    const normalized = normalizeEventDoc(eventData);
    return {
      to: letterData.to,
      body: letterData.body,
      theme: letterData.theme,
      photos: resolvePhotos(
        photosToJson(letterData.photos),
        letterData.hidePhotos,
        photosToJson(normalized.letterConfig.defaultPhotos)
      ),
      date: eventData.date,
      font: normalized.letterConfig.font,
      cardName: letterData.cardName,
      honor: letterData.honor,
      eventHonor: normalized.cardConfig.honor,
    };
  }
);
