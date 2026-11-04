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

export interface Categoria {
  id: string
  name: string
  isVisible: boolean
}

export interface Producto {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  discountPrice?: number
  image?: string
  isVisible: boolean
  trackStock: boolean
  stock: number
  modifiers: ModifierGroup[]
}

export type OrderType = 'LOCAL' | 'DELIVERY' | 'TABLE'

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'PAID'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'

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
  createdAt: string
  paidAt?: string
  paymentMethod?: PaymentMethod
  customerName?: string
}

export interface Caja {
  id: string
  name: string
  isOpen: boolean
  initialAmount: number
  currentTotal: number
  openedAt: string | null
  cashCollected: number
  transactions: MovimientoCaja[]
}

export interface MovimientoCaja {
  id: string
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  createdAt: string
}

export interface SesionCaja extends Caja {
  openedAt: string
  closedAt: string
  closingAmount: number
}

export interface Usuario {
  id: string
  name: string
  email: string
}
