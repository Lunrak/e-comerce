import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authApi from './authApi.ts'

export const restoreAuth = createAsyncThunk(
  'auth/restore',
  authApi.restoreSession,
)
export const signIn = createAsyncThunk('auth/signIn', authApi.signIn)
export const signOut = createAsyncThunk('auth/signOut', authApi.signOut)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    profile: null,
    status: 'loading',
    error: null,
  },
  reducers: {
    clearAuth(state) {
      state.user = null
      state.profile = null
      state.status = 'unauthenticated'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.user = action.payload?.user ?? null
        state.profile = action.payload?.profile ?? null
        state.status = action.payload ? 'authenticated' : 'unauthenticated'
      })
      .addCase(restoreAuth.rejected, (state, action) => {
        state.user = null
        state.profile = null
        state.status = 'unauthenticated'
        state.error = action.error.message
      })
      .addCase(signIn.pending, (state) => {
        state.status = 'authenticating'
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.status = 'authenticated'
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.error.message
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.status = 'unauthenticated'
        state.error = null
      })
  },
})

export const { clearAuth } = authSlice.actions
export default authSlice.reducer
