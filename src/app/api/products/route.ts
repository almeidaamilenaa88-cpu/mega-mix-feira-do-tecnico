import { NextResponse } from "next/server";
import { privileged } from "@/lib/supabase";
import { failure } from "@/lib/http";
export async function GET() {
  try {
    const { data, error } = await privileged()
      .from("products")
      .select("*")
      .eq("active", true)
      .gt("price", 0)
      .order("name");
    if (error) throw error;
    return NextResponse.json(
      (data ?? []).filter(
        (product) =>
          Number.isFinite(Number(product.price)) && Number(product.price) > 0,
      ),
      {
      headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
