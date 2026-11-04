import { Banknote, ClipboardList, History, UtensilsCrossed } from 'lucide-react'

const views = [
  { id: 'pos', label: 'Pedidos', Icon: ClipboardList },
  { id: 'history', label: 'Historial', Icon: History },
  { id: 'menu', label: 'Menú', Icon: UtensilsCrossed },
]

function WorkspaceHeader({ activeView, cashOpen, onCashClick, onNavigate }) {
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
        {views.map(({ id, label, Icon }) => (
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
          <span>Hansel Rodriguez</span>
          <span className="open-indicator">
            <span /> Abierto
          </span>
        </div>
        <span aria-label="Hansel Rodriguez" className="topbar-profile">
          HR
        </span>
      </div>
    </header>
  )
}

export default WorkspaceHeader
