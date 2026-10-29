# Publicação

- Loja: https://mega-mix-neon.vercel.app
- Painel: https://mega-mix-neon.vercel.app/admin
- Primeiro cadastro: https://mega-mix-neon.vercel.app/admin/criar-conta
- Vercel: projeto `mega-mix`, ID `prj_zuYTDFbnd57rwZfrXDG7HdBVWOMV`, região `gru1`.
- Supabase: projeto `Mega Mix`, referência `mpeqsywfoajsvchzahnb`, São Paulo. Migrações `mega_mix_initial` e `first_admin_registration` aplicadas.
- Chave privilegiada e ativação inicial configuradas como Secrets somente em produção; valores não estão no repositório.
- Código de ativação entregue em arquivo local ignorado pelo Git: `test-results/ativacao-administrador.txt`. Não o publique. Cadastro encerra após a primeira conta.
- Loja pública; painel exige autenticação e associação administrativa no servidor.
- Publicação feita pela API Vercel com arquivos locais. Alterações locais não disparam redeploy automático por Git.
- Academia AGS & Fitness foi pausada no Supabase por escolha explícita do usuário, para liberar o limite gratuito. Seu site fica sem o banco até reativação.

Verificações na URL pública: 24 produtos vindos do Supabase, compra simulada persistida (pedido #3), repetição idempotente, baixa única, bloqueio do painel sem autenticação (401) e bloqueio de Origin externo (403). Pedido de teste cancelado duas vezes com uma única devolução ao estoque. O registro permanece cancelado e não entra no faturamento.

Catálogo ampliado a pedido do usuário para 36 produtos (seis por categoria), com 12 novos itens. `supabase/expand-catalog.sql` insere apenas os novos cadastros, sem redefinir estoques existentes. `expanded_catalog_checkout_capacity` amplia o checkout para até 64 produtos distintos, preservando bloqueios e idempotência. Novas instalações usam `schema.sql` e `seed.sql` já atualizados.
