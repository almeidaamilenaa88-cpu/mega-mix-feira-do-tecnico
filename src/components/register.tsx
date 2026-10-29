"use client";
import { useState } from "react";
import Link from "next/link";
export default function Register() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    if (form.get("password") !== form.get("confirm")) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          code: form.get("code"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.assign("/admin");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível criar sua conta. Tente novamente.",
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
          Sua loja.
          <br />
          Seu controle.
        </h1>
        <p>Crie sua conta e comece a administrar o Mega Mix.</p>
      </div>
      <section className="login-box">
        <h2>Criar conta de administrador</h2>
        <p>
          A ativação é exclusiva do responsável pela loja e só pode ser usada na
          primeira conta.
        </p>
        <form className="checkout" onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              maxLength={200}
              disabled={busy}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              aria-describedby="password-hint"
              disabled={busy}
            />
            <small id="password-hint">
              Use pelo menos 12 caracteres. Combine palavras, números e
              símbolos.
            </small>
          </label>
          <label>
            Confirmar senha
            <input
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              disabled={busy}
            />
          </label>
          <label>
            Código de ativação
            <input
              type="password"
              name="code"
              required
              autoComplete="off"
              minLength={32}
              maxLength={200}
              disabled={busy}
            />
            <small>Use o código entregue com a publicação da sua loja.</small>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Criando sua conta…" : "Criar minha conta"}
          </button>
        </form>
        <Link className="back-link" href="/admin">
          Já tenho conta. Entrar
        </Link>
      </section>
    </main>
  );
}
