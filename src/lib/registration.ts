import "server-only";
import { configured, privileged } from "./supabase";
export async function registrationOpen() {
  if (!configured() || !process.env.MEGA_MIX_BOOTSTRAP_KEY) return false;
  const { count, error } = await privileged()
    .from("administrators")
    .select("user_id", { count: "exact", head: true });
  return !error && count === 0;
}
