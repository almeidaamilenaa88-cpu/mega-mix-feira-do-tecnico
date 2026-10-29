import { NextResponse } from "next/server";
import { privileged } from "@/lib/supabase";
import { failure } from "@/lib/http";
export async function GET() {
  try {
    const { data, error } = await privileged()
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
