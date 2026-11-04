import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    type: 'LOCAL',
    customerName: '',
  },
  reducers: {
    addCartProduct(state, action) {
      const { product, itemId, modifiers } = action.payload
      const modifierIds = modifiers
        .map((modifier) => modifier.id)
        .sort()
        .join(',')
      const existing = state.items.find(
        (item) =>
          item.product.id === product.id &&
          item.modifiers
            .map((modifier) => modifier.id)
            .sort()
            .join(',') === modifierIds,
      )
      if (existing) existing.quantity += 1
      else state.items.push({ id: itemId, product, quantity: 1, modifiers })
    },
    changeCartQuantity(state, action) {
      const { itemId, difference } = action.payload
      const item = state.items.find((line) => line.id === itemId)
      if (!item) return
      item.quantity += difference
      if (item.quantity <= 0) {
        state.items = state.items.filter((line) => line.id !== itemId)
      }
    },
    removeCartItem(state, action) {
      state.items = state.items.filter((line) => line.id !== action.payload)
    },
    setCartDetails(state, action) {
      Object.assign(state, action.payload)
    },
    clearCart(state) {
      state.items = []
      state.type = 'LOCAL'
      state.customerName = ''
    },
  },
})

export const {
  addCartProduct,
  changeCartQuantity,
  clearCart,
  removeCartItem,
  setCartDetails,
} = cartSlice.actions
export default cartSlice.reducer
