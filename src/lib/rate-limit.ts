import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

/** The visitor's IP address, hashed so it is never stored in plain text. */
export async function visitorFingerprint(): Promise<string> {
  const list = await headers();
  const ip =
    list.get("x-real-ip") ??
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  return createHash("sha256").update(`jadeer:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Count one attempt for this visitor and action. Returns false when the
 * visitor has made too many attempts within the window.
 */
export async function allowAttempt(
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const fingerprint = await visitorFingerprint();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("hit_rate_limit", {
      p_key: `${action}:${fingerprint}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Rate limit check failed:", error.code);
      return true;
    }

    return data === true;
  } catch {
    return true;
  }
}

/** Honeypot: real visitors never fill the hidden "website" field. */
export function isBot(formData: FormData): boolean {
  const trap = formData.get("website");
  return typeof trap === "string" && trap.trim().length > 0;
}
