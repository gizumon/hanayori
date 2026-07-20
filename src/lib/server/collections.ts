import { getAdminFirestore } from "./firebase-admin";
import { collectionPrefix } from "./env";
import type { EventDoc, LetterDoc } from "./schema";

export function eventsCollection() {
  return getAdminFirestore().collection(
    `${collectionPrefix()}events`
  ) as FirebaseFirestore.CollectionReference<EventDoc>;
}

export function lettersCollection() {
  return getAdminFirestore().collection(
    `${collectionPrefix()}letters`
  ) as FirebaseFirestore.CollectionReference<LetterDoc>;
}
