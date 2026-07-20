export type AppEnv = "development" | "staging" | "production";

export function getAppEnv(): AppEnv {
  const raw = process.env.APP_ENV;
  if (raw === "staging" || raw === "production") return raw;
  return "development";
}

/**
 * stg / prod は同一 Firestore データベースを共有するため(コスト都合)、
 * コレクション名にプレフィックスを付けて環境を分離する。
 * dev_ プレフィックスはローカル開発専用で本番データに一切触れない。
 */
export function collectionPrefix(): string {
  switch (getAppEnv()) {
    case "production":
      return "prod_";
    case "staging":
      return "stg_";
    default:
      return "dev_";
  }
}
