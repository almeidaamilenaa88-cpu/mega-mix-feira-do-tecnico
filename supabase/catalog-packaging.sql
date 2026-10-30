-- Atualiza imagens do catálogo sem alterar preços, estoque ou pedidos.
begin;
update public.products set image = case id
  when '00000000-0000-4000-8000-000000000005' then 'https://paulistaoatacadista.vtexassets.com/arquivos/ids/297646/ARROZAGULHINHACAMIL5KGTIPO1.jpg?v=638080564774470000'
  when '00000000-0000-4000-8000-000000000018' then 'https://www.sondadelivery.com.br/img.aspx/sku/1318365/530/1000020253.jpg'
  when '00000000-0000-4000-8000-000000000019' then 'https://images.tcdn.com.br/img/img_prod/929266/veja_multi_uso_tradicional_500_ml_26992_1_f50cebc485d1d5e36acfb9a0431f8a23.jpg'
  when '00000000-0000-4000-8000-000000000029' then 'https://drogariasp.vteximg.com.br/arquivos/ids/527804-1000-1000/681474---agua-mineral-crystal-acqualia-com-gas-500ml.jpg?v=637787380395000000'
  when '00000000-0000-4000-8000-000000000031' then 'https://static.raizs.com.br/products/leite-desnatado-1l-piracanjuba.png'
  when '00000000-0000-4000-8000-000000000032' then 'https://bretas.vtexassets.com/arquivos/ids/218719/6675b7ef48a079339b1d4627.jpg?v=638545876347400000'
  when '00000000-0000-4000-8000-000000000035' then 'https://images.tcdn.com.br/img/img_prod/1224045/pao_tipo_alemao_de_centeio_vital_500g_4933_1_c66adc41ebe54c7a7538f03da1557b91.jpg'
  when '00000000-0000-4000-8000-000000000036' then 'https://www.paodeacucar.com/img/uploads/1/634/32989634.png'
  when '00000000-0000-4000-8000-000000000007' then 'https://mambodelivery.vtexassets.com/arquivos/ids/197781/Macarrao-C-Ovos-Argola-Adria-500g.jpg?v=638334060732330000'
  when '00000000-0000-4000-8000-000000000008' then 'https://assets.ibecom.com.br/ib.item.image.large/l-5a70403098f547eab97139cea26ff972.jpeg'
  when '00000000-0000-4000-8000-000000000011' then 'https://mercantilnovaera.vteximg.com.br/arquivos/ids/206256-1000-1000/Refrigerante-COCA-COLA-Garrafa-2L.jpg?v=638174197589100000'
  when '00000000-0000-4000-8000-000000000017' then 'https://images.tcdn.com.br/img/img_prod/767437/detergente_ype_neutro_500ml_1035_1_20200331174744.jpg'
  else image end
where id in (
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000018',
  '00000000-0000-4000-8000-000000000019',
  '00000000-0000-4000-8000-000000000029',
  '00000000-0000-4000-8000-000000000031',
  '00000000-0000-4000-8000-000000000032',
  '00000000-0000-4000-8000-000000000035',
  '00000000-0000-4000-8000-000000000036',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000017'
);
commit;
