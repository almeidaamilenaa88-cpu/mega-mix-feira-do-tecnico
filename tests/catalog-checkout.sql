begin;
do $$
declare basket jsonb; expected numeric; result jsonb; oid uuid; expected_items integer;
begin
 select jsonb_agg(jsonb_build_object('id',id,'quantity',1) order by id),sum(price),count(*) into basket,expected,expected_items from products where active and stock>0;
 assert expected_items>24,'fixture deve superar o limite antigo';
 result:=place_order('10000000-0000-4000-8000-000000000004','Teste catálogo ampliado','catalogo@example.invalid',basket);
 select id into oid from orders where idempotency_key='10000000-0000-4000-8000-000000000004';
 assert (result->>'total')::numeric=expected,'total do carrinho ampliado incorreto';
 assert (select count(*) from order_items where order_id=oid)=expected_items,'itens perdidos no carrinho ampliado';
end $$;
rollback;
