"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { allowAttempt } from "@/lib/rate-limit";

export type LoginState = {
  error: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (
    typeof emailValue !== "string" ||
    typeof passwordValue !== "string"
  ) {
    return { error: "Please enter your email and password." };
  }

  const email = emailValue.trim();
  const password = passwordValue;

  if (
    !email ||
    !password ||
    email.length > 254 ||
    password.length > 1024
  ) {
    return { error: "Please enter a valid email and password." };
  }

  // Slow down password guessing.
  if (!(await allowAttempt("login", 8, 900))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "Unable to sign in. Check your details and try again.",
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut({ scope: "local" });

    return {
      error: membershipError
        ? "Unable to verify access right now. Please try again."
        : "This account does not have active administrator access.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}