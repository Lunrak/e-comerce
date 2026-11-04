import { useState } from 'react'
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'

const currency = new Intl.NumberFormat('es-CU', {
  style: 'currency',
  currency: 'CUP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const priceFor = (product) => product.discountPrice ?? product.price
const makeId = () =>
  `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

function OrderFormModal({ products, isSaving, onClose, onSubmit }) {
  const [type, setType] = useState('LOCAL')
  const [customerName, setCustomerName] = useState('')
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id ?? '',
  )
  const [items, setItems] = useState([])

  const total = items.reduce((sum, item) => {
    const modifiersPrice = item.modifiers.reduce(
      (modifierSum, modifier) => modifierSum + modifier.priceAdjustment,
      0,
    )
    return sum + (priceFor(item.product) + modifiersPrice) * item.quantity
  }, 0)

  const addProduct = () => {
    const product = products.find((item) => item.id === selectedProductId)
    if (!product) return
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...current, { id: makeId(), product, quantity: 1, modifiers: [] }]
    })
  }

  const updateQuantity = (itemId, difference) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + difference }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (items.length === 0) return
    onSubmit({
      type,
      customerName: customerName.trim() || undefined,
      items,
      total,
    })
  }

  return (
    <div className="overlay-layer order-overlay" onMouseDown={onClose}>
      <section
        aria-labelledby="order-form-title"
        aria-modal="true"
        className="dialog-panel order-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="order-dialog-header">
          <div>
            <span className="eyebrow">PUNTO DE VENTA</span>
            <h2 id="order-form-title">Nuevo pedido</h2>
          </div>
          <button
            aria-label="Cerrar pedido"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <form className="order-form" onSubmit={handleSubmit}>
          <div className="order-form-scroll">
            <fieldset className="order-type-picker">
              <legend>Tipo de pedido</legend>
              {[
                { id: 'LOCAL', label: 'Mostrador' },
                { id: 'DELIVERY', label: 'A domicilio' },
                { id: 'TABLE', label: 'Mesa' },
              ].map((option) => (
                <button
                  aria-pressed={type === option.id}
                  className={type === option.id ? 'order-type-active' : ''}
                  key={option.id}
                  onClick={() => setType(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </fieldset>

            <label className="field-label" htmlFor="order-customer">
              Cliente <span className="optional-label">Opcional</span>
              <input
                autoComplete="name"
                id="order-customer"
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nombre del cliente"
                value={customerName}
              />
            </label>

            <div className="order-add-product">
              <label className="field-label" htmlFor="order-product">
                Agregar producto
                <select
                  id="order-product"
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  value={selectedProductId}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {currency.format(priceFor(product))}
                    </option>
                  ))}
                </select>
              </label>
              <button
                aria-label="Agregar producto al pedido"
                className="icon-button order-add-button"
                disabled={products.length === 0}
                onClick={addProduct}
                title="Agregar producto"
                type="button"
              >
                <Plus size={19} />
              </button>
            </div>

            <div className="order-items-heading">
              <h3>Productos</h3>
              <span>
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <div className="order-line-items">
              {items.length ? (
                items.map((item) => (
                  <div className="order-line-item" key={item.id}>
                    <div className="order-line-product">
                      <strong>{item.product.name}</strong>
                      <span>{currency.format(priceFor(item.product))} c/u</span>
                    </div>
                    <div className="quantity-control">
                      <button
                        aria-label={`Quitar una unidad de ${item.product.name}`}
                        onClick={() => updateQuantity(item.id, -1)}
                        type="button"
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Agregar una unidad de ${item.product.name}`}
                        onClick={() => updateQuantity(item.id, 1)}
                        type="button"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <strong className="order-line-total">
                      {currency.format(priceFor(item.product) * item.quantity)}
                    </strong>
                    <button
                      aria-label={`Eliminar ${item.product.name} del pedido`}
                      className="icon-button order-remove-item"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((line) => line.id !== item.id),
                        )
                      }
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="order-empty-items">
                  <ShoppingBag size={21} />
                  <span>Agrega productos para continuar.</span>
                </div>
              )}
            </div>

            <div className="order-total-line">
              <span>Total del pedido</span>
              <strong>{currency.format(total)}</strong>
            </div>
          </div>
          <footer className="order-dialog-footer">
            <button
              className="secondary-button"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              disabled={items.length === 0 || isSaving}
              type="submit"
            >
              {isSaving ? (
                <span className="button-spinner" />
              ) : (
                <Check size={16} />
              )}
              {isSaving ? 'Creando…' : 'Aceptar pedido'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default OrderFormModal
