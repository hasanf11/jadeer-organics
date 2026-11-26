// Create (or re-activate) a shop administrator.
//   npm run admin:create -- owner@example.com "a-strong-password" "Rasha"
import { createClient } from "@supabase/supabase-js";

const [email, password, displayName = "Admin"] = process.argv.slice(2);

if (!email || !password || password.length < 10) {
  console.error('Usage: npm run admin:create -- <email> <password (10+ characters)> "<display name>"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });

if (error) {
  // The account may already exist: find it and update its password.
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error("Could not create the user:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  await supabase.auth.admin.updateUserById(userId, { password });
} else {
  userId = created.user.id;
}

const { error: memberError } = await supabase
  .from("admin_users")
  .upsert({ user_id: userId, display_name: displayName, is_active: true });

if (memberError) {
  console.error("Could not grant admin access:", memberError.message);
  process.exit(1);
}

console.log(`✅ ${email} can now sign in at /login`);
