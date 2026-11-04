import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as dataApi from '../data/supabaseApi.ts'

function mapCashSession(row) {
  return {
    id: row.id,
    name: row.name,
    isOpen: true,
    initialAmount: Number(row.opening_amount),
    cashCollected: Number(row.cash_collected),
    currentTotal: Number(row.opening_amount) + Number(row.cash_collected),
    openedAt: row.opened_at,
    transactions: (row.cash_movements ?? []).map((movement) => ({
      id: movement.id,
      orderId: movement.order_id,
      amount: Number(movement.amount),
      paymentMethod: movement.payment_method,
      createdAt: movement.created_at,
    })),
  }
}

export const refreshCash = createAsyncThunk('cash/refresh', async () => {
  const row = await dataApi.fetchOpenCash()
  return row ? mapCashSession(row) : null
})

export const openCash = createAsyncThunk(
  'cash/openCash',
  async ({ name, initialAmount }) =>
    mapCashSession(await dataApi.openCash({ name, initialAmount })),
)

export const closeCash = createAsyncThunk('cash/closeCash', dataApi.closeCash)

const initialState = {
  isCashOpen: false,
  currentCashId: null,
  name: null,
  initialAmount: null,
  currentTotal: 0,
  cashCollected: 0,
  openedAt: null,
  transactions: [],
  closedSessions: [],
  isLoading: false,
  isOpening: false,
  isClosing: false,
  error: null,
}

const cashSlice = createSlice({
  name: 'cash',
  initialState,
  reducers: {
    resetCash: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshCash.pending, (state) => {
        state.isLoading = true
      })
      .addCase(refreshCash.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) Object.assign(state, action.payload)
        else {
          state.isCashOpen = false
          state.currentCashId = null
          state.name = null
          state.initialAmount = null
          state.currentTotal = 0
          state.cashCollected = 0
          state.openedAt = null
          state.transactions = []
        }
      })
      .addCase(refreshCash.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message
      })
      .addCase(openCash.pending, (state) => {
        state.isOpening = true
        state.error = null
      })
      .addCase(openCash.fulfilled, (state, action) => {
        Object.assign(state, action.payload, {
          isOpening: false,
          isLoading: false,
          error: null,
        })
      })
      .addCase(openCash.rejected, (state, action) => {
        state.isOpening = false
        state.error = action.error.message
      })
      .addCase(closeCash.pending, (state) => {
        state.isClosing = true
        state.error = null
      })
      .addCase(closeCash.fulfilled, (state, action) => {
        state.closedSessions.unshift(action.payload)
        Object.assign(state, {
          isCashOpen: false,
          currentCashId: null,
          name: null,
          initialAmount: null,
          currentTotal: 0,
          cashCollected: 0,
          openedAt: null,
          transactions: [],
          isClosing: false,
        })
      })
      .addCase(closeCash.rejected, (state, action) => {
        state.isClosing = false
        state.error = action.error.message
      })
  },
})

export const { resetCash } = cashSlice.actions
export default cashSlice.reducer
