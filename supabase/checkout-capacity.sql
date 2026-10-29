-- Permite comprar o catalogo ampliado na mesma transacao.
begin;
create or replace function public.place_order(p_key uuid,p_name text,p_contact text,p_items jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_req jsonb; v_existing orders%rowtype; v_id uuid:=gen_random_uuid(); v_number bigint; v_total numeric(12,2):=0; r record; p products%rowtype;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 64 or length(trim(p_name)) not between 2 and 100 or length(trim(p_contact)) not between 8 and 120 then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x where jsonb_typeof(x->'quantity')<>'number' or (x->>'quantity') !~ '^[0-9]{1,2}$' or (x->>'quantity')::int not between 1 and 99 or x->>'id' is null) then raise exception 'INVALID_INPUT'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) then raise exception 'INVALID_INPUT'; end if;
 select jsonb_build_object('name',p_name,'contact',p_contact,'items',jsonb_agg(x order by x->>'id')) into v_req from jsonb_array_elements(p_items) x;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into v_existing from orders where idempotency_key=p_key;
 if found then
   if v_existing.request<>v_req then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   return jsonb_build_object('number',v_existing.number,'total',v_existing.total::text);
 end if;
 -- Ordem estável de bloqueios evita deadlocks entre carrinhos concorrentes.
 for r in select (x->>'id')::uuid as id,(x->>'quantity')::int as quantity from jsonb_array_elements(p_items) x order by (x->>'id')::uuid loop
   select * into p from products where id=r.id for update;
   if not found or not p.active or p.stock<r.quantity then raise exception 'INSUFFICIENT_STOCK'; end if;
   v_total:=v_total+p.price*r.quantity;
 end loop;
 insert into orders(id,idempotency_key,request,customer_name,contact,total) values(v_id,p_key,v_req,p_name,p_contact,v_total) returning number into v_number;
 for r in select (x->>'id')::uuid as id,(x->>'quantity')::int as quantity from jsonb_array_elements(p_items) x loop
   select * into p from products where id=r.id;
   insert into order_items values(v_id,p.id,p.name,r.quantity,p.price);
   update products set stock=stock-r.quantity where id=r.id;
 end loop;
 return jsonb_build_object('number',v_number,'total',v_total::text);
end $$;
commit;
