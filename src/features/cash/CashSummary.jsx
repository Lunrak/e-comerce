import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Banknote, CircleAlert, Clock3, X } from 'lucide-react'
import { closeCash } from './cashSlice.js'

const currency = new Intl.NumberFormat('es-CU', {
  style: 'currency',
  currency: 'CUP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('es-CU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function CashSummary({ onClose, onClosed }) {
  const dispatch = useDispatch()
  const cash = useSelector((state) => state.cash)
  const activeOrders = useSelector((state) => state.orders.active.length)
  const [error, setError] = useState('')

  const handleCloseCash = async () => {
    setError('')
    try {
      await dispatch(closeCash()).unwrap()
      onClosed()
    } catch (closeError) {
      setError(closeError || 'No se pudo cerrar la caja.')
    }
  }

  return (
    <div className="overlay-layer cash-overlay" onMouseDown={onClose}>
      <section
        aria-labelledby="cash-summary-title"
        aria-modal="true"
        className="dialog-panel cash-summary-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="cash-dialog-header">
          <span className="cash-dialog-icon">
            <Banknote size={20} />
          </span>
          <button
            aria-label="Cerrar resumen"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <span className="eyebrow">CIERRE DE TURNO</span>
        <h2 id="cash-summary-title">Resumen de caja</h2>
        <div className="cash-session-line">
          <span className="cash-session-indicator" />
          <strong>{cash.name}</strong>
          <span>Abierta desde {dateTime.format(new Date(cash.openedAt))}</span>
        </div>

        <div className="cash-total-grid">
          <div>
            <span>Monto inicial</span>
            <strong>{currency.format(cash.initialAmount)}</strong>
          </div>
          <div>
            <span>Efectivo recaudado</span>
            <strong>{currency.format(cash.cashCollected)}</strong>
          </div>
          <div className="cash-closing-total">
            <span>Total en caja</span>
            <strong>{currency.format(cash.currentTotal)}</strong>
          </div>
        </div>

        <div className="cash-movements-heading">
          <div>
            <h3>Movimientos en efectivo</h3>
            <span>{cash.transactions.length} ventas registradas</span>
          </div>
          <Clock3 size={16} />
        </div>
        <div className="cash-movement-list">
          {cash.transactions.length ? (
            cash.transactions
              .slice()
              .reverse()
              .map((movement) => (
                <div className="cash-movement-row" key={movement.id}>
                  <span className="movement-icon">
                    <Banknote size={15} />
                  </span>
                  <div>
                    <strong>Pedido #{movement.orderId.slice(-4)}</strong>
                    <span>{dateTime.format(new Date(movement.createdAt))}</span>
                  </div>
                  <b>+ {currency.format(movement.amount)}</b>
                </div>
              ))
          ) : (
            <p className="cash-no-movements">
              Todavía no hay ventas en efectivo.
            </p>
          )}
        </div>

        {activeOrders > 0 && (
          <p className="cash-block-note">
            <CircleAlert size={15} /> Hay {activeOrders} pedidos activos.
            Cóbrelos antes de cerrar.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="cash-dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Volver
          </button>
          <button
            className="danger-button"
            disabled={cash.isClosing || activeOrders > 0}
            onClick={handleCloseCash}
            type="button"
          >
            {cash.isClosing ? (
              <span className="button-spinner" />
            ) : (
              <X size={16} />
            )}
            {cash.isClosing ? 'Cerrando…' : 'Cerrar caja'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default CashSummary
