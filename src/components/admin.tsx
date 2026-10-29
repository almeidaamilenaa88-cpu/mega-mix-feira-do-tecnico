"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  categories,
  money,
  statuses,
  type Product,
  type Order,
} from "@/lib/types";
import Icon from "./icons";
type Data = {
  products: Product[];
  orders: Order[];
  metrics: {
    revenue: string;
    orders: number;
    units: number;
    low_stock: number;
  };
};
export default function Admin() {
  const [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState("overview"),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [updated, setUpdated] = useState(""),
    [editing, setEditing] = useState<Product | null>(null),
    [filter, setFilter] = useState("all");
  const dialog = useRef<HTMLDialogElement>(null),
    deleteDialog = useRef<HTMLDialogElement>(null),
    [deleting, setDeleting] = useState<Product | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.assign("/admin");
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      setData(body);
      setUpdated(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Falha na atualização. Tente novamente.",
      );
    }
  }, []);
  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, 10000);
    return () => clearInterval(interval);
  }, [load]);
  async function mutate(payload: unknown) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setSuccess("Alteração salva.");
      await load();
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Falha ao salvar. Seus dados foram preservados.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const product = {
      id: editing?.id,
      name: form.get("name"),
      category: form.get("category"),
      unit: form.get("unit"),
      price: form.get("price"),
      stock: Number(form.get("stock")),
      min_stock: Number(form.get("min_stock")),
      image: form.get("image"),
    };
    if (
      await mutate({
        action: "product",
        product,
        expectedStock: editing?.stock,
      })
    )
      dialog.current?.close();
  }
  async function addAdministrator(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("passwordConfirmation")) {
      setError("As senhas não conferem.");
      return;
    }
    if (
      await mutate({
        action: "administrator",
        email: form.get("email"),
        password,
      })
    ) {
      e.currentTarget.reset();
      setSuccess("Administrador criado. A pessoa já pode entrar com estes dados.");
    }
  }
  function edit(p: Product | null) {
    setError("");
    setEditing(p);
    dialog.current?.showModal();
  }
  async function logout() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth", { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.assign("/admin");
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setBusy(false);
    }
  }
  const active = data?.products.filter((p) => p.active) ?? [],
    low = active.filter((p) => p.stock <= p.min_stock),
    orders = (data?.orders ?? []).filter(
      (o) => filter === "all" || o.status === filter,
    );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/">
          mega<span className="brand-mix">mix</span>
        </Link>
        <p>Administração</p>
        <nav aria-label="Painel administrativo">
          {[
            ["overview", "Visão geral"],
            ["orders", "Pedidos"],
            ["products", "Produtos e estoque"],
            ["access", "Acessos"],
          ].map(([id, label]) => (
            <button
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
              key={id}
            >
              {label}
              {id === "orders" && data && (
                <span>
                  {data.orders.filter((o) => o.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">
            Abrir loja <Icon name="arrow" size={16} />
          </Link>
          <button onClick={logout} disabled={busy}>
            Sair da conta
          </button>
          <small>
            Ambiente demonstrativo
            <br />
            Pagamentos simulados
          </small>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-heading">
          <div>
            <p>Mega Mix / Administração</p>
            <h1>
              {tab === "overview"
                ? "Visão geral"
                : tab === "orders"
                  ? "Pedidos recebidos"
                    : tab === "products"
                      ? "Produtos e estoque"
                      : "Acessos administrativos"}
            </h1>
          </div>
          <div className="sync">
            <span>
              {updated ? `Atualizado às ${updated}` : "Carregando dados…"}
            </span>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setError("");
                load();
              }}
            >
              Atualizar
            </button>
          </div>
        </header>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="success" role="status">
            {success}
          </p>
        )}
        {!data ? (
          <div className="empty">
            <p>Carregando dados da loja…</p>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <>
                <div className="metrics">
                  <div>
                    <p>Faturamento concluído</p>
                    <strong>{money(data.metrics.revenue)}</strong>
                    <small>Somente pedidos concluídos · BRL</small>
                  </div>
                  <div>
                    <p>Pedidos recebidos</p>
                    <strong>{data.metrics.orders}</strong>
                    <small>Todos os status</small>
                  </div>
                  <div>
                    <p>Produtos vendidos</p>
                    <strong>{data.metrics.units}</strong>
                    <small>Unidades em pedidos concluídos</small>
                  </div>
                  <button onClick={() => setTab("products")}>
                    <p>Estoque baixo</p>
                    <strong>{data.metrics.low_stock}</strong>
                    <small>Produtos no limite mínimo</small>
                  </button>
                </div>
                <div className="admin-section-title">
                  <div>
                    <h2>Últimos pedidos</h2>
                    <p>Atualização automática a cada 10 segundos.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setTab("orders")}
                  >
                    Ver todos <Icon name="arrow" size={16} />
                  </button>
                </div>
                {renderOrders(data.orders.slice(0, 6))}
                <section className="stock-warning">
                  <h2>Precisam de reposição</h2>
                  {low.length === 0 ? (
                    <p>Nenhum produto abaixo do estoque mínimo.</p>
                  ) : (
                    <ul>
                      {low.map((p) => (
                        <li key={p.id}>
                          <span>{p.name}</span>
                          <strong>
                            {p.stock} un. <small>mín. {p.min_stock}</small>
                          </strong>
                          <button
                            className="text-button"
                            onClick={() => edit(p)}
                          >
                            Editar estoque
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
            {tab === "orders" && (
              <>
                <div className="admin-section-title">
                  <p>Últimos 200 pedidos · horários de Brasília</p>
                  <label className="inline-label">
                    Status
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      {Object.entries(statuses).map(([id, label]) => (
                        <option value={id} key={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {renderOrders(orders)}
              </>
            )}
            {tab === "products" && (
              <>
                <div className="admin-section-title">
                  <p>
                    {active.length} produtos ativos · {low.length} com estoque
                    baixo
                  </p>
                  <button className="button" onClick={() => edit(null)}>
                    <Icon name="plus" size={16} /> Novo produto
                  </button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <small>{p.unit}</small>
                          </td>
                          <td>{p.category}</td>
                          <td>{money(p.price)}</td>
                          <td>
                            <span
                              className={`status ${p.stock <= p.min_stock ? "pending" : "completed"}`}
                            >
                              {p.stock} un.
                              {p.stock <= p.min_stock ? " · Baixo" : ""}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button onClick={() => edit(p)}>Editar</button>
                              <button
                                className="danger-text"
                                disabled={busy}
                                onClick={() => {
                                  setDeleting(p);
                                  deleteDialog.current?.showModal();
                                }}
                              >
                                Desativar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {active.length === 0 && (
                    <div className="empty">
                      Nenhum produto ativo. Cadastre o primeiro produto.
                    </div>
                  )}
                </div>
              </>
            )}
            {tab === "access" && (
              <section className="access-panel" aria-labelledby="access-title">
                <div>
                  <h2 id="access-title">Novo administrador</h2>
                  <p>
                    Crie o acesso para a equipe que também fará a gestão da loja.
                    A senha é definida agora e não fica visível depois do cadastro.
                  </p>
                </div>
                <form className="checkout" onSubmit={addAdministrator}>
                  <label>
                    E-mail do administrador
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={200}
                      required
                      placeholder="nome@empresa.com"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Senha temporária ou definitiva
                      <input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={128}
                        required
                      />
                    </label>
                    <label>
                      Confirmar senha
                      <input
                        name="passwordConfirmation"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={128}
                        required
                      />
                    </label>
                  </div>
                  <p>Use no mínimo 12 caracteres e compartilhe a senha apenas pelo canal combinado com a pessoa.</p>
                  <button className="button" disabled={busy}>
                    <Icon name="plus" size={16} />
                    {busy ? "Criando acesso…" : "Criar administrador"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
      <dialog
        ref={dialog}
        className="edit-dialog"
        aria-labelledby="edit-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <div className="dialog-heading">
          <h2 id="edit-title">{editing ? "Editar produto" : "Novo produto"}</h2>
          <button
            className="icon-button"
            disabled={busy}
            aria-label="Fechar edição"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <form key={editing?.id ?? "new"} className="checkout" onSubmit={save}>
          <label>
            Nome
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={editing?.name}
            />
          </label>
          <div className="form-grid">
            <label>
              Categoria
              <select name="category" defaultValue={editing?.category}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Unidade / embalagem
              <input
                name="unit"
                required
                maxLength={30}
                placeholder="pacote 1 kg"
                defaultValue={editing?.unit}
              />
            </label>
            <label>
              Preço (R$)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                max="999999.99"
                required
                defaultValue={editing?.price}
              />
            </label>
            <label>
              Estoque (unidades)
              <input
                name="stock"
                type="number"
                step="1"
                min="0"
                max="100000"
                required
                defaultValue={editing?.stock ?? 0}
              />
            </label>
            <label>
              Estoque mínimo
              <input
                name="min_stock"
                type="number"
                step="1"
                min="0"
                max="100000"
                required
                defaultValue={editing?.min_stock ?? 5}
              />
            </label>
          </div>
          <label>
            URL HTTPS da imagem
            <input
              name="image"
              type="url"
              pattern="https://.*"
              required
              maxLength={1000}
              defaultValue={editing?.image}
              placeholder="https://…"
            />
          </label>
          <p>
            Contagem de estoque em unidades da embalagem. Alterações
            concorrentes impedem salvar uma contagem desatualizada.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Salvando…" : "Salvar produto"}
          </button>
        </form>
      </dialog>
      <dialog
        ref={deleteDialog}
        className="edit-dialog"
        aria-labelledby="delete-title"
      >
        <div className="dialog-heading">
          <h2 id="delete-title">Desativar produto?</h2>
        </div>
        <p>
          <strong>{deleting?.name}</strong> sairá da loja. O histórico dos
          pedidos será preservado.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="row-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => deleteDialog.current?.close()}
          >
            Manter ativo
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={async () => {
              if (
                deleting &&
                (await mutate({ action: "delete", id: deleting.id }))
              )
                deleteDialog.current?.close();
            }}
          >
            Desativar produto
          </button>
        </div>
      </dialog>
    </div>
  );
  function renderOrders(list: Order[]) {
    return list.length === 0 ? (
      <div className="empty">
        <Icon name="bag" size={40} />
        <h3>Nenhum pedido por aqui</h3>
        <p>As compras finalizadas na loja aparecerão nesta lista.</p>
      </div>
    ) : (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Pedido / Data</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Status</th>
              <th>Próxima ação</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>#{String(o.number).padStart(5, "0")}</strong>
                  <small>
                    {new Date(o.created_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </small>
                </td>
                <td>
                  {o.customer_name}
                  <small>{o.contact}</small>
                </td>
                <td>
                  <details>
                    <summary>
                      {o.order_items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
                      unidades
                    </summary>
                    {o.order_items.map((i, index) => (
                      <p key={index}>
                        {i.quantity} × {i.name} · {money(i.unit_price)}
                      </p>
                    ))}
                  </details>
                </td>
                <td>{money(o.total)}</td>
                <td>
                  <span className={`status ${o.status}`}>
                    {statuses[o.status]}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {o.status === "pending" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: "status",
                            id: o.id,
                            status: "preparing",
                          })
                        }
                      >
                        Preparar
                      </button>
                    )}
                    {o.status === "preparing" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          mutate({
                            action: "status",
                            id: o.id,
                            status: "completed",
                          })
                        }
                      >
                        Concluir
                      </button>
                    )}
                    {["pending", "preparing"].includes(o.status) && (
                      <button
                        className="danger-text"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Cancelar pedido #${o.number}? Os itens serão devolvidos ao estoque.`,
                            )
                          )
                            mutate({
                              action: "status",
                              id: o.id,
                              status: "cancelled",
                            });
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                    {["completed", "cancelled"].includes(o.status) && (
                      <span>Finalizado</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
