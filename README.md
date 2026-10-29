# Mega Mix — Supermercado Digital

Loja virtual demonstrativa para feira técnica. Catálogo com 36 produtos, carrinho, checkout simulado, estoque atômico e painel administrativo autenticado.

## Acesse

- **Loja:** https://mega-mix-neon.vercel.app

## Tecnologias

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL e Auth) e Vercel. Requer Node.js 22 ou superior.

## Estrutura

```text
src/app/          Páginas e rotas da API
src/components/   Loja, painel, login e componentes visuais
src/lib/          Clientes Supabase, tipos, catálogo e utilitários
supabase/         Schema, seed e migrações SQL
tests/            Testes de catálogo, banco, checkout e deploy
docs/             Configuração, imagens e verificações
```

## Executar localmente

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Configure as variáveis abaixo para ativar pedidos, autenticação e painel; sem elas, a loja mostra o catálogo de demonstração.

## Configuração do Supabase

Em `.env.local`, defina:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privilegiada, somente no servidor |
| `MEGA_MIX_BOOTSTRAP_KEY` | Código privado temporário para ativar o primeiro administrador |

No SQL Editor do projeto Supabase, execute `supabase/schema.sql`, `supabase/first-admin.sql` e `supabase/seed.sql`, nessa ordem. O seed inclui 36 produtos e pode ser repetido sem redefinir o estoque existente.

Configure `MEGA_MIX_BOOTSTRAP_KEY` com pelo menos 32 caracteres aleatórios. Acesse `/admin`, escolha **Criar conta** e defina e-mail e senha (mínimo de 12 caracteres). O cadastro inicial fecha após o primeiro administrador. Remova o código do ambiente depois da ativação. Administradores adicionais podem ser criados pela área **Acessos** no painel.

Nunca publique `.env.local` nem exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.

## Publicar na Vercel

O projeto está hospedado na Vercel e o repositório está conectado. Para importar manualmente, selecione este repositório, use a raiz (`./`) como **Root Directory**, mantenha o framework Next.js e configure as variáveis do Supabase no ambiente de produção. A URL pública precisa estar cadastrada nas configurações de URL do Supabase Auth.

## Fluxo da demonstração

1. Abra a loja no celular e adicione produtos ao carrinho.
2. Finalize com nome e contato; o pagamento é apenas simulado.
3. No computador, acompanhe o pedido em `/admin` (atualização a cada 10 segundos).
4. Atualize o status e confira os indicadores e o estoque.

O banco calcula os totais usando os preços cadastrados e bloqueia estoque insuficiente. Cancelamentos permitidos devolvem estoque uma única vez. O dashboard usa dados persistidos; não há vendas ou pagamentos reais.

## Verificações

```powershell
npm run typecheck
npm test
npm run build
```

Veja `docs/verification.md` para os testes de banco e navegador, `docs/deployment.md` para configuração e `supabase/` para scripts do banco.
