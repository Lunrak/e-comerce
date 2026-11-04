import { createSlice } from '@reduxjs/toolkit'

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    categories: [],
    products: [],
  },
  reducers: {},
})

export default menuSlice.reducer
