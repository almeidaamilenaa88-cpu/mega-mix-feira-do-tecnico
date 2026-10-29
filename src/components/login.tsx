"use client";
import Link from "next/link";
import { useState } from "react";
export default function Login({
  allowRegistration = false,
}: {
  allowRegistration?: boolean;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      window.location.assign("/admin");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível entrar. Tente novamente.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="login-layout">
      <div className="login-intro">
        <Link className="brand" href="/">
          mega<span className="brand-mix">mix</span>
        </Link>
        <h1>
          O cuidado com a loja
          <br />
          começa por aqui.
        </h1>
        <p>Pedidos, produtos e estoque em um só lugar.</p>
      </div>
      <section className="login-box">
        <h2>Entrar na administração</h2>
        <p>Use sua conta autorizada do Mega Mix.</p>
        <form className="checkout" onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              maxLength={200}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              maxLength={200}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        {allowRegistration && (
          <Link
            className="button secondary full"
            style={{ marginTop: 16 }}
            href="/admin/criar-conta"
          >
            Criar conta
          </Link>
        )}
        <Link className="back-link" href="/">
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}
