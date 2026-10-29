const { chromium } = require("../../node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000");
  await page.getByRole("heading", { name: "Sua compra começa aqui" }).waitFor();
  assert.equal(await page.locator("article.product").count(), 36);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Adicionar Banana-prata", exact: true })
    .click();
  await page.getByRole("button", { name: /Minha cesta/ }).click();
  await page.getByLabel("Seu nome").fill("Visitante da feira");
  await page.getByLabel("Telefone ou e-mail").fill("visitante@example.test");
  assert(
    await page
      .getByRole("button", { name: "Confirmar compra simulada", exact: true })
      .isDisabled(),
  );
  await page.getByRole("button", { name: "Fechar cesta" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Minha cesta/ }).click();
  assert.equal(
    await page.locator("dialog .quantity output").textContent(),
    "1",
  );
  await page.screenshot({ path: "test-results/cart.png" });
  await page.getByRole("button", { name: "Fechar cesta" }).click();
  await page.getByLabel("Buscar produtos").fill("cafe");
  assert.equal(await page.locator("article.product").count(), 1);
  await page.getByLabel("Buscar produtos").fill("");
  await page.getByRole("button", { name: "Laticínios", exact: true }).click();
  assert.equal(await page.locator("article.product").count(), 6);
  await page
    .getByRole("button", { name: "Todos os produtos", exact: true })
    .click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: `test-results/mobile-${width}.png`,
      fullPage: true,
    });
  }
  const unauthorized = await page.request.get(
    "http://localhost:3000/api/admin",
  );
  assert.equal(unauthorized.status(), 503);
  const blocked = await page.request.post("http://localhost:3000/api/orders", {
    headers: { Origin: "https://evil.example" },
    data: {},
  });
  assert.equal(blocked.status(), 403);
  const invalid = await page.request.post("http://localhost:3000/api/orders", {
    headers: { Origin: "http://localhost:3000" },
    data: {},
  });
  assert.equal(invalid.status(), 422);
  const nullBody = await page.request.post("http://localhost:3000/api/orders", {
    headers: { Origin: "http://localhost:3000" },
    data: "null",
  });
  assert.equal(nullBody.status(), 422);
  const unconfigured = await page.request.post(
    "http://localhost:3000/api/orders",
    {
      headers: { Origin: "http://localhost:3000" },
      data: {
        name: "Visitante teste",
        contact: "visitante@example.test",
        key: "10000000-0000-4000-8000-000000000001",
        items: [{ id: "00000000-0000-4000-8000-000000000001", quantity: 1 }],
      },
    },
  );
  assert.equal(unconfigured.status(), 503);
  await page.goto("http://localhost:3000/admin");
  await page.getByRole("heading", { name: "Ative a administração" }).waitFor();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: catálogo, busca, categorias, carrinho persistido, checkout bloqueado sem credenciais, 320/390/1440 px, proteção Origin e validação.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
