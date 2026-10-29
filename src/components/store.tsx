"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories, cents, money, type Product } from "@/lib/types";
import Icon from "./icons";
import ProductImage from "./product-image";
import { clientId } from "@/lib/client-id";
type Cart = Record<string, number>;
export default function Store({
  initialProducts,
  mode,
}: {
  initialProducts: Product[];
  mode: "preview" | "live" | "error";
}) {
  const [products, setProducts] = useState(initialProducts),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [offers, setOffers] = useState(false),
    [cart, setCart] = useState<Cart>({}),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [receipt, setReceipt] = useState<{ number: number; total: string } | null>(
      null,
    );
  const dialog = useRef<HTMLDialogElement>(null),
    key = useRef("");
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("mega-mix-cart") || "{}");
      if (stored && typeof stored === "object" && !Array.isArray(stored))
        setCart(
          Object.fromEntries(
            Object.entries(stored).filter(
              ([id, q]) =>
                /^[0-9a-f-]{36}$/i.test(id) &&
                Number.isInteger(q) &&
                Number(q) > 0 &&
                Number(q) <= 99,
            ),
          ) as Cart,
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("mega-mix-cart", JSON.stringify(cart));
      } catch {
        /* Compras continuam disponíveis sem armazenamento local. */
      }
    }
  }, [cart, ready]);
  useEffect(() => {
    if (mode !== "live") return;
    const update = () => {
      if (document.hidden) return;
      fetch("/api/products", { cache: "no-store" })
        .then(async (r) => {
          if (r.ok) {
            setProducts(await r.json());
            setNotice("");
          } else
            setNotice(
              "Não foi possível atualizar o catálogo. Tente recarregar.",
            );
        })
        .catch(() =>
          setNotice("Sem conexão. Confira sua internet antes de finalizar."),
        );
    };
    const id = setInterval(update, 20000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", update);
    };
  }, [mode]);
  const entries = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((p) => p.id === id),
    quantity,
    id,
  }));
  const total = entries.reduce(
      (sum, x) => sum + (x.product ? cents(x.product.price) * x.quantity : 0),
      0,
    ),
    count = Object.values(cart).reduce((a, b) => a + b, 0);
  const valid =
    entries.length > 0 &&
    entries.every((x) => x.product && x.product.stock >= x.quantity);
  const filtered = products.filter(
    (p) =>
      (category === "Todos" || p.category === category) &&
      (!offers || p.old_price) &&
      p.name
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          search
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        ),
  );
  function change(id: string, quantity: number) {
    if (busy) return;
    setReceipt(null);
    key.current = "";
    setCart((c) => {
      const next = { ...c };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, 99);
      return next;
    });
  }
  function openCart() {
    setError("");
    dialog.current?.showModal();
  }
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || mode !== "live" || !valid) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      contact: String(form.get("contact") ?? "").trim(),
      items: Object.entries(cart)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, quantity]) => ({ id, quantity })),
    };
    const fingerprint = JSON.stringify(payload);
    try {
      const attempt = JSON.parse(
        sessionStorage.getItem("mega-mix-attempt") || "null",
      );
      if (attempt?.fingerprint === fingerprint) key.current = attempt.key;
      else key.current = "";
    } catch {
      /* Memória mantém a chave caso sessionStorage esteja indisponível. */
    }
    if (!key.current) key.current = clientId();
    try {
      sessionStorage.setItem(
        "mega-mix-attempt",
        JSON.stringify({ fingerprint, key: key.current }),
      );
    } catch {}
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          key: key.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReceipt(data);
      setCart({});
      key.current = "";
      try {
        sessionStorage.removeItem("mega-mix-attempt");
      } catch {}
      try {
        const refreshed = await fetch("/api/products");
        if (refreshed.ok) setProducts(await refreshed.json());
      } catch {
        setNotice("Pedido registrado. Recarregue para atualizar o estoque.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Falha de conexão. Tente novamente com os mesmos dados.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip" href="#catalogo">
        Ir para os produtos
      </a>
      <div className="topbar">
        <div className="wrap flex justify-between gap-3">
          <span>Seu supermercado, agora mais perto.</span>
          <span>Feira técnica · compra demonstrativa</span>
        </div>
      </div>
      <header className="store-header">
        <div className="wrap header-row">
          <Link className="brand" href="/" aria-label="Mega Mix início">
            <span className="brand-mark">
              <Icon name="bag" size={28} />
            </span>
            <span>
              mega<span className="brand-mix">mix</span>
              <small>SUPERMERCADO DIGITAL</small>
            </span>
          </Link>
          <label className="search">
            <Icon name="search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O que não pode faltar na sua casa?"
              aria-label="Buscar produtos"
            />
            <kbd>Buscar</kbd>
          </label>
          <button className="cart-button" onClick={openCart}>
            <Icon name="cart" />
            <span>
              Minha cesta<small>{money(total / 100)}</small>
            </span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      <nav className="category-nav" aria-label="Categorias">
        <div className="wrap category-list">
          {["Todos", ...categories].map((c) => (
            <button
              key={c}
              aria-pressed={category === c && !offers}
              className={category === c && !offers ? "selected" : ""}
              onClick={() => {
                setCategory(c);
                setOffers(false);
              }}
            >
              {c === "Todos" ? "Todos os produtos" : c}
            </button>
          ))}
          <button
            className={`offers-link ${offers ? "selected" : ""}`}
            aria-pressed={offers}
            onClick={() => {
              setOffers(!offers);
              setCategory("Todos");
            }}
          >
            Ofertas da semana
          </button>
        </div>
      </nav>
      <main className="wrap">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Mais frescor.
              <br />
              Mais economia.
              <br />
              <span>Mais Mega Mix.</span>
            </h1>
            <p>
              Economia e qualidade em cada compra.
              <br />
              Tudo para sua casa, em uma só cesta.
            </p>
            <a
              className="button light"
              href="#catalogo"
              onClick={() => {
                setOffers(true);
                setCategory("Todos");
              }}
            >
              Aproveitar ofertas <Icon name="arrow" />
            </a>
          </div>
          <div
            className="hero-image"
            role="img"
            aria-label="Seleção de frutas e vegetais frescos"
          />
          <div className="hero-note">
            <Icon name="leaf" /> Da sua lista para a sua cesta.
          </div>
        </section>
        <div className="store-promises">
          <span>
            <Icon name="leaf" /> Qualidade para o seu dia a dia
          </span>
          <span>
            <Icon name="bag" /> Compra simples, sem complicação
          </span>
          <span>
            <Icon name="check" /> Pagamento 100% simulado
          </span>
        </div>
        {mode === "preview" && (
          <p className="setup-note" role="status">
            Catálogo demonstrativo. As compras serão ativadas após a
            configuração do Supabase.
          </p>
        )}
        {mode === "error" && (
          <p className="error" role="alert">
            Não foi possível carregar a loja. Verifique a conexão e tente
            recarregar a página.
          </p>
        )}
        {notice && (
          <p className="error" role="status">
            {notice}
          </p>
        )}
        <section id="catalogo" className="catalog">
          <div className="section-title">
            <div>
              <h2>
                {search
                  ? "Resultados da busca"
                  : offers
                    ? "Ofertas que valem a cesta"
                    : category === "Todos"
                      ? "Sua compra começa aqui"
                      : category}
              </h2>
              <p>
                {search
                  ? `Produtos para “${search}”`
                  : "Escolha seus favoritos. A economia vai junto."}
              </p>
            </div>
            <span>{filtered.length} produtos</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <h3>Nenhum produto encontrado</h3>
              <p>Tente outro nome ou escolha uma categoria diferente.</p>
              <button
                className="button"
                onClick={() => {
                  setSearch("");
                  setCategory("Todos");
                  setOffers(false);
                }}
              >
                Ver todos os produtos
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => (
                <article className="product" key={p.id}>
                  <div className="product-photo">
                    <ProductImage src={p.image} name={p.name} />
                    {p.old_price && (
                      <span className="offer-badge">
                        -
                        {Math.round(
                          (1 - cents(p.price) / cents(p.old_price)) * 100,
                        )}
                        %
                      </span>
                    )}
                    {p.stock === 0 && (
                      <span className="sold-out">Esgotado</span>
                    )}
                  </div>
                  <div className="product-info">
                    <span className="product-category">{p.category}</span>
                    <h3>{p.name}</h3>
                    <p className="unit">{p.unit}</p>
                    <div className="price">
                      <span>
                        {p.old_price && <del>{money(p.old_price)}</del>}
                        <strong>{money(p.price)}</strong>
                      </span>
                      {cart[p.id] ? (
                        <div className="quantity">
                          <button
                            aria-label={`Diminuir ${p.name}`}
                            onClick={() => change(p.id, cart[p.id] - 1)}
                          >
                            <Icon name="minus" size={16} />
                          </button>
                          <output>{cart[p.id]}</output>
                          <button
                            disabled={cart[p.id] >= p.stock || cart[p.id] >= 99}
                            aria-label={`Aumentar ${p.name}`}
                            onClick={() => change(p.id, cart[p.id] + 1)}
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add"
                          disabled={p.stock === 0}
                          aria-label={`Adicionar ${p.name}`}
                          onClick={() => change(p.id, 1)}
                        >
                          <Icon name="plus" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="closing">
          <Icon name="bag" size={36} />
          <div>
            <h2>O mercado que cabe na sua rotina.</h2>
            <p>Do básico da despensa ao fresquinho da semana.</p>
          </div>
          <button className="button" onClick={openCart}>
            Conferir minha cesta <Icon name="arrow" />
          </button>
        </section>
      </main>
      <footer>
        <div className="wrap footer-row">
          <div>
            <strong>Mega Mix</strong>
            <p>Economia e qualidade em cada compra.</p>
          </div>
          <span>
            Projeto fictício para feira técnica.
            <br />
            Nenhum pagamento real é processado.
          </span>
          <Link href="/admin">
            Área administrativa <Icon name="arrow" size={16} />
          </Link>
        </div>
      </footer>
      {count > 0 && (
        <button className="mobile-cart" onClick={openCart}>
          <span>
            <Icon name="cart" /> Ver cesta · {count} itens
          </span>
          <strong>{money(total / 100)}</strong>
        </button>
      )}
      <dialog
        className="cart-dialog"
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        aria-labelledby="cart-title"
      >
        <div className="dialog-heading">
          <h2 id="cart-title">{receipt ? "Pedido recebido" : "Minha cesta"}</h2>
          <button
            className="icon-button"
            aria-label="Fechar cesta"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        {receipt ? (
          <div className="receipt">
            <span className="success-icon">
              <Icon name="check" size={32} />
            </span>
            <h3>Deu tudo certo!</h3>
            <p>
              Seu pedido{" "}
              <strong>#{String(receipt.number).padStart(5, "0")}</strong> foi
              registrado.
            </p>
            <strong className="receipt-total">{money(receipt.total)}</strong>
            <p>Pagamento simulado. Nenhuma cobrança foi realizada.</p>
            <button
              className="button"
              onClick={() => {
                dialog.current?.close();
                setReceipt(null);
              }}
            >
              Continuar comprando
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty">
            <Icon name="bag" size={48} />
            <h3>Sua cesta está esperando</h3>
            <p>Adicione produtos para começar sua compra.</p>
            <button className="button" onClick={() => dialog.current?.close()}>
              Explorar produtos
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {entries.map(({ product: p, quantity, id }) => (
                <div className="cart-item" key={id}>
                  <div className="cart-photo">
                    {p && <ProductImage src={p.image} name={p.name} />}
                  </div>
                  <div>
                    <h3>{p?.name ?? "Produto indisponível"}</h3>
                    <p>
                      {p ? money(p.price) : "Remova para continuar"}
                      {p && quantity > p.stock ? " · Estoque insuficiente" : ""}
                    </p>
                    <div className="quantity">
                      <button
                        disabled={busy}
                        aria-label={`Diminuir ${p?.name ?? "produto"}`}
                        onClick={() => change(id, quantity - 1)}
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <output>{quantity}</output>
                      <button
                        aria-label={`Aumentar ${p?.name ?? "produto"}`}
                        disabled={
                          busy || !p || quantity >= p.stock || quantity >= 99
                        }
                        onClick={() => change(id, quantity + 1)}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove"
                    disabled={busy}
                    onClick={() => change(id, 0)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>Total da cesta</span>
              <strong>{money(total / 100)}</strong>
            </div>
            <form
              onSubmit={checkout}
              onChange={() => {
                if (error) key.current = "";
              }}
              className="checkout"
            >
              <h3>Vamos finalizar?</h3>
              <p>Informe seus dados para identificar o pedido.</p>
              <label>
                Seu nome
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={busy}
                />
              </label>
              <label>
                Telefone ou e-mail
                <input
                  name="contact"
                  autoComplete="email"
                  required
                  minLength={8}
                  maxLength={120}
                  disabled={busy}
                />
              </label>
              <div className="payment-note">
                <Icon name="check" /> Pagamento simulado · sem cobrança
              </div>
              {mode !== "live" && (
                <p className="error">
                  Configure o Supabase para registrar pedidos.
                </p>
              )}
              {!valid && (
                <p className="error">
                  Confira os itens sem estoque antes de finalizar.
                </p>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button full"
                disabled={busy || mode !== "live" || !valid}
              >
                {busy ? "Registrando pedido…" : "Confirmar compra simulada"}
                <Icon name="arrow" />
              </button>
              <small>
                Ao confirmar, o pedido é registrado e os itens são descontados
                do estoque.
              </small>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
