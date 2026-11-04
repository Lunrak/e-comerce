import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './features/auth/LoginPage.jsx'
import { clearAuth, restoreAuth, signOut } from './features/auth/authSlice.js'
import { clearCart } from './features/cart/cartSlice.js'
import { supabase } from './lib/supabase.ts'
import WorkspaceHeader from './app/WorkspaceHeader.jsx'
import CashRegisterModal from './features/cash/CashRegisterModal.jsx'
import CashSummary from './features/cash/CashSummary.jsx'
import POSDashboard from './features/orders/POSDashboard.jsx'
import OrderHistory from './features/orders/OrderHistory.jsx'
import { fetchMenu, resetMenu } from './features/menu/menuSlice.js'
import { refreshCash, resetCash } from './features/cash/cashSlice.js'
import {
  fetchActiveOrders,
  fetchOrderHistory,
  resetOrders,
} from './features/orders/ordersSlice.js'
import MenuManager from './features/menu/components/MenuManager.jsx'
import './app/Workspace.css'

function App() {
  const dispatch = useDispatch()
  const { status: authStatus, profile } = useSelector((state) => state.auth)
  const cashOpen = useSelector((state) => state.cash.isCashOpen)
  const [activeView, setActiveView] = useState('pos')
  const [cashModal, setCashModal] = useState(null)

  useEffect(() => {
    dispatch(restoreAuth())
    if (!supabase) return undefined

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') dispatch(clearAuth())
    })
    return () => data.subscription.unsubscribe()
  }, [dispatch])

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      dispatch(resetCash())
      dispatch(resetMenu())
      dispatch(resetOrders())
      dispatch(clearCart())
      return
    }
    if (authStatus !== 'authenticated') return
    dispatch(fetchMenu())
    dispatch(fetchActiveOrders())
    dispatch(fetchOrderHistory())
    dispatch(refreshCash())
  }, [authStatus, dispatch, profile?.id])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !supabase || !profile?.business_id) {
      return undefined
    }

    const channel = supabase
      .channel(`menu-sync:${profile.business_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_categories',
          filter: `business_id=eq.${profile.business_id}`,
        },
        () => dispatch(fetchMenu()),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_products',
          filter: `business_id=eq.${profile.business_id}`,
        },
        () => dispatch(fetchMenu()),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authStatus, dispatch, profile?.business_id])

  if (authStatus === 'loading' || authStatus === 'authenticating') {
    return (
      <main className="auth-loading" aria-label="Cargando sesión">
        <span className="button-spinner" />
      </main>
    )
  }

  if (authStatus !== 'authenticated') return <LoginPage />

  const handleSignOut = async () => {
    await dispatch(signOut())
    dispatch(clearCart())
    setCashModal(null)
    setActiveView('pos')
  }

  return (
    <div className="workspace-app">
      <WorkspaceHeader
        activeView={activeView}
        cashOpen={cashOpen}
        onCashClick={() => setCashModal(cashOpen ? 'summary' : 'open')}
        onNavigate={(view) => {
          if (view !== 'menu' || profile?.role === 'admin') setActiveView(view)
        }}
        onSignOut={handleSignOut}
        profile={profile}
      />
      {activeView === 'pos' && (
        <POSDashboard
          cashOpen={cashOpen}
          onOpenCash={() => setCashModal('open')}
        />
      )}
      {activeView === 'history' && <OrderHistory />}
      {activeView === 'menu' && profile?.role === 'admin' && <MenuManager />}

      {cashModal === 'open' && (
        <CashRegisterModal
          onClose={() => setCashModal(null)}
          onOpened={() => setCashModal(null)}
        />
      )}
      {cashModal === 'summary' && cashOpen && (
        <CashSummary
          onClose={() => setCashModal(null)}
          onClosed={() => {
            setCashModal(null)
            setActiveView('pos')
          }}
        />
      )}
    </div>
  )
}

export default App
