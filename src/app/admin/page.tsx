import Link from "next/link";
import { configured, requireAdmin } from "@/lib/supabase";
import Admin from "@/components/admin";
import Login from "@/components/login";
import { registrationOpen } from "@/lib/registration";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured())
    return (
      <main className="login-layout">
        <section className="login-box">
          <Link className="brand" href="/">
            mega<span className="brand-mix">mix</span>
          </Link>
          <h1>Ative a administração</h1>
          <p>
            Configure as três variáveis do arquivo <code>.env.example</code>,
            execute os scripts SQL e cadastre um administrador conforme o
            README.
          </p>
          <Link className="button" href="/">
            Voltar para a loja
          </Link>
        </section>
      </main>
    );
  try {
    await requireAdmin();
  } catch {
    return <Login allowRegistration={await registrationOpen()} />;
  }
  return <Admin />;
}
