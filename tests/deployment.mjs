import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const base = "https://mega-mix-neon.vercel.app";
const catalog = await fetch(`${base}/api/products`);
assert.equal(catalog.status, 200);
const products = await catalog.json();
assert.equal(products.length, 36);
const product = products.find((p) => p.stock > 1);
const payload = {
  key: randomUUID(),
  name: "Teste de publicação Mega Mix",
  contact: "demonstracao@example.invalid",
  items: [{ id: product.id, quantity: 1 }],
  total: "0.01",
};
const post = () =>
  fetch(`${base}/api/orders`, {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
const first = await post();
assert.equal(first.status, 201, await first.clone().text());
const order = await first.json();
const retry = await post();
assert.equal(retry.status, 201);
assert.deepEqual(await retry.json(), order);
assert.equal(Number(order.total), Number(product.price));
const current = await (await fetch(`${base}/api/products`)).json();
assert.equal(current.find((p) => p.id === product.id).stock, product.stock - 1);
const unauthorized = await fetch(`${base}/api/admin`);
assert.equal(unauthorized.status, 401);
const forbidden = await fetch(`${base}/api/orders`, {
  method: "POST",
  headers: {
    Origin: "https://example.invalid",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(forbidden.status, 403);
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/deployment.json",
  JSON.stringify(
    {
      base,
      key: payload.key,
      number: order.number,
      product: product.id,
      beforeStock: product.stock,
      total: order.total,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    passed: true,
    products: products.length,
    order: order.number,
    total: order.total,
    idempotent: true,
    stockDebitedOnce: true,
    adminUnauthorized: unauthorized.status,
    foreignOrigin: forbidden.status,
  }),
);
