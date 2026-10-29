import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
export function privileged() {
  if (!configured()) throw new Error("SETUP_REQUIRED");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function sessionClient() {
  if (!configured()) throw new Error("SETUP_REQUIRED");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              }),
            );
          } catch {
            /* Server components cannot write; route handlers refresh cookies. */
          }
        },
      },
    },
  );
}
export async function requireAdmin() {
  const client = await sessionClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("UNAUTHORIZED");
  const { data } = await client
    .from("administrators")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!data) throw new Error("FORBIDDEN");
  return client;
}
