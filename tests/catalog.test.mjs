import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const products = JSON.parse(
  readFileSync(new URL("../src/lib/products.json", import.meta.url)),
);
test("36 produtos únicos, seis por categoria, dinheiro exato e estoque válido", () => {
  assert.equal(products.length, 36);
  assert.equal(new Set(products.map((p) => p.id)).size, 36);
  const groups = Object.groupBy(products, (p) => p.category);
  assert.equal(Object.keys(groups).length, 6);
  for (const group of Object.values(groups)) assert.equal(group.length, 6);
  for (const p of products) {
    assert.match(p.price, /^\d+\.\d{2}$/);
    assert(p.stock >= 0);
    assert(p.image.startsWith("https://"));
    if (p.old_price) assert(Number(p.old_price) > Number(p.price));
  }
});
