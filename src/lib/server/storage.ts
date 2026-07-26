import { ulid } from "ulid";
import { getAdminStorage } from "./firebase-admin";
import { storageEnvFolder } from "./env";
import { HttpError } from "./http-error";

/** アップロードを許可する画像の MIME タイプ。 */
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** 署名付きアップロード URL の有効期限。発行から数分で PUT する想定。 */
const UPLOAD_URL_TTL_MS = 10 * 60 * 1000;

function bucketName(): string {
  const name =
    process.env.STORAGE_UPLOADS_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!name) {
    throw new HttpError(500, "アップロード先バケットが設定されていません");
  }
  return name;
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export interface SignedUpload {
  /** クライアントが画像を直接 PUT する署名付き URL。 */
  uploadUrl: string;
  /** PUT 時に必ず付与するヘッダ(この値で署名しているため欠けると失敗)。 */
  headers: Record<string, string>;
  /** アップロード完了後に表示・保存へ使う公開 URL。 */
  url: string;
}

/**
 * Cloud Storage への署名付きアップロード URL(V4, PUT)をサーバー側で発行する。
 * 画像バイト列は Next.js サーバーを経由せず、ブラウザから直接バケットへ上がる。
 *
 * バケットは公開読み取り(allUsers: objectViewer, Terraform 管理)なので、
 * アップロード後はオブジェクトの公開 URL をそのまま画像 URL として使える。
 * 認証・メンバーシップ確認は呼び出し側(Route Handler)の責務。
 *
 * NOTE: 署名には署名可能な認証情報が要る。ローカルのユーザー ADC では署名できない
 * ため、Cloud Run(stg)SA のなりすまし(impersonation)が必要。Cloud Run では
 * アタッチされた SA が自身に対して signBlob できるよう tokenCreator を付与している。
 * どちらも Terraform(10_shared)で権限を管理している。
 */
export async function createSignedUploadUrl(
  contentType: string
): Promise<SignedUpload> {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new HttpError(415, "対応していない画像形式です");
  }

  const bucket = getAdminStorage().bucket(bucketName());
  const storagePath = `uploads/${storageEnvFolder()}/${ulid()}.${extensionFor(contentType)}`;
  const file = bucket.file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + UPLOAD_URL_TTL_MS,
    contentType,
  });

  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return {
    uploadUrl,
    headers: { "Content-Type": contentType },
    url,
  };
}
