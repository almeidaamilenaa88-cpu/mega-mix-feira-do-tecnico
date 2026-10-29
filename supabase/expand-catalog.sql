-- Produtos demonstrativos; preserva cadastros e saldos existentes.
begin;
insert into public.products(id,name,category,unit,price,old_price,stock,min_stock,image,active) values
('00000000-0000-4000-8000-000000000025','Morango fresco','Hortifruti','bandeja 250 g','8.99','10.99',24,5,'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000026','Laranja-pera','Hortifruti','pacote 1 kg','5.49',null,35,5,'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000027','Açúcar refinado','Mercearia','pacote 1 kg','4.79',null,45,5,'https://down-br.img.susercontent.com/file/sg-11134201-23020-5jl554el47mve2',true),
('00000000-0000-4000-8000-000000000028','Óleo de soja','Mercearia','garrafa 900 mL','7.49','8.99',38,5,'https://covabra.vtexassets.com/arquivos/ids/544734-800-450?aspect=true&height=450&width=800',true),
('00000000-0000-4000-8000-000000000029','Água mineral com gás','Bebidas','garrafa 500 mL','2.99',null,50,5,'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000030','Chá gelado de limão','Bebidas','garrafa 1 L','6.99',null,22,5,'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000031','Leite desnatado','Laticínios','caixa 1 L','4.59',null,30,5,'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000032','Queijo minas frescal','Laticínios','peça 300 g','14.90','17.90',16,5,'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000033','Papel-toalha folha dupla','Limpeza','pacote 2 rolos','6.49',null,28,5,'https://bretas.vtexassets.com/arquivos/ids/218387/6675b79e48a079339b1d4490.jpg',true),
('00000000-0000-4000-8000-000000000034','Desinfetante pinho','Limpeza','frasco 500 mL','5.99','7.49',32,5,'https://paulistaoatacadista.vtexassets.com/arquivos/ids/292740/DesinfetanteUrcaPinho500ml1.jpg',true),
('00000000-0000-4000-8000-000000000035','Pão de centeio','Padaria','unidade 400 g','10.90',null,15,5,'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',true),
('00000000-0000-4000-8000-000000000036','Mini croissants','Padaria','pacote 4 un.','12.90','15.90',18,5,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80',true)
on conflict(id) do nothing;
commit;
