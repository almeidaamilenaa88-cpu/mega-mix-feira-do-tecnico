import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { body, failure, sameOrigin } from "@/lib/http";
import { privileged, sessionClient } from "@/lib/supabase";
import { registrationOpen } from "@/lib/registration";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (
      typeof input.email !== "string" ||
      input.email.length > 200 ||
      !/^\S+@\S+\.\S+$/.test(input.email) ||
      typeof input.password !== "string" ||
      input.password.length < 12 ||
      input.password.length > 128 ||
      typeof input.code !== "string" ||
      input.code.length > 200
    )
      throw new Error("INVALID_INPUT");
    const expected = process.env.MEGA_MIX_BOOTSTRAP_KEY;
    if (
      !expected ||
      !timingSafeEqual(
        createHash("sha256").update(input.code).digest(),
        createHash("sha256").update(expected).digest(),
      )
    )
      throw new Error("ACTIVATION_DENIED");
    if (!(await registrationOpen())) throw new Error("REGISTRATION_CLOSED");
    const db = privileged();
    const { data, error } = await db.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error(
        error?.code === "email_exists"
          ? "ACCOUNT_EXISTS"
          : "REGISTRATION_FAILED",
      );
    const { error: claimError } = await db.rpc("claim_first_administrator", {
      p_user: data.user.id,
    });
    if (claimError) {
      // Nenhum login foi iniciado: remove somente a identidade recém-criada sem autorização.
      await db.auth.admin.deleteUser(data.user.id);
      throw new Error(
        claimError.message.includes("REGISTRATION_CLOSED")
          ? "REGISTRATION_CLOSED"
          : "REGISTRATION_FAILED",
      );
    }
    const session = await sessionClient();
    const { error: loginError } = await session.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
    return NextResponse.json(
      { ok: true, signedIn: !loginError },
      { status: 201 },
    );
  } catch (error) {
    return failure(error);
  }
}
