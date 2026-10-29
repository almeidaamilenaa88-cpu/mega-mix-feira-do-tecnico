"""Testa em banco novo e descartável, exclusivamente no cluster local configurado na raiz."""
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from app.core.config import settings  # noqa: E402

cfg = settings()
url = make_url(cfg.migration_database_url or cfg.database_url)
assert cfg.app_env == "local" and url.host in {"127.0.0.1", "localhost"}
name = "mega_mix_test_" + uuid4().hex[:12]
admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
base = Path(__file__).resolve().parents[1]
db = None
try:
    with admin.connect() as conn:
        # Papéis de teste sem login. Não modifica papéis existentes.
        for role in ["anon", "authenticated", "service_role"]:
            if not conn.scalar(text("select 1 from pg_roles where rolname=:r"), {"r": role}):
                conn.exec_driver_sql(f'create role "{role}" nologin')
        conn.exec_driver_sql(f'create database "{name}"')
    db = create_engine(url.set(database=name), isolation_level="AUTOCOMMIT")
    with db.connect() as conn:
        conn.exec_driver_sql("create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as 'select null::uuid';")
        for script in ["supabase/schema.sql", "supabase/first-admin.sql", "supabase/seed.sql", "tests/database.sql", "tests/catalog-checkout.sql"]:
            conn.connection.driver_connection.execute((base / script).read_text(encoding="utf-8"))
        conn.connection.driver_connection.execute("""
            begin;
            insert into auth.users(id) values('10000000-0000-4000-8000-999999999999');
            select claim_first_administrator('10000000-0000-4000-8000-999999999999');
            do $$ begin
              assert (select count(*) from administrators)=1;
              assert not has_function_privilege('anon','claim_first_administrator(uuid)','execute');
              begin
                perform claim_first_administrator('10000000-0000-4000-8000-999999999999');
                raise exception 'cadastro deveria estar encerrado';
              exception when others then
                if sqlerrm not like '%REGISTRATION_CLOSED%' then raise; end if;
              end;
            end $$;
            rollback;
        """)
        print("PASS: ativação cria somente o primeiro administrador e não permite execução pública.")
        print("PASS: atomicidade, totais, idempotência, cancelamento único, transições, edição concorrente, grants e RLS.")
        p = conn.scalar(text("select id from products order by id limit 1"))
        conn.execute(text("update products set stock=1 where id=:id"), {"id": p})
    def buy(_):
        with db.connect() as conn:
            try:
                return conn.scalar(text("select place_order(:key,'Concorrente','teste@example.test',jsonb_build_array(jsonb_build_object('id',cast(:p as text),'quantity',1)))"), {"key": uuid4(), "p": str(p)})
            except Exception as exc:
                assert "INSUFFICIENT_STOCK" in str(exc)
                return None
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(buy, range(2)))
    assert sum(result is not None for result in results) == 1
    with db.connect() as conn:
        assert conn.scalar(text("select stock from products where id=:id"), {"id": p}) == 0
        order_id = conn.scalar(text("select id from orders limit 1"))
    def cancel(_):
        with db.connect() as conn:
            conn.execute(text("select change_order_status(:id,'cancelled')"), {"id": order_id})
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(cancel, range(2)))
    with db.connect() as conn:
        assert conn.scalar(text("select stock from products where id=:id"), {"id": p}) == 1
        conn.exec_driver_sql("set role anon")
        assert conn.scalar(text("select count(*) from products")) == 36
        conn.exec_driver_sql("reset role")
    print("PASS: duas compras simultâneas da última unidade e dois cancelamentos simultâneos.")
finally:
    if db:
        db.dispose()
    with admin.connect() as conn:
        # Nome gerado aqui e nunca obtido de entrada externa.
        if conn.scalar(text("select 1 from pg_database where datname=:name"), {"name": name}):
            conn.exec_driver_sql(f'drop database "{name}" with (force)')
    admin.dispose()
