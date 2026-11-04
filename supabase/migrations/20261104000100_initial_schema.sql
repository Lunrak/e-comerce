create extension if not exists pgcrypto with schema extensions;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.businesses (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Hansel Rodriguez')
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id),
  full_name text not null,
  role text not null check (role in ('admin', 'cashier')),
  created_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.menu_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  category_id uuid not null references public.menu_categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  discount_price numeric(12, 2) check (discount_price is null or (discount_price >= 0 and discount_price < price)),
  image_url text,
  is_visible boolean not null default true,
  track_stock boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  modifiers jsonb not null default '[]'::jsonb check (jsonb_typeof(modifiers) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null,
  opened_by uuid not null references auth.users(id),
  closed_by uuid references auth.users(id),
  opening_amount numeric(12, 2) not null check (opening_amount >= 0),
  cash_collected numeric(12, 2) not null default 0 check (cash_collected >= 0),
  closing_amount numeric(12, 2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  check (closed_at is null or closing_amount is not null)
);

create unique index if not exists one_open_cash_per_business
  on public.cash_sessions (business_id) where closed_at is null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  cash_session_id uuid not null references public.cash_sessions(id),
  created_by uuid not null references auth.users(id),
  customer_name text,
  order_type text not null check (order_type in ('LOCAL', 'DELIVERY', 'TABLE')),
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_PROGRESS', 'PAID', 'CANCELLED')),
  payment_method text check (payment_method is null or payment_method in ('CASH', 'CARD', 'TRANSFER')),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check ((status = 'PAID') = (paid_at is not null))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.menu_products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  modifiers jsonb not null default '[]'::jsonb,
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  cash_session_id uuid not null references public.cash_sessions(id),
  order_id uuid not null unique references public.orders(id),
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method = 'CASH'),
  created_at timestamptz not null default now()
);

create index if not exists orders_business_created_idx on public.orders (business_id, created_at desc);
create index if not exists orders_business_paid_idx on public.orders (business_id, paid_at desc) where status = 'PAID';
create index if not exists products_business_category_idx on public.menu_products (business_id, category_id);
create index if not exists cash_movements_session_created_idx on public.cash_movements (cash_session_id, created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_categories'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_categories';
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'menu_products'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_products';
    end if;
  end if;
end;
$$;

create or replace function public.assign_menu_business()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and public.current_user_role() is distinct from 'admin' then
    raise exception 'Solo un administrador puede modificar el menú.';
  end if;
  new.business_id := coalesce(public.current_business_id(), new.business_id);
  if tg_table_name = 'menu_products' and not exists (
    select 1 from public.menu_categories c
    where c.id = new.category_id and c.business_id = new.business_id
  ) then
    raise exception 'La categoría no pertenece al negocio actual.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger assign_category_business
  before insert or update on public.menu_categories
  for each row execute function public.assign_menu_business();
create trigger assign_product_business
  before insert or update on public.menu_products
  for each row execute function public.assign_menu_business();

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select business_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_products enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cash_movements enable row level security;

grant select on public.businesses, public.profiles, public.menu_categories, public.menu_products, public.cash_sessions, public.orders, public.order_items, public.cash_movements to authenticated;
grant insert, update, delete on public.menu_categories, public.menu_products to authenticated;

create policy "business members can read their business"
  on public.businesses for select to authenticated
  using (id = (select public.current_business_id()));

create policy "users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_user_role()) = 'admin' and business_id = (select public.current_business_id()));

create policy "business members can read menu categories"
  on public.menu_categories for select to authenticated
  using (business_id = (select public.current_business_id()));
create policy "admins manage menu categories"
  on public.menu_categories for all to authenticated
  using (business_id = (select public.current_business_id()) and (select public.current_user_role()) = 'admin')
  with check (business_id = (select public.current_business_id()) and (select public.current_user_role()) = 'admin');

create policy "business members can read products"
  on public.menu_products for select to authenticated
  using (business_id = (select public.current_business_id()));
create policy "admins manage products and prices"
  on public.menu_products for all to authenticated
  using (business_id = (select public.current_business_id()) and (select public.current_user_role()) = 'admin')
  with check (business_id = (select public.current_business_id()) and (select public.current_user_role()) = 'admin');

create policy "business members can read cash sessions"
  on public.cash_sessions for select to authenticated
  using (business_id = (select public.current_business_id()));
create policy "business members can read orders"
  on public.orders for select to authenticated
  using (business_id = (select public.current_business_id()));
create policy "business members can read order items"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.business_id = (select public.current_business_id())));
create policy "business members can read cash movements"
  on public.cash_movements for select to authenticated
  using (business_id = (select public.current_business_id()));

create or replace function public.open_cash_session(p_name text, p_initial_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_session_id uuid;
begin
  if auth.uid() is null or v_business_id is null then raise exception 'Perfil sin negocio asociado.'; end if;
  if public.current_user_role() not in ('admin', 'cashier') then raise exception 'Rol sin permiso para abrir caja.'; end if;
  if nullif(trim(p_name), '') is null or p_initial_amount is null or p_initial_amount < 0 then raise exception 'Nombre o monto inicial inválido.'; end if;
  if exists (select 1 from public.cash_sessions where business_id = v_business_id and closed_at is null) then raise exception 'Ya existe una caja abierta.'; end if;

  insert into public.cash_sessions (business_id, name, opened_by, opening_amount)
  values (v_business_id, trim(p_name), auth.uid(), p_initial_amount)
  returning id into v_session_id;
  return v_session_id;
end;
$$;

create or replace function public.create_order(p_order_type text, p_customer_name text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_cash_session_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_modifier jsonb;
  v_product public.menu_products%rowtype;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_modifier_total numeric(12, 2);
  v_line_total numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_selected_modifiers jsonb;
  v_valid_modifiers jsonb;
  v_option jsonb;
begin
  if auth.uid() is null or v_business_id is null then raise exception 'Inicia sesión para crear pedidos.'; end if;
  if public.current_user_role() not in ('admin', 'cashier') then raise exception 'Rol sin permiso para vender.'; end if;
  if p_order_type not in ('LOCAL', 'DELIVERY', 'TABLE') then raise exception 'Tipo de pedido inválido.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'El pedido necesita productos.'; end if;

  select id into v_cash_session_id
  from public.cash_sessions
  where business_id = v_business_id and closed_at is null
  for update;
  if v_cash_session_id is null then raise exception 'Abre caja y declara el monto inicial antes de vender.'; end if;

  insert into public.orders (business_id, cash_session_id, created_by, customer_name, order_type)
  values (v_business_id, v_cash_session_id, auth.uid(), nullif(trim(p_customer_name), ''), p_order_type)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity < 1 then raise exception 'Cantidad inválida.'; end if;

    select p.* into v_product
    from public.menu_products p
    join public.menu_categories c on c.id = p.category_id
    where p.id = (v_item->>'product_id')::uuid
      and p.business_id = v_business_id
      and p.is_visible and c.is_visible;
    if not found then raise exception 'Producto no disponible.'; end if;
    if v_product.track_stock and v_product.stock_quantity < v_quantity then raise exception 'Stock insuficiente para %.', v_product.name; end if;

    v_unit_price := coalesce(v_product.discount_price, v_product.price);
    v_modifier_total := 0;
    v_selected_modifiers := coalesce(v_item->'modifiers', '[]'::jsonb);
    if jsonb_typeof(v_selected_modifiers) <> 'array' then raise exception 'Modificadores inválidos.'; end if;
    if exists (
      select 1
      from jsonb_array_elements(v_selected_modifiers) selected(value)
      group by selected.value->>'id'
      having count(*) > 1
    ) then raise exception 'No se puede repetir un modificador.'; end if;
    v_valid_modifiers := '[]'::jsonb;
    for v_modifier in select value from jsonb_array_elements(v_selected_modifiers) loop
      select option_row.value into v_option
      from jsonb_array_elements(v_product.modifiers) as group_row(value)
      cross join jsonb_array_elements(group_row.value->'options') as option_row(value)
      where option_row.value->>'id' = v_modifier->>'id'
      limit 1;
      if not found then raise exception 'Modificador no válido para %.', v_product.name; end if;
      v_modifier_total := v_modifier_total + coalesce((v_option->>'priceAdjustment')::numeric, 0);
      v_valid_modifiers := v_valid_modifiers || jsonb_build_array(jsonb_build_object(
        'id', v_option->>'id',
        'name', v_option->>'name',
        'priceAdjustment', coalesce((v_option->>'priceAdjustment')::numeric, 0)
      ));
    end loop;
    if exists (
      select 1
      from jsonb_array_elements(v_product.modifiers) as required_group(value)
      where coalesce((required_group.value->>'required')::boolean, false)
        and not exists (
          select 1
          from jsonb_array_elements(required_group.value->'options') as required_option(value)
          where exists (
            select 1
            from jsonb_array_elements(v_selected_modifiers) as selected_modifier(value)
            where selected_modifier.value->>'id' = required_option.value->>'id'
          )
        )
    ) then
      raise exception 'Selecciona las opciones obligatorias de %.', v_product.name;
    end if;
    v_unit_price := v_unit_price + v_modifier_total;
    v_line_total := v_unit_price * v_quantity;
    v_total := v_total + v_line_total;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, modifiers, line_total)
    values (v_order_id, v_product.id, v_product.name, v_unit_price, v_quantity, v_valid_modifiers, v_line_total);

    if v_product.track_stock then
      update public.menu_products set stock_quantity = stock_quantity - v_quantity, updated_at = now() where id = v_product.id;
    end if;
  end loop;

  update public.orders set total = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

create or replace function public.finalize_order(p_order_id uuid, p_payment_method text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null or public.current_user_role() not in ('admin', 'cashier') then raise exception 'Rol sin permiso para cobrar.'; end if;
  if p_payment_method not in ('CASH', 'CARD', 'TRANSFER') then raise exception 'Método de pago inválido.'; end if;

  select * into v_order from public.orders
  where id = p_order_id and business_id = public.current_business_id()
  for update;
  if not found or v_order.status not in ('PENDING', 'IN_PROGRESS') then raise exception 'Pedido activo no encontrado.'; end if;
  if not exists (select 1 from public.cash_sessions where id = v_order.cash_session_id and closed_at is null) then raise exception 'La caja está cerrada.'; end if;

  update public.orders
  set status = 'PAID', payment_method = p_payment_method, paid_at = now()
  where id = p_order_id;

  if p_payment_method = 'CASH' then
    insert into public.cash_movements (business_id, cash_session_id, order_id, amount, payment_method)
    values (v_order.business_id, v_order.cash_session_id, v_order.id, v_order.total, 'CASH');
    update public.cash_sessions set cash_collected = cash_collected + v_order.total where id = v_order.cash_session_id;
  end if;

  return p_order_id;
end;
$$;

create or replace function public.close_cash_session()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cash_sessions%rowtype;
begin
  select * into v_session from public.cash_sessions
  where business_id = public.current_business_id() and closed_at is null
  for update;
  if not found then raise exception 'No hay caja abierta.'; end if;
  if exists (select 1 from public.orders where cash_session_id = v_session.id and status in ('PENDING', 'IN_PROGRESS')) then
    raise exception 'Cobra o cancela los pedidos activos antes de cerrar.';
  end if;

  update public.cash_sessions
  set closed_by = auth.uid(), closed_at = now(), closing_amount = opening_amount + cash_collected
  where id = v_session.id
  returning * into v_session;

  return jsonb_build_object(
    'id', v_session.id,
    'name', v_session.name,
    'openedAt', v_session.opened_at,
    'closedAt', v_session.closed_at,
    'initialAmount', v_session.opening_amount,
    'cashCollected', v_session.cash_collected,
    'closingAmount', v_session.closing_amount
  );
end;
$$;

revoke all on function public.open_cash_session(text, numeric) from public;
revoke all on function public.create_order(text, text, jsonb) from public;
revoke all on function public.finalize_order(uuid, text) from public;
revoke all on function public.close_cash_session() from public;
grant execute on function public.open_cash_session(text, numeric) to authenticated;
grant execute on function public.create_order(text, text, jsonb) to authenticated;
grant execute on function public.finalize_order(uuid, text) to authenticated;
grant execute on function public.close_cash_session() to authenticated;
revoke all on function public.current_business_id() from public, anon;
revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_business_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;

insert into public.menu_categories (id, business_id, name, sort_order) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Destacados', 0),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Platos', 1),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Postres', 2),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'Bebidas', 3)
on conflict (id) do nothing;

insert into public.menu_products (id, business_id, category_id, name, description, price, discount_price, image_url, is_visible, track_stock, stock_quantity, modifiers) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Hamburguesa de la casa', 'Res a la parrilla, queso cheddar y salsa de la casa.', 520, 470, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=160&q=80', true, true, 18, '[{"id":"group-meat","name":"Término de la carne","required":true,"options":[{"id":"mod-medium","name":"Medio","priceAdjustment":0},{"id":"mod-well","name":"Bien cocida","priceAdjustment":0}]}]'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Pasta al pomodoro', 'Tomate rostizado, albahaca fresca y parmesano.', 390, null, null, true, false, 0, '[]'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Pizza margarita', 'Mozzarella, tomate San Marzano y albahaca.', 480, null, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=160&q=80', true, true, 7, '[]'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Cheesecake de frutos rojos', 'Porción cremosa con coulis de temporada.', 210, null, null, false, true, 4, '[]'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'Limonada de hierbabuena', 'Limón fresco, hierbabuena y hielo.', 150, null, null, true, false, 0, '[]')
on conflict (id) do nothing;
