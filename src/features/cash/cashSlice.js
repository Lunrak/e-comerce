import { createSlice } from '@reduxjs/toolkit'

const cashSlice = createSlice({
  name: 'cash',
  initialState: {
    isCashOpen: false,
    currentCashId: null,
    initialAmount: 0,
    currentTotal: 0,
    openedAt: null,
    transactions: [],
  },
  reducers: {},
})

export default cashSlice.reducer
