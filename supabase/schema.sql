-- Mega Mix: aplicação independente, de uma única loja demonstrativa.
-- Executar uma vez no SQL Editor, antes de seed.sql. Transações são indivisíveis.
begin;
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100),
 category text not null check(category in ('Hortifruti','Mercearia','Bebidas','Laticínios','Limpeza','Padaria')),
 unit text not null, price numeric(12,2) not null check(price>0), old_price numeric(12,2) check(old_price>price),
 stock integer not null default 0 check(stock>=0), min_stock integer not null default 5 check(min_stock>=0),
 image text not null, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.administrators(user_id uuid primary key references auth.users(id) on delete cascade, active boolean not null default true);
create table public.orders(
 id uuid primary key default gen_random_uuid(), number bigint generated always as identity unique,
 idempotency_key uuid not null unique, request jsonb not null,
 customer_name text not null check(length(customer_name) between 2 and 100), contact text not null check(length(contact) between 8 and 120),
 status text not null default 'pending' check(status in ('pending','preparing','completed','cancelled')),
 total numeric(12,2) not null check(total>0), payment_method text not null default 'simulated' check(payment_method='simulated'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items(
 order_id uuid not null references public.orders(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict,
 name text not null, quantity integer not null check(quantity between 1 and 99),
 unit_price numeric(12,2) not null check(unit_price>0), primary key(order_id,product_id)
);
create index products_catalog on public.products(category,name) where active;
create index orders_status_created on public.orders(status,created_at desc);
create index order_items_product on public.order_items(product_id);
alter table public.products enable row level security;
alter table public.administrators enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.products,public.administrators,public.orders,public.order_items from anon,authenticated;
grant select on public.products to anon,authenticated;
grant select on public.administrators to authenticated;
create policy catalog_read on public.products for select to anon,authenticated using(active);
create policy own_administrator on public.administrators for select to authenticated using(user_id=(select auth.uid()) and active);
grant all on public.products,public.administrators,public.orders,public.order_items to service_role;
grant usage,select on sequence public.orders_number_seq to service_role;

-- Apenas backend com service_role. SECURITY INVOKER evita escalada via função.
create function public.place_order(p_key uuid,p_name text,p_contact text,p_items jsonb) returns jsonb
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

create function public.change_order_status(p_id uuid,p_status text) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_status text; r record;
begin
 select status into current_status from orders where id=p_id for update;
 if not found then raise exception 'INVALID_STATE'; end if;
 if current_status=p_status then return; end if;
 if not ((current_status='pending' and p_status in ('preparing','cancelled')) or (current_status='preparing' and p_status in ('completed','cancelled'))) then raise exception 'INVALID_STATE'; end if;
 if p_status='cancelled' then
   for r in select product_id,quantity from order_items where order_id=p_id order by product_id loop
     update products set stock=stock+r.quantity where id=r.product_id;
   end loop;
 end if;
 update orders set status=p_status,updated_at=now() where id=p_id;
end $$;

create function public.save_product(p_id uuid,p_name text,p_category text,p_unit text,p_price numeric,p_stock integer,p_min_stock integer,p_image text,p_expected_stock integer) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare actual integer;
begin
 if p_id is null then
   insert into products(name,category,unit,price,stock,min_stock,image) values(p_name,p_category,p_unit,p_price,p_stock,p_min_stock,p_image);
 else
   select stock into actual from products where id=p_id for update;
   if not found or p_expected_stock is null or actual<>p_expected_stock then raise exception 'STOCK_CONFLICT'; end if;
   update products set name=p_name,category=p_category,unit=p_unit,price=p_price,old_price=null,stock=p_stock,min_stock=p_min_stock,image=p_image where id=p_id;
 end if;
end $$;

create function public.dashboard_metrics() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('revenue',coalesce((select sum(total) from orders where status='completed'),0)::text,'orders',(select count(*) from orders),'units',coalesce((select sum(i.quantity) from order_items i join orders o on o.id=i.order_id where o.status='completed'),0),'low_stock',(select count(*) from products where active and stock<=min_stock));
$$;
revoke all on function public.place_order(uuid,text,text,jsonb),public.change_order_status(uuid,text),public.save_product(uuid,text,text,text,numeric,integer,integer,text,integer),public.dashboard_metrics() from public,anon,authenticated;
grant execute on function public.place_order(uuid,text,text,jsonb),public.change_order_status(uuid,text),public.save_product(uuid,text,text,text,numeric,integer,integer,text,integer),public.dashboard_metrics() to service_role;
commit;
