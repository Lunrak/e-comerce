export interface ModifierOption {
  id: string
  name: string
  priceAdjustment: number
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  options: ModifierOption[]
}

export interface Producto {
  id: string
  name: string
  description: string
  price: number
  discountPrice?: number
  image?: string
  isVisible: boolean
  modifiers: ModifierGroup[]
}

export type OrderType = 'LOCAL' | 'DELIVERY' | 'TABLE'

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'PAID'

export interface CartItem {
  id: string
  product: Producto
  quantity: number
  modifiers: ModifierOption[]
}

export interface Pedido {
  id: string
  type: OrderType
  items: CartItem[]
  status: OrderStatus
  total: number
  customerName?: string
}

export interface Caja {
  id: string
  name: string
  isOpen: boolean
  initialAmount: number
  currentTotal: number
  openedAt: Date | null
}

export interface Usuario {
  id: string
  name: string
  email: string
}
