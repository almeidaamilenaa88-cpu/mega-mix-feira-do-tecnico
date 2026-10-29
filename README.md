# Mega Mix

Aplicação independente do sistema empresarial da raiz. Next.js 16, React 19, TypeScript, Tailwind 4 e Supabase. Node >=22.

```powershell
cd mega-mix
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem configuração externa, somente o catálogo de prévia e o carrinho ficam disponíveis; pedidos e administração não são simulados localmente.

## Configurar Supabase

Use um projeto dedicado ao Mega Mix (schema `public`, uma única loja). Em `.env.local` configure exatamente:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicável (aceita chave anon legada).
- `SUPABASE_SERVICE_ROLE_KEY`: chave service_role, exclusivamente no servidor.

No SQL Editor execute **supabase/schema.sql**, **supabase/first-admin.sql** e **supabase/seed.sql**, nessa ordem. O primeiro arquivo é a migração inicial transacional; execute uma vez em projeto vazio. O seed é repetível e não redefine estoque existente. Há quatro tabelas: produtos, administradores, pedidos e itens. Os dados iniciais contêm 36 produtos fictícios, seis categorias e nenhum pedido.

Para criar sua primeira conta no próprio site, configure também `MEGA_MIX_BOOTSTRAP_KEY` com um código privado aleatório de pelo menos 32 caracteres. Em `/admin`, clique em **Criar conta** e informe e-mail, senha com pelo menos 12 caracteres e o código. O código nunca é enviado no HTML ou no JavaScript. A primeira associação é protegida por bloqueio transacional; depois dela o cadastro inicial fecha. Remova a variável de ativação após concluir o cadastro. Não há cadastro público de novos administradores.

Como alternativa de provisionamento manual, em Authentication > Users crie um usuário com e-mail e senha. Copie seu UUID e execute no SQL Editor:

```sql
insert into public.administrators(user_id) values ('UUID-DO-USUARIO');
```

Não há senha padrão nem cadastro público de administrador. Configure as políticas de senha e limites de autenticação no Supabase. Acesse `/admin` com essa conta. Cookies de autenticação são HttpOnly, SameSite=Lax e Secure em produção. A associação de administrador é revalidada no servidor em cada operação; não depende de metadados editáveis do usuário. Mutações verificam Origin.

## Demonstração

1. Abra a loja no celular pela URL publicada (ou IP do computador na mesma rede com `npm run dev -- --hostname 0.0.0.0`).
2. Adicione itens, informe nome e contato e confirme o pagamento simulado.
3. No computador, abra `/admin`; novos pedidos aparecem em até 10 segundos.
4. Use Preparar e Concluir. Faturamento e unidades vendidas incluem exclusivamente pedidos concluídos.
5. Um pedido pendente/em preparação pode ser cancelado; o estoque retorna uma única vez. Concluídos/cancelados são finais. Não há recebimento real ou reembolso.

Carrinhos usam unidades da embalagem, inclusive produtos vendidos em pacotes de 1 kg. O banco determina os preços e soma em NUMERIC(12,2). Bloqueios de linhas em ordem estável impedem venda acima do disponível. A mesma chave de checkout retorna o mesmo pedido; mudança de conteúdo com a mesma chave é conflito. A edição de contagem compara o estoque visto pelo administrador para impedir sobrescrever vendas concorrentes. Exclusão de produto é lógica e preserva snapshots dos itens. Loja atualiza catálogo a cada 20 segundos e ao ganhar foco.

RLS em todas as tabelas. Público lê apenas produtos ativos; usuário autenticado lê apenas sua própria associação administrativa. Pedidos/dados pessoais e mutações SQL são acessíveis exclusivamente pelo servidor com service_role. Nenhuma credencial privilegiada é enviada ao navegador. Paginação visual do painel mostra os últimos 200 pedidos; indicadores SQL abrangem todos os pedidos.

## Vercel

Importe o repositório e defina **Root Directory = mega-mix**, framework Next.js e as três variáveis acima. Use `npm run build`, padrão do Next.js. A configuração Vercel na raiz pertence ao sistema Python e não deve ser usada para este app. Não é necessário domínio ou pagamento externo para a demonstração. Cadastre a URL publicada nas configurações de URL do Supabase Auth. Não publique `.env.local`.

## Verificações

```powershell
npm run typecheck
npm run build
npm test
```

`tests/database.sql` valida atomicidade, idempotência, cancelamento, totais e permissões num PostgreSQL de teste compatível com Supabase. Use apenas um banco dedicado: o teste faz rollback. `tests/browser.cjs` verifica prévia, carrinho, busca e larguras mobile/desktop com Playwright instalado na raiz. Sem credenciais Supabase, a integração remota permanece pendente de validação. Imagens ilustrativas externas Unsplash têm fallback textual quando indisponíveis.

Neste repositório, o executor `.venv/Scripts/python.exe mega-mix/tests/database_runner.py` (a partir da raiz) cria um banco local descartável, instala a migração com um stub do schema `auth`, testa inclusive concorrência real e remove esse banco. Usa exclusivamente o cluster local configurado no sistema existente; não substitui validação do Supabase Auth/PostgREST remoto. Para o navegador, na pasta `mega-mix`, defina `PLAYWRIGHT_BROWSERS_PATH` apontando para `../.local/pw-browser` e execute `node tests/browser.cjs` com a loja em execução sem credenciais. Origens de imagens ilustrativas em `docs/images.md`.
