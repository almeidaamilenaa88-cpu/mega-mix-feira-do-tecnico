import { NextRequest, NextResponse } from "next/server";
import { sessionClient, requireAdmin } from "@/lib/supabase";
import { body, sameOrigin, failure } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (
      typeof input.email !== "string" ||
      input.email.length > 200 ||
      typeof input.password !== "string" ||
      input.password.length > 200
    )
      throw new Error("INVALID_INPUT");
    const client = await sessionClient();
    const { error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw new Error("UNAUTHORIZED");
    try {
      await requireAdmin();
    } catch (e) {
      await client.auth.signOut();
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req);
    const client = await sessionClient();
    await client.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
