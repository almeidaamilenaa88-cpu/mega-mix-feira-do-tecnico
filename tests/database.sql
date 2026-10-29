begin;
do $$
declare p uuid; q uuid; order_id uuid; result jsonb; retry jsonb; before_stock integer; before_q integer;
begin
 select id,stock into p,before_stock from products order by id limit 1;
 select id,stock into q,before_q from products where id<>p order by id limit 1;
 result:=place_order('10000000-0000-4000-8000-000000000001','Cliente Teste','teste@example.test',jsonb_build_array(jsonb_build_object('id',p,'quantity',2)));
 retry:=place_order('10000000-0000-4000-8000-000000000001','Cliente Teste','teste@example.test',jsonb_build_array(jsonb_build_object('id',p,'quantity',2)));
 assert result=retry,'retry deve retornar o mesmo pedido';
 assert (select stock from products where id=p)=before_stock-2,'baixa duplicada';
 assert (result->>'total')::numeric=(select price*2 from products where id=p),'total incorreto';
 begin
   perform place_order('10000000-0000-4000-8000-000000000001','Outro Cliente','teste@example.test',jsonb_build_array(jsonb_build_object('id',p,'quantity',2)));
   raise exception 'conflito deveria falhar';
 exception when others then if sqlerrm not like '%IDEMPOTENCY_CONFLICT%' then raise; end if; end;
 update products set stock=0 where id=q;
 begin
   perform place_order('10000000-0000-4000-8000-000000000002','Cliente Teste','teste@example.test',jsonb_build_array(jsonb_build_object('id',p,'quantity',1),jsonb_build_object('id',q,'quantity',1)));
   raise exception 'falta de estoque deveria falhar';
 exception when others then if sqlerrm not like '%INSUFFICIENT_STOCK%' then raise; end if; end;
 assert (select stock from products where id=p)=before_stock-2,'compra parcial alterou estoque';
 assert not exists(select 1 from orders where idempotency_key='10000000-0000-4000-8000-000000000002'),'pedido parcial persistido';
 select id into order_id from orders where idempotency_key='10000000-0000-4000-8000-000000000001';
 perform change_order_status(order_id,'cancelled');perform change_order_status(order_id,'cancelled');
 assert (select stock from products where id=p)=before_stock,'cancelamento devolveu duas vezes';
 begin
   perform change_order_status(order_id,'completed');raise exception 'estado final deveria falhar';
 exception when others then if sqlerrm not like '%INVALID_STATE%' then raise; end if; end;
 begin
   perform save_product(p,'Produto teste','Hortifruti','unidade',10,50,5,'https://example.test/image',before_stock-1);
   raise exception 'estoque desatualizado deveria falhar';
 exception when others then if sqlerrm not like '%STOCK_CONFLICT%' then raise; end if; end;
 assert not has_function_privilege('anon','place_order(uuid,text,text,jsonb)','execute'),'anon executa checkout';
 assert not has_function_privilege('authenticated','change_order_status(uuid,text)','execute'),'usuário executa status';
 assert not has_table_privilege('anon','orders','select'),'público lê clientes';
 assert not has_table_privilege('authenticated','products','update'),'usuário altera produtos';
 assert (select count(*) from pg_class where oid in ('products'::regclass,'orders'::regclass,'order_items'::regclass,'administrators'::regclass) and relrowsecurity)=4,'RLS ausente';
 -- Receita apenas após concluir.
 assert (dashboard_metrics()->>'revenue')::numeric=0,'cancelamento entrou no faturamento';
 result:=place_order('10000000-0000-4000-8000-000000000003','Cliente Concluído','teste@example.test',jsonb_build_array(jsonb_build_object('id',p,'quantity',1)));
 select id into order_id from orders where idempotency_key='10000000-0000-4000-8000-000000000003';
 perform change_order_status(order_id,'preparing');perform change_order_status(order_id,'completed');
 assert (dashboard_metrics()->>'revenue')::numeric=(result->>'total')::numeric,'receita não corresponde a concluídos';
 assert (dashboard_metrics()->>'units')::integer=1,'unidades incorretas';
end $$;
rollback;
