import {
  Banknote,
  ClipboardList,
  History,
  LogOut,
  UtensilsCrossed,
} from 'lucide-react'

const views = [
  { id: 'pos', label: 'Pedidos', Icon: ClipboardList },
  { id: 'history', label: 'Historial', Icon: History },
  { id: 'menu', label: 'Menú', Icon: UtensilsCrossed },
]

function WorkspaceHeader({
  activeView,
  cashOpen,
  profile,
  onCashClick,
  onNavigate,
  onSignOut,
}) {
  return (
    <header className="topbar app-topbar">
      <a aria-label="Mesa, inicio" className="brand-lockup" href="#workspace">
        <span className="brand-mark">
          <UtensilsCrossed size={19} strokeWidth={2.2} />
        </span>
        <span className="brand-name">
          mesa<span>.</span>
        </span>
        <span className="brand-divider" />
        <span className="brand-product">GESTIÓN</span>
      </a>

      <nav aria-label="Secciones principales" className="workspace-nav">
        {views
          .filter(({ id }) => id !== 'menu' || profile?.role === 'admin')
          .map(({ id, label, Icon }) => (
            <button
              aria-current={activeView === id ? 'page' : undefined}
              className={activeView === id ? 'workspace-nav-active' : ''}
              key={id}
              onClick={() => onNavigate(id)}
              type="button"
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
      </nav>

      <div className="topbar-right">
        <button
          className={`cash-top-action ${cashOpen ? 'cash-top-open' : 'cash-top-closed'}`}
          onClick={onCashClick}
          type="button"
        >
          <Banknote size={16} />
          <span>{cashOpen ? 'Caja abierta' : 'Abrir caja'}</span>
        </button>
        <div className="store-switcher">
          <span className="store-avatar">
            <UtensilsCrossed size={14} />
          </span>
          <span>{profile?.full_name || 'Equipo'}</span>
          <span className="open-indicator">
            <span /> Abierto
          </span>
        </div>
        <button
          aria-label="Cerrar sesión"
          className="topbar-profile"
          onClick={onSignOut}
          title="Cerrar sesión"
          type="button"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}

export default WorkspaceHeader
