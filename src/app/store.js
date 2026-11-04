import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice.js'
import cashReducer from '../features/cash/cashSlice.js'
import menuReducer from '../features/menu/menuSlice.js'
import ordersReducer from '../features/orders/ordersSlice.js'
import authReducer from '../features/auth/authSlice.js'

const CART_STORAGE_KEY = 'mesa:cart:v1'

function loadCart() {
  try {
    if (typeof localStorage === 'undefined') return undefined
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return undefined
    const cart = JSON.parse(stored)
    return cart && Array.isArray(cart.items) ? cart : undefined
  } catch {
    return undefined
  }
}

export const store = configureStore({
  preloadedState: {
    cart: loadCart(),
  },
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    cash: cashReducer,
    menu: menuReducer,
    orders: ordersReducer,
  },
})

store.subscribe(() => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(store.getState().cart),
    )
  } catch {
    // Storage puede estar deshabilitado o lleno; el carrito sigue vivo en Redux.
  }
})
