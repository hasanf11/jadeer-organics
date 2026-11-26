import "server-only";

import { createHash } from "node:crypto";

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The private order link stores only a hash of its token. */
export function hashOrderToken(token: string): string | null {
  return TOKEN.test(token) ? createHash("sha256").update(token, "utf8").digest("hex") : null;
}
