import { useState } from 'react'
import { Banknote, CreditCard, Landmark, X } from 'lucide-react'

const currency = new Intl.NumberFormat('es-CU', {
  style: 'currency',
  currency: 'CUP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const methods = [
  { id: 'CASH', label: 'Efectivo', Icon: Banknote },
  { id: 'CARD', label: 'Tarjeta', Icon: CreditCard },
  { id: 'TRANSFER', label: 'Transferencia', Icon: Landmark },
]

function PaymentModal({ order, isSaving, onClose, onConfirm }) {
  const [method, setMethod] = useState('CASH')

  return (
    <div className="overlay-layer order-overlay" onMouseDown={onClose}>
      <section
        aria-labelledby="payment-title"
        aria-modal="true"
        className="dialog-panel payment-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="order-dialog-header">
          <div>
            <span className="eyebrow">PEDIDO #{order.id.slice(-4)}</span>
            <h2 id="payment-title">Registrar pago</h2>
          </div>
          <button
            aria-label="Cerrar pago"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <div className="payment-content">
          <span className="payment-total-label">Total a cobrar</span>
          <strong className="payment-total">
            {currency.format(order.total)}
          </strong>
          <fieldset className="payment-methods">
            <legend>Método de pago</legend>
            {methods.map(({ id, label, Icon }) => (
              <button
                aria-pressed={method === id}
                className={method === id ? 'payment-method-active' : ''}
                key={id}
                onClick={() => setMethod(id)}
                type="button"
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </fieldset>
        </div>
        <footer className="order-dialog-footer">
          <button
            className="secondary-button"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Volver
          </button>
          <button
            className="primary-button"
            disabled={isSaving}
            onClick={() => onConfirm(method)}
            type="button"
          >
            {isSaving ? (
              <span className="button-spinner" />
            ) : (
              <Banknote size={16} />
            )}
            {isSaving ? 'Procesando…' : 'Finalizar pedido'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default PaymentModal
