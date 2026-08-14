export type FreezerEnv = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

declare global {
  var __FREEZER_ENV__: FreezerEnv | undefined;
}

export function getRuntimeEnv(): FreezerEnv {
  if (!globalThis.__FREEZER_ENV__) throw new Error("Lagringen for Fryseboksen er ikke tilgjengelig");
  return globalThis.__FREEZER_ENV__;
}
