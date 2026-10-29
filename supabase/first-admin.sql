-- Migração complementar: habilita a criação controlada do primeiro administrador.
begin;
create or replace function public.claim_first_administrator(p_user uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('mega-mix:first-administrator',0));
  if exists(select 1 from public.administrators) then raise exception 'REGISTRATION_CLOSED'; end if;
  insert into public.administrators(user_id) values(p_user);
end $$;
revoke all on function public.claim_first_administrator(uuid) from public,anon,authenticated;
grant execute on function public.claim_first_administrator(uuid) to service_role;
commit;
