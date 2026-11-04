# Mesa Gestión

Aplicación React/Vite para administrar el menú, caja y pedidos de un restaurante. Los datos se guardan en Supabase; el borrador del carrito se conserva localmente en el navegador.

## Desarrollo

```sh
npm install
cp .env.example .env.local
# Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase

1. Crea un proyecto y copia `.env.example` a `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL y la clave pública `anon`/publishable del proyecto.
3. Ejecuta `supabase/migrations/20261104000100_initial_schema.sql` desde el SQL Editor de Supabase. La migración crea el esquema, RLS, RPCs y el menú inicial.
4. Crea cuentas desde **Authentication → Users → Add user**. No existe registro público.
5. Vincula cada usuario con el negocio desde el SQL Editor. Usa `admin` para administrador o `cashier` para cajero:

```sql
insert into public.profiles (id, business_id, full_name, role)
select id, '00000000-0000-4000-8000-000000000001', 'Nombre del equipo', 'admin'
from auth.users
where email = 'admin@restaurante.com';
```

El rol `admin` puede editar productos, categorías y precios. `cashier` puede abrir caja y operar pedidos, pero RLS bloquea cambios del menú en la base de datos.

La sesión, el menú, los pedidos, la caja y los pagos se guardan en Supabase. Los cambios del menú se sincronizan en vivo entre sesiones conectadas. El carrito sin confirmar se guarda en `localStorage` de ese navegador y se limpia al confirmar pedido o cerrar sesión. La migración recalcula precios en Postgres; no confía en los totales enviados por el cliente.

La clave `service_role` nunca debe entrar en el frontend ni en variables `VITE_*`.

Sin URL/clave de un proyecto Supabase no puede validarse la sesión ni la sincronización entre dispositivos desde este entorno. El login informa cuando faltan las variables.
