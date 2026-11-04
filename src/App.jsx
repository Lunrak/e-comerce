import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import WorkspaceHeader from './app/WorkspaceHeader.jsx'
import CashRegisterModal from './features/cash/CashRegisterModal.jsx'
import CashSummary from './features/cash/CashSummary.jsx'
import POSDashboard from './features/orders/POSDashboard.jsx'
import OrderHistory from './features/orders/OrderHistory.jsx'
import { fetchMenu } from './features/menu/menuSlice.js'
import MenuManager from './features/menu/components/MenuManager.jsx'
import './app/Workspace.css'

function App() {
  const dispatch = useDispatch()
  const cashOpen = useSelector((state) => state.cash.isCashOpen)
  const menuStatus = useSelector((state) => state.menu.status)
  const [activeView, setActiveView] = useState('pos')
  const [cashModal, setCashModal] = useState(null)

  useEffect(() => {
    if (menuStatus === 'idle') dispatch(fetchMenu())
  }, [dispatch, menuStatus])

  return (
    <div className="workspace-app">
      <WorkspaceHeader
        activeView={activeView}
        cashOpen={cashOpen}
        onCashClick={() => setCashModal(cashOpen ? 'summary' : 'open')}
        onNavigate={setActiveView}
      />
      {activeView === 'pos' && (
        <POSDashboard
          cashOpen={cashOpen}
          onOpenCash={() => setCashModal('open')}
        />
      )}
      {activeView === 'history' && <OrderHistory />}
      {activeView === 'menu' && <MenuManager />}

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
