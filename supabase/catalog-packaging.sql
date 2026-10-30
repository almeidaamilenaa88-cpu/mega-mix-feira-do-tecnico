-- Atualiza imagens do catálogo sem alterar preços, estoque ou pedidos.
begin;
update public.products set image = case id
  when '00000000-0000-4000-8000-000000000005' then 'https://mercantilnovaera.vteximg.com.br/arquivos/ids/14973/arroz-tio-joao-5kg.jpg'
  when '00000000-0000-4000-8000-000000000007' then 'https://mambodelivery.vtexassets.com/arquivos/ids/197781/Macarrao-C-Ovos-Argola-Adria-500g.jpg?v=638334060732330000'
  when '00000000-0000-4000-8000-000000000008' then 'https://assets.ibecom.com.br/ib.item.image.large/l-5a70403098f547eab97139cea26ff972.jpeg'
  when '00000000-0000-4000-8000-000000000011' then 'https://mercantilnovaera.vteximg.com.br/arquivos/ids/206256-1000-1000/Refrigerante-COCA-COLA-Garrafa-2L.jpg?v=638174197589100000'
  when '00000000-0000-4000-8000-000000000017' then 'https://images.tcdn.com.br/img/img_prod/767437/detergente_ype_neutro_500ml_1035_1_20200331174744.jpg'
  else image end
where id in (
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000017'
);
commit;
