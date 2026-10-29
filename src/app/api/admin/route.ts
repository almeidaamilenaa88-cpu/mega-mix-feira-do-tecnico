import { NextRequest, NextResponse } from "next/server";
import { privileged, requireAdmin } from "@/lib/supabase";
import { body, failure, sameOrigin } from "@/lib/http";
import { categories } from "@/lib/types";
export async function GET() {
  try {
    await requireAdmin();
    const db = privileged();
    const [products, orders] = await Promise.all([
      db.from("products").select("*").order("name"),
      db
        .from("orders")
        .select(
          "id,number,customer_name,contact,status,total,created_at,order_items(name,quantity,unit_price)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    const metrics = await db.rpc("dashboard_metrics");
    if (products.error || orders.error || metrics.error)
      throw new Error("INTERNAL_ERROR");
    return NextResponse.json(
      { products: products.data, orders: orders.data, metrics: metrics.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const input = await body(req);
    const db = privileged();
    if (input.action === "status") {
      if (
        typeof input.id !== "string" ||
        !["pending", "preparing", "completed", "cancelled"].includes(
          input.status,
        )
      )
        throw new Error("INVALID_INPUT");
      const { error } = await db.rpc("change_order_status", {
        p_id: input.id,
        p_status: input.status,
      });
      if (error)
        throw new Error(
          error.message.includes("INVALID_STATE")
            ? "INVALID_STATE"
            : "INTERNAL_ERROR",
        );
    } else if (input.action === "delete") {
      if (typeof input.id !== "string") throw new Error("INVALID_INPUT");
      const { error } = await db
        .from("products")
        .update({ active: false })
        .eq("id", input.id);
      if (error) throw error;
    } else if (input.action === "administrator") {
      if (
        typeof input.email !== "string" ||
        input.email.length > 200 ||
        !/^\S+@\S+\.\S+$/.test(input.email) ||
        typeof input.password !== "string" ||
        input.password.length < 12 ||
        input.password.length > 128
      )
        throw new Error("INVALID_INPUT");
      const { data, error } = await db.auth.admin.createUser({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        email_confirm: true,
      });
      if (error || !data.user)
        throw new Error(error?.code === "email_exists" ? "ACCOUNT_EXISTS" : "REGISTRATION_FAILED");
      const { error: adminError } = await db
        .from("administrators")
        .insert({ user_id: data.user.id, active: true });
      if (adminError) {
        await db.auth.admin.deleteUser(data.user.id);
        throw new Error("REGISTRATION_FAILED");
      }
    } else if (input.action === "product") {
      const p = input.product;
      if (
        !p ||
        typeof p.name !== "string" ||
        p.name.trim().length < 2 ||
        p.name.length > 100 ||
        !categories.includes(p.category) ||
        typeof p.unit !== "string" ||
        p.unit.length < 1 ||
        p.unit.length > 30 ||
        !/^\d{1,6}(\.\d{1,2})?$/.test(String(p.price)) ||
        Number(p.price) <= 0 ||
        !Number.isInteger(p.stock) ||
        p.stock < 0 ||
        p.stock > 100000 ||
        !Number.isInteger(p.min_stock) ||
        p.min_stock < 0 ||
        p.min_stock > 100000 ||
        typeof p.image !== "string" ||
        !/^https:\/\//.test(p.image) ||
        p.image.length > 1000
      )
        throw new Error("INVALID_INPUT");
      const { error } = await db.rpc("save_product", {
        p_id: p.id || null,
        p_name: p.name.trim(),
        p_category: p.category,
        p_unit: p.unit,
        p_price: p.price,
        p_stock: p.stock,
        p_min_stock: p.min_stock,
        p_image: p.image,
        p_expected_stock: input.expectedStock ?? null,
      });
      if (error)
        throw new Error(
          error.message.includes("STOCK_CONFLICT")
            ? "STOCK_CONFLICT"
            : "INTERNAL_ERROR",
        );
    } else throw new Error("INVALID_INPUT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
