import Link from "next/link";
import Register from "@/components/register";
import { registrationOpen } from "@/lib/registration";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await registrationOpen()) return <Register />;
  return (
    <main className="login-layout">
      <section className="login-box">
        <h1>Cadastro administrativo encerrado</h1>
        <p>
          A primeira conta já foi criada ou a ativação ainda não está
          disponível. Entre com sua conta autorizada.
        </p>
        <Link className="button" href="/admin">
          Ir para o login
        </Link>
      </section>
    </main>
  );
}
