import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const closeCash = createAsyncThunk(
  'cash/closeCash',
  async (_, { getState, rejectWithValue }) => {
    const state = getState()
    if (!state.cash.isCashOpen)
      return rejectWithValue('La caja ya está cerrada.')
    if (state.orders.active.length > 0) {
      return rejectWithValue(
        'Cobra o cancela los pedidos activos antes de cerrar.',
      )
    }
    return { closedAt: new Date().toISOString() }
  },
)

const cashSlice = createSlice({
  name: 'cash',
  initialState: {
    isCashOpen: false,
    currentCashId: null,
    name: null,
    initialAmount: null,
    currentTotal: 0,
    cashCollected: 0,
    openedAt: null,
    transactions: [],
    closedSessions: [],
    isClosing: false,
    error: null,
  },
  reducers: {
    openCash(state, action) {
      const { id, name, initialAmount, openedAt } = action.payload
      if (
        state.isCashOpen ||
        !Number.isFinite(initialAmount) ||
        initialAmount < 0
      ) {
        return
      }

      state.isCashOpen = true
      state.currentCashId = id
      state.name = name
      state.initialAmount = initialAmount
      state.currentTotal = initialAmount
      state.cashCollected = 0
      state.openedAt = openedAt
      state.transactions = []
      state.error = null
    },
    registerCashMovement(state, action) {
      const movement = action.payload
      if (!state.isCashOpen || movement.paymentMethod !== 'CASH') return
      if (!Number.isFinite(movement.amount) || movement.amount <= 0) return

      state.transactions.push(movement)
      state.cashCollected += movement.amount
      state.currentTotal = state.initialAmount + state.cashCollected
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(closeCash.pending, (state) => {
        state.isClosing = true
        state.error = null
      })
      .addCase(closeCash.fulfilled, (state, action) => {
        state.closedSessions.unshift({
          id: state.currentCashId,
          name: state.name,
          openedAt: state.openedAt,
          closedAt: action.payload.closedAt,
          initialAmount: state.initialAmount,
          cashCollected: state.cashCollected,
          closingAmount: state.currentTotal,
          transactions: state.transactions,
        })
        state.isCashOpen = false
        state.currentCashId = null
        state.name = null
        state.initialAmount = null
        state.currentTotal = 0
        state.cashCollected = 0
        state.openedAt = null
        state.transactions = []
        state.isClosing = false
      })
      .addCase(closeCash.rejected, (state, action) => {
        state.isClosing = false
        state.error = action.payload || action.error.message
      })
  },
})

export const { openCash, registerCashMovement } = cashSlice.actions
export default cashSlice.reducer
