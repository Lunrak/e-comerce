import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { refreshCash } from '../cash/cashSlice.js'
import * as dataApi from '../data/supabaseApi.ts'

export const fetchActiveOrders = createAsyncThunk(
  'orders/fetchActive',
  dataApi.fetchOrders,
)
export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchHistory',
  dataApi.fetchOrderHistory,
)

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (draft) => dataApi.createOrder(draft),
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
  async (payment, { dispatch }) => {
    const order = await dataApi.finalizeOrder(payment)
    dispatch(refreshCash())
    return order
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

const initialState = {
  active: [],
  history: [],
  isCreating: false,
  isLoading: false,
  historyLoading: false,
  finalizingOrderId: null,
  error: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrders: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.active = action.payload
        state.isLoading = false
      })
      .addCase(fetchActiveOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(fetchOrderHistory.pending, (state) => {
        state.historyLoading = true
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.history = action.payload
        state.historyLoading = false
      })
      .addCase(fetchOrderHistory.rejected, (state, action) => {
        state.historyLoading = false
        state.error = action.error.message
      })
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.active.unshift(action.payload)
        state.isCreating = false
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false
        if (!action.meta.condition) state.error = action.error.message
      })
      .addCase(finalizeOrder.pending, (state, action) => {
        state.finalizingOrderId = action.meta.arg.orderId
        state.error = null
      })
      .addCase(finalizeOrder.fulfilled, (state, action) => {
        state.active = state.active.filter(
          (order) => order.id !== action.payload.id,
        )
        state.history.unshift(action.payload)
        state.finalizingOrderId = null
      })
      .addCase(finalizeOrder.rejected, (state, action) => {
        state.finalizingOrderId = null
        if (!action.meta.condition) state.error = action.error.message
      })
  },
})

export const { resetOrders } = ordersSlice.actions
export default ordersSlice.reducer
