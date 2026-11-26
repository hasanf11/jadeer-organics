import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAdmin() {
  // Run authentication only when an actual request arrives.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from("admin_users")
    .select("user_id, display_name, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!membership) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: membership.display_name as string,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return admin;
}