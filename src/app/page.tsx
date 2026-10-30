import Store from "@/components/store";
import { demoProducts } from "@/lib/demo-products";
import { configured, privileged } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured()) return <Store initialProducts={demoProducts} mode="preview" />;
  try {
    const { data, error } = await privileged().from("products").select("*").eq("active", true).order("name");
    if (error || !data) throw error ?? new Error("CATALOG_ERROR");
    return <Store initialProducts={data} mode="live" />;
  } catch {
    return <Store initialProducts={demoProducts} mode="error" />;
  }
}
