import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Banknote, CalendarClock, X } from 'lucide-react'
import { openCash } from './cashSlice.js'

function CashRegisterModal({ onClose, onOpened }) {
  const dispatch = useDispatch()
  const [name, setName] = useState('Caja principal')
  const [initialAmount, setInitialAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const amount = Number(initialAmount)

    if (!name.trim()) {
      setError('Escribe el nombre de la caja.')
      return
    }
    if (initialAmount === '' || !Number.isFinite(amount) || amount < 0) {
      setError('Declara un monto inicial válido para abrir la caja.')
      return
    }

    dispatch(
      openCash({
        id: `cash-${Date.now()}`,
        name: name.trim(),
        initialAmount: amount,
        openedAt: new Date().toISOString(),
      }),
    )
    onOpened()
  }

  return (
    <div className="overlay-layer cash-overlay" onMouseDown={onClose}>
      <section
        aria-labelledby="cash-open-title"
        aria-modal="true"
        className="dialog-panel cash-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="cash-dialog-header">
          <span className="cash-dialog-icon">
            <Banknote size={20} />
          </span>
          <button
            aria-label="Cerrar"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <span className="eyebrow">CONTROL DE CAJA</span>
        <h2 id="cash-open-title">Abrir caja</h2>
        <p className="cash-dialog-copy">
          Declara el efectivo disponible al iniciar el turno.
        </p>

        <form className="cash-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="cash-name">
            Nombre de la caja
            <input
              autoComplete="off"
              id="cash-name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="field-label" htmlFor="cash-initial-amount">
            Monto inicial
            <div className="input-suffix">
              <input
                autoFocus
                id="cash-initial-amount"
                min="0"
                onChange={(event) => {
                  setInitialAmount(event.target.value)
                  setError('')
                }}
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={initialAmount}
              />
              <span>CUP</span>
            </div>
          </label>
          <div className="cash-time-note">
            <CalendarClock size={16} />
            <span>Apertura</span>
            <strong>
              {new Intl.DateTimeFormat('es-CU', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date())}
            </strong>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <footer className="cash-dialog-actions">
            <button
              className="secondary-button"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              disabled={
                !name.trim() ||
                initialAmount === '' ||
                !Number.isFinite(Number(initialAmount)) ||
                Number(initialAmount) < 0
              }
              type="submit"
            >
              <Banknote size={16} /> Abrir caja
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CashRegisterModal
