import { NextRequest, NextResponse } from "next/server";
import { privileged } from "@/lib/supabase";
import { body, sameOrigin, failure } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (
      typeof input.name !== "string" ||
      input.name.trim().length < 2 ||
      input.name.length > 100 ||
      typeof input.contact !== "string" ||
      input.contact.trim().length < 8 ||
      input.contact.length > 120 ||
      !Array.isArray(input.items) ||
      input.items.length < 1 ||
      input.items.length > 64 ||
      !input.items.every(
        (x: { id: string; quantity: number }) =>
          x &&
          typeof x.id === "string" &&
          /^[0-9a-f-]{36}$/i.test(x.id) &&
          Number.isInteger(x.quantity) &&
          x.quantity > 0 &&
          x.quantity <= 99,
      ) ||
      typeof input.key !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(input.key)
    )
      throw new Error("INVALID_INPUT");
    const { data, error } = await privileged().rpc("place_order", {
      p_key: input.key,
      p_name: input.name.trim(),
      p_contact: input.contact.trim(),
      p_items: input.items,
    });
    if (error)
      throw new Error(
        ["INSUFFICIENT_STOCK", "INVALID_INPUT", "IDEMPOTENCY_CONFLICT"].find(
          (x) => error.message.includes(x),
        ) ?? "INTERNAL_ERROR",
      );
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
