import { requireSupabase } from '../../lib/supabase.ts'
import type { Categoria, Pedido, Producto } from '../../types/index.ts'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function mapCategory(row: any): Categoria {
  return { id: row.id, name: row.name, isVisible: row.is_visible }
}

function mapProduct(row: any): Producto {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    discountPrice:
      row.discount_price == null ? undefined : Number(row.discount_price),
    image: row.image_url ?? undefined,
    isVisible: row.is_visible,
    trackStock: row.track_stock,
    stock: row.stock_quantity,
    modifiers: row.modifiers ?? [],
  }
}

function mapOrder(row: any): Pedido {
  return {
    id: row.id,
    type: row.order_type,
    status: row.status,
    total: Number(row.total),
    customerName: row.customer_name ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    items: (row.order_items ?? []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      modifiers: item.modifiers ?? [],
      product: {
        id: item.product_id,
        categoryId: '',
        name: item.product_name,
        description: '',
        price: Number(item.unit_price),
        isVisible: true,
        trackStock: false,
        stock: 0,
        modifiers: [],
      },
    })),
  }
}

export async function fetchMenu() {
  const client = requireSupabase()
  const [categoriesResult, productsResult] = await Promise.all([
    client.from('menu_categories').select('*').order('sort_order'),
    client.from('menu_products').select('*').order('created_at'),
  ])
  throwIfError(categoriesResult.error)
  throwIfError(productsResult.error)
  return {
    categories: (categoriesResult.data ?? []).map(mapCategory),
    products: (productsResult.data ?? []).map(mapProduct),
  }
}

export async function saveCategory(
  category: Omit<Categoria, 'id'> & { id?: string },
) {
  const client = requireSupabase()
  const values = { name: category.name, is_visible: category.isVisible }
  const query = category.id
    ? client.from('menu_categories').update(values).eq('id', category.id)
    : client.from('menu_categories').insert(values)
  const { data, error } = await query.select().single()
  throwIfError(error)
  return mapCategory(data)
}

export async function setCategoryVisibility(id: string, isVisible: boolean) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('menu_categories')
    .update({ is_visible: isVisible })
    .eq('id', id)
    .select()
    .single()
  throwIfError(error)
  return mapCategory(data)
}

export async function deleteCategory(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('menu_categories').delete().eq('id', id)
  throwIfError(error)
  return id
}

export async function saveProduct(
  product: Omit<Producto, 'id'> & { id?: string },
) {
  const client = requireSupabase()
  const values = {
    category_id: product.categoryId,
    name: product.name,
    description: product.description,
    price: product.price,
    discount_price: product.discountPrice ?? null,
    image_url: product.image ?? null,
    is_visible: product.isVisible,
    track_stock: product.trackStock,
    stock_quantity: product.stock,
    modifiers: product.modifiers,
  }
  const query = product.id
    ? client.from('menu_products').update(values).eq('id', product.id)
    : client.from('menu_products').insert(values)
  const { data, error } = await query.select().single()
  throwIfError(error)
  return mapProduct(data)
}

export async function setProductVisibility(id: string, isVisible: boolean) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('menu_products')
    .update({ is_visible: isVisible })
    .eq('id', id)
    .select()
    .single()
  throwIfError(error)
  return mapProduct(data)
}

export async function duplicateProduct(id: string) {
  const client = requireSupabase()
  const { data: source, error: readError } = await client
    .from('menu_products')
    .select('*')
    .eq('id', id)
    .single()
  throwIfError(readError)
  const {
    id: _sourceId,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...copy
  } = source
  const { data, error } = await client
    .from('menu_products')
    .insert({ ...copy, name: `${source.name} (copia)`, is_visible: false })
    .select()
    .single()
  throwIfError(error)
  return mapProduct(data)
}

export async function deleteProduct(id: string) {
  const client = requireSupabase()
  const { error } = await client.from('menu_products').delete().eq('id', id)
  throwIfError(error)
  return id
}

export async function fetchOrders() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
    .in('status', ['PENDING', 'IN_PROGRESS'])
    .order('created_at', { ascending: false })
  throwIfError(error)
  return (data ?? []).map(mapOrder)
}

export async function fetchOrderHistory() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
    .eq('status', 'PAID')
    .order('paid_at', { ascending: false })
  throwIfError(error)
  return (data ?? []).map(mapOrder)
}

export async function createOrder(draft: any) {
  const client = requireSupabase()
  const { data: orderId, error } = await client.rpc('create_order', {
    p_order_type: draft.type,
    p_customer_name: draft.customerName ?? null,
    p_items: draft.items.map((item: any) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      modifiers: item.modifiers ?? [],
    })),
  })
  throwIfError(error)
  return getOrder(orderId)
}

export async function finalizeOrder({
  orderId,
  paymentMethod,
}: {
  orderId: string
  paymentMethod: string
}) {
  const client = requireSupabase()
  const { error } = await client.rpc('finalize_order', {
    p_order_id: orderId,
    p_payment_method: paymentMethod,
  })
  throwIfError(error)
  return getOrder(orderId)
}

async function getOrder(orderId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()
  throwIfError(error)
  return mapOrder(data)
}

export async function fetchOpenCash() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('cash_sessions')
    .select('*, cash_movements(*)')
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  throwIfError(error)
  return data
}

export async function openCash({
  name,
  initialAmount,
}: {
  name: string
  initialAmount: number
}) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('open_cash_session', {
    p_name: name,
    p_initial_amount: initialAmount,
  })
  throwIfError(error)
  const { data: session, error: readError } = await client
    .from('cash_sessions')
    .select('*, cash_movements(*)')
    .eq('id', data)
    .single()
  throwIfError(readError)
  return session
}

export async function closeCash() {
  const client = requireSupabase()
  const { data, error } = await client.rpc('close_cash_session')
  throwIfError(error)
  return data
}
