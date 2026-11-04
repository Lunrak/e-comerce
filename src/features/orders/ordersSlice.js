import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { registerCashMovement } from '../cash/cashSlice.js'

const createId = () =>
  `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (draft) => ({
    ...draft,
    id: createId(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }),
  {
    condition: (_, { getState }) => {
      const cash = getState().cash
      return (
        cash.isCashOpen &&
        Number.isFinite(cash.initialAmount) &&
        cash.initialAmount >= 0
      )
    },
    dispatchConditionRejection: true,
  },
)

export const finalizeOrder = createAsyncThunk(
  'orders/finalizeOrder',
  async ({ orderId, paymentMethod }, { dispatch, getState }) => {
    const order = getState().orders.active.find((item) => item.id === orderId)
    const paidAt = new Date().toISOString()

    if (paymentMethod === 'CASH') {
      dispatch(
        registerCashMovement({
          id: `movement-${orderId}`,
          orderId,
          amount: order.total,
          paymentMethod,
          createdAt: paidAt,
        }),
      )
    }

    return { orderId, paymentMethod, paidAt }
  },
  {
    condition: ({ orderId }, { getState }) => {
      const state = getState()
      return (
        state.cash.isCashOpen &&
        Number.isFinite(state.cash.initialAmount) &&
        state.cash.initialAmount >= 0 &&
        state.orders.active.some((order) => order.id === orderId)
      )
    },
    dispatchConditionRejection: true,
  },
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    active: [],
    history: [],
    isCreating: false,
    finalizingOrderId: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.active.unshift(action.payload)
        state.isCreating = false
      })
      .addCase(createOrder.rejected, (state) => {
        state.isCreating = false
      })
      .addCase(finalizeOrder.pending, (state, action) => {
        state.finalizingOrderId = action.meta.arg.orderId
      })
      .addCase(finalizeOrder.fulfilled, (state, action) => {
        const index = state.active.findIndex(
          (order) => order.id === action.payload.orderId,
        )
        if (index === -1) return

        const [order] = state.active.splice(index, 1)
        state.history.unshift({
          ...order,
          status: 'PAID',
          paymentMethod: action.payload.paymentMethod,
          paidAt: action.payload.paidAt,
        })
        state.finalizingOrderId = null
      })
      .addCase(finalizeOrder.rejected, (state) => {
        state.finalizingOrderId = null
      })
  },
})

export default ordersSlice.reducer
