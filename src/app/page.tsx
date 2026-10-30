import Store from "@/components/store";
import { demoProducts } from "@/lib/demo-products";
import { configured, privileged } from "@/lib/supabase";
export const dynamic = "force-dynamic";
const hasValidPrice = (product: { price?: string | number | null }) =>
  Number.isFinite(Number(product.price)) && Number(product.price) > 0;
export default async function Page() {
  if (!configured())
    return (
      <Store
        initialProducts={demoProducts.filter(hasValidPrice)}
        mode="preview"
      />
    );
  try {
    const { data, error } = await privileged().from("products").select("*").eq("active", true).order("name");
    if (error || !data) throw error ?? new Error("CATALOG_ERROR");
    return <Store initialProducts={data.filter(hasValidPrice)} mode="live" />;
  } catch {
    return (
      <Store
        initialProducts={demoProducts.filter(hasValidPrice)}
        mode="error"
      />
    );
  }
}
