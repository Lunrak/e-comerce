import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import * as menuApi from '../data/supabaseApi.ts'

export const fetchMenu = createAsyncThunk('menu/fetchMenu', menuApi.fetchMenu)

export const saveMenuProduct = createAsyncThunk(
  'menu/saveProduct',
  menuApi.saveProduct,
)

export const setMenuProductVisibility = createAsyncThunk(
  'menu/setProductVisibility',
  ({ id, isVisible }) => menuApi.setProductVisibility(id, isVisible),
)

export const duplicateMenuProduct = createAsyncThunk(
  'menu/duplicateProduct',
  menuApi.duplicateProduct,
)

export const deleteMenuProduct = createAsyncThunk(
  'menu/deleteProduct',
  menuApi.deleteProduct,
)

export const saveMenuCategory = createAsyncThunk(
  'menu/saveCategory',
  menuApi.saveCategory,
)

export const setMenuCategoryVisibility = createAsyncThunk(
  'menu/setCategoryVisibility',
  ({ id, isVisible }) => menuApi.setCategoryVisibility(id, isVisible),
)

export const deleteMenuCategory = createAsyncThunk(
  'menu/deleteCategory',
  menuApi.deleteCategory,
)

const productMutationThunks = [
  saveMenuProduct,
  setMenuProductVisibility,
  duplicateMenuProduct,
  deleteMenuProduct,
  saveMenuCategory,
  setMenuCategoryVisibility,
  deleteMenuCategory,
]

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    categories: [],
    products: [],
    status: 'idle',
    isMutating: false,
    error: null,
  },
  reducers: {
    resetMenu: () => ({
      categories: [],
      products: [],
      status: 'idle',
      isMutating: false,
      error: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.categories = action.payload.categories
        state.products = action.payload.products
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(saveMenuProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (product) => product.id === action.payload.id,
        )
        if (index === -1) state.products.push(action.payload)
        else state.products[index] = action.payload
      })
      .addCase(setMenuProductVisibility.fulfilled, (state, action) => {
        state.products = state.products.map((product) =>
          product.id === action.payload.id ? action.payload : product,
        )
      })
      .addCase(duplicateMenuProduct.fulfilled, (state, action) => {
        state.products.push(action.payload)
      })
      .addCase(deleteMenuProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(
          (product) => product.id !== action.payload,
        )
      })
      .addCase(saveMenuCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(
          (category) => category.id === action.payload.id,
        )
        if (index === -1) state.categories.push(action.payload)
        else state.categories[index] = action.payload
      })
      .addCase(setMenuCategoryVisibility.fulfilled, (state, action) => {
        state.categories = state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category,
        )
      })
      .addCase(deleteMenuCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (category) => category.id !== action.payload,
        )
      })
      .addMatcher(
        isAnyOf(...productMutationThunks.map((thunk) => thunk.pending)),
        (state) => {
          state.isMutating = true
          state.error = null
        },
      )
      .addMatcher(
        isAnyOf(...productMutationThunks.map((thunk) => thunk.fulfilled)),
        (state) => {
          state.isMutating = false
        },
      )
      .addMatcher(
        isAnyOf(...productMutationThunks.map((thunk) => thunk.rejected)),
        (state, action) => {
          state.isMutating = false
          state.error = action.error.message
        },
      )
  },
})

export const { resetMenu } = menuSlice.actions
export default menuSlice.reducer
