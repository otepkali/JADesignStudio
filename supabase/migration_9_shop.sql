-- Migration 9: Shop — hardware catalog, warehouse and sales tracking.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  product_group text not null,
  size text not null,
  category text not null check (category in ('Ассортимент', 'Под заказ')),
  image text not null,
  cost_price_kzt numeric not null,
  list_price_kzt numeric not null,
  margin_amount_kzt numeric not null,
  margin_percent numeric not null,
  stock_qty integer not null default 0,
  available_on_order boolean not null default false,
  created_at timestamptz default now()
);

create unique index if not exists products_sku_unique on products (sku);

-- Append-only sale history — never overwritten, only inserted into.
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  quantity integer not null,
  unit_price_kzt numeric not null,
  cost_price_kzt numeric not null,
  full_margin_amount_kzt numeric not null,
  actual_margin_kzt numeric not null,
  margin_diff_kzt numeric not null,
  sold_at date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists sales_product_id_idx on sales(product_id);
create index if not exists sales_sold_at_idx on sales(sold_at);

alter table products enable row level security;
alter table sales enable row level security;

-- Products are shown on the public catalog page, so anyone can read them —
-- writes (admin/warehouse edits) still require a signed-in user.
drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products
  for select using (true);

drop policy if exists "products_authenticated_write" on products;
create policy "products_authenticated_write" on products
  for insert with check (auth.uid() is not null);

drop policy if exists "products_authenticated_update" on products;
create policy "products_authenticated_update" on products
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "products_authenticated_delete" on products;
create policy "products_authenticated_delete" on products
  for delete using (auth.uid() is not null);

-- Sales history is only for the admin/warehouse view, not public.
drop policy if exists "sales_authenticated_all" on sales;
create policy "sales_authenticated_all" on sales
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Seed the 44 products from data/products.json (one-time; skipped on re-run).
insert into products (
  sku, name, product_group, size, category, image,
  cost_price_kzt, list_price_kzt, margin_amount_kzt, margin_percent, stock_qty, available_on_order
) values
  ('KY-3-06', 'Штанга потолочная, кожа 500 мм', 'Штанга потолочная, кожа', '500 мм', 'Ассортимент', 'rod_oval.jpg', 7066, 11300, 3895, 34.5, 4, false),
  ('KY-3-07', 'Штанга потолочная, кожа 600 мм', 'Штанга потолочная, кожа', '600 мм', 'Ассортимент', 'rod_oval.jpg', 7687, 12300, 4244, 34.5, 4, false),
  ('KY-3-08', 'Штанга потолочная, кожа 700 мм', 'Штанга потолочная, кожа', '700 мм', 'Ассортимент', 'rod_oval.jpg', 8131, 13000, 4479, 34.5, 4, false),
  ('KY-3-09', 'Штанга потолочная, кожа 800 мм', 'Штанга потолочная, кожа', '800 мм', 'Ассортимент', 'rod_oval.jpg', 8947, 14300, 4924, 34.4, 4, false),
  ('KY-3-10', 'Штанга потолочная, кожа 900 мм', 'Штанга потолочная, кожа', '900 мм', 'Ассортимент', 'rod_oval.jpg', 9391, 15000, 5159, 34.4, 4, false),
  ('KY-3-12', 'Штанга потолочная, кожа 1100 мм', 'Штанга потолочная, кожа', '1100 мм', 'Ассортимент', 'rod_oval.jpg', 10279, 16400, 5629, 34.3, 4, false),
  ('KY-5-06', 'Штанга потолочная, металл квадратная 500 мм', 'Штанга потолочная, металл квадратная', '500 мм', 'Ассортимент', 'rod_square.png', 8841, 14100, 4836, 34.3, 4, false),
  ('KY-5-07', 'Штанга потолочная, металл квадратная 600 мм', 'Штанга потолочная, металл квадратная', '600 мм', 'Ассортимент', 'rod_square.png', 9462, 15100, 5185, 34.3, 4, false),
  ('KY-5-08', 'Штанга потолочная, металл квадратная 700 мм', 'Штанга потолочная, металл квадратная', '700 мм', 'Ассортимент', 'rod_square.png', 9906, 15800, 5420, 34.3, 4, false),
  ('KY-5-09', 'Штанга потолочная, металл квадратная 800 мм', 'Штанга потолочная, металл квадратная', '800 мм', 'Ассортимент', 'rod_square.png', 10722, 17200, 5962, 34.7, 4, false),
  ('KY-5-10', 'Штанга потолочная, металл квадратная 900 мм', 'Штанга потолочная, металл квадратная', '900 мм', 'Ассортимент', 'rod_square.png', 11166, 17900, 6197, 34.6, 4, false),
  ('KY-5-12', 'Штанга потолочная, металл квадратная 1100 мм', 'Штанга потолочная, металл квадратная', '1100 мм', 'Ассортимент', 'rod_square.png', 12054, 19300, 6667, 34.5, 4, false),
  ('KY-6-06', 'Штанга потолочная, кожа плетёная круглая 500 мм', 'Штанга потолочная, кожа плетёная круглая', '500 мм', 'Ассортимент', 'rod_round.png', 8841, 14100, 4836, 34.3, 4, false),
  ('KY-6-07', 'Штанга потолочная, кожа плетёная круглая 600 мм', 'Штанга потолочная, кожа плетёная круглая', '600 мм', 'Ассортимент', 'rod_round.png', 9462, 15100, 5185, 34.3, 4, false),
  ('KY-6-08', 'Штанга потолочная, кожа плетёная круглая 700 мм', 'Штанга потолочная, кожа плетёная круглая', '700 мм', 'Ассортимент', 'rod_round.png', 9906, 15800, 5420, 34.3, 4, false),
  ('KY-6-09', 'Штанга потолочная, кожа плетёная круглая 800 мм', 'Штанга потолочная, кожа плетёная круглая', '800 мм', 'Ассортимент', 'rod_round.png', 10722, 17200, 5962, 34.7, 4, false),
  ('KY-6-10', 'Штанга потолочная, кожа плетёная круглая 900 мм', 'Штанга потолочная, кожа плетёная круглая', '900 мм', 'Ассортимент', 'rod_round.png', 11166, 17900, 6197, 34.6, 4, false),
  ('KY-6-12', 'Штанга потолочная, кожа плетёная круглая 1100 мм', 'Штанга потолочная, кожа плетёная круглая', '1100 мм', 'Ассортимент', 'rod_round.png', 12054, 19300, 6667, 34.5, 4, false),
  ('TL-3-06', 'Полка с подсветкой 564×492×36 мм', 'Полка с подсветкой', '564×492×36 мм', 'Ассортимент', 'shelf_light.jpg', 33418, 53500, 18477, 34.5, 4, false),
  ('TL-3-09', 'Полка с подсветкой 864×492×36 мм', 'Полка с подсветкой', '864×492×36 мм', 'Ассортимент', 'shelf_light.jpg', 38871, 62200, 21463, 34.5, 4, false),
  ('TL-6-06', 'Плоская корзина 564×492×106 мм', 'Плоская корзина', '564×492×106 мм', 'Ассортимент', 'flat_basket.jpg', 51042, 81700, 28207, 34.5, 4, false),
  ('TL-6-09', 'Плоская корзина 864×492×106 мм', 'Плоская корзина', '864×492×106 мм', 'Ассортимент', 'flat_basket.jpg', 64674, 103500, 35721, 34.5, 4, false),
  ('TL-7-06', 'Шкатулка-сундук 564×492×106 мм', 'Шкатулка-сундук', '564×492×106 мм', 'Ассортимент', 'jewelry_box_tl7.jpg', 66669, 106700, 36830, 34.5, 4, false),
  ('TL-7-09', 'Шкатулка-сундук 864×492×106 мм', 'Шкатулка-сундук', '864×492×106 мм', 'Ассортимент', 'jewelry_box_tl7.jpg', 78970, 126400, 43638, 34.5, 4, false),
  ('TL-8-06', 'Выдвижная стойка для брюк 564×492×106 мм', 'Выдвижная стойка для брюк', '564×492×106 мм', 'Ассортимент', 'trousers_rack.jpg', 59130, 94600, 32632, 34.5, 4, false),
  ('TL-8-09', 'Выдвижная стойка для брюк 864×492×106 мм', 'Выдвижная стойка для брюк', '864×492×106 мм', 'Ассортимент', 'trousers_rack.jpg', 73650, 117800, 40616, 34.5, 4, false),
  ('TL-10-06', 'Разделительный лоток 564×492×106 мм', 'Разделительный лоток', '564×492×106 мм', 'Ассортимент', 'dividing_box.jpg', 50187, 80300, 27704, 34.5, 4, false),
  ('TL-10-09', 'Разделительный лоток 864×492×106 мм', 'Разделительный лоток', '864×492×106 мм', 'Ассортимент', 'dividing_box.jpg', 62489, 100000, 34511, 34.5, 4, false),
  ('TL-13-06', 'Корзина для белья 564×492×185 мм', 'Корзина для белья', '564×492×185 мм', 'Ассортимент', 'underwear_basket.jpg', 63603, 101800, 35143, 34.5, 4, false),
  ('TL-13-09', 'Корзина для белья 864×492×185 мм', 'Корзина для белья', '864×492×185 мм', 'Ассортимент', 'underwear_basket.jpg', 75904, 121400, 41854, 34.5, 4, false),
  ('TL-14-06', 'Кожаная корзина 564×492×265 мм', 'Кожаная корзина', '564×492×265 мм', 'Ассортимент', 'leather_basket.jpg', 63111, 101000, 34859, 34.5, 4, false),
  ('TL-14-09', 'Кожаная корзина 864×492×265 мм', 'Кожаная корзина', '864×492×265 мм', 'Ассортимент', 'leather_basket.jpg', 75394, 120600, 41588, 34.5, 4, false),
  ('TL-15-06', 'Шкатулка для украшений 564×492×106 мм', 'Шкатулка для украшений', '564×492×106 мм', 'Ассортимент', 'jewelry_box_tl15.jpg', 64473, 103200, 35631, 34.5, 4, false),
  ('TL-15-09', 'Шкатулка для украшений 864×492×106 мм', 'Шкатулка для украшений', '864×492×106 мм', 'Ассортимент', 'jewelry_box_tl15.jpg', 76720, 122800, 42396, 34.5, 4, false),
  ('F-10-12A', 'Вращающаяся стойка для обуви 360°', 'Вращающаяся стойка для обуви 360°', '730×350×1910–2185 мм', 'Под заказ', 'shoe_rack_360.jpg', 189930, 246900, 49563, 20.1, 0, true),
  ('F-18-12', 'Боковая вращающаяся стойка для обуви', 'Боковая вращающаяся стойка для обуви', '500×350×1910–2185 мм', 'Под заказ', 'shoe_rack_side.jpg', 150809, 196100, 39408, 20.1, 0, true),
  ('BC-13', 'Кожаная дверь, алюминиевая кромка', 'Кожаная дверь, алюминиевая кромка', '450×25×2900 мм', 'Под заказ', 'door_bc13.jpg', 101374, 131800, 26472, 20.1, 0, true),
  ('BC-7-multi', 'Кожаная дверь плоская (неск. цветов)', 'Кожаная дверь плоская (неск. цветов)', '450×25×2700 мм', 'Под заказ', 'door_bc7_multi.jpg', 62580, 81400, 16378, 20.1, 0, true),
  ('BC-7-antelope', 'Кожаная дверь плоская (антилопа)', 'Кожаная дверь плоская (антилопа)', '450×25×2700 мм', 'Под заказ', 'door_bc7_multi.jpg', 64133, 83400, 16765, 20.1, 0, true),
  ('H-33', 'Ручка полукруглая №33', 'Ручка полукруглая №33', '219 мм', 'Под заказ', 'handle_33.jpg', 4522, 5900, 1201, 20.4, 0, true),
  ('H-26', 'Ручка №26', 'Ручка №26', '180 мм', 'Под заказ', 'handle_26.jpg', 3015, 3900, 768, 19.7, 0, true),
  ('H-34', 'Ручка №34', 'Ручка №34', '180 мм', 'Под заказ', 'handle_34.jpg', 4522, 5900, 1201, 20.4, 0, true),
  ('H-27', 'Ручка №27', 'Ручка №27', '184 мм', 'Под заказ', 'handle_27.jpg', 3725, 4800, 931, 19.4, 0, true),
  ('H-S8439', 'Малая ручка S-8439', 'Малая ручка S-8439', '30 мм', 'Под заказ', 'handle_small.jpg', 2884, 3700, 705, 19.1, 0, true)
on conflict (sku) do nothing;
