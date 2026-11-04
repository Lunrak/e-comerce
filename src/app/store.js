import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../features/cart/cartSlice.js'
import cashReducer from '../features/cash/cashSlice.js'
import menuReducer from '../features/menu/menuSlice.js'
import ordersReducer from '../features/orders/ordersSlice.js'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    cash: cashReducer,
    menu: menuReducer,
    orders: ordersReducer,
  },
})
