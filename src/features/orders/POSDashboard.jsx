import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Banknote,
  Check,
  CircleAlert,
  Clock3,
  Plus,
  ShoppingBag,
  Store,
  Utensils,
  X,
} from 'lucide-react'
import { createOrder, finalizeOrder } from './ordersSlice.js'
import { clearCart } from '../cart/cartSlice.js'
import OrderFormModal from './OrderFormModal.jsx'
import PaymentModal from './PaymentModal.jsx'

const currency = new Intl.NumberFormat('es-CU', {
  style: 'currency',
  currency: 'CUP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('es-CU', {
  timeStyle: 'short',
})

const orderTypes = {
  LOCAL: 'Mostrador',
  DELIVERY: 'A domicilio',
  TABLE: 'Mesa',
}

const orderFilters = [
  { id: 'ALL', label: 'Todos' },
  { id: 'LOCAL', label: 'Mostrador' },
  { id: 'DELIVERY', label: 'A domicilio' },
  { id: 'TABLE', label: 'Mesas' },
]

function OrderCard({ order, onPay, isPaying }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <article className="active-order-card">
      <div className="active-order-topline">
        <div>
          <span className="order-id-label">PEDIDO</span>
          <h3>#{order.id.slice(-4)}</h3>
        </div>
        <span className="pending-pill">
          <span /> Pendiente
        </span>
      </div>
      <div className="active-order-meta">
        <span>{orderTypes[order.type]}</span>
        <span>{dateTime.format(new Date(order.createdAt))}</span>
      </div>
      <div className="active-order-items">
        <span className="active-order-bag">
          <ShoppingBag size={15} />
        </span>
        <span>
          {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
        </span>
        {order.customerName && (
          <span className="active-order-customer">· {order.customerName}</span>
        )}
      </div>
      <footer className="active-order-footer">
        <strong>{currency.format(order.total)}</strong>
        <button
          className="pay-order-button"
          disabled={isPaying}
          onClick={onPay}
          type="button"
        >
          {isPaying ? (
            <span className="button-spinner" />
          ) : (
            <Banknote size={15} />
          )}
          {isPaying ? 'Procesando…' : 'Cobrar pedido'}
        </button>
      </footer>
    </article>
  )
}

function POSDashboard({ cashOpen, onOpenCash }) {
  const dispatch = useDispatch()
  const cash = useSelector((state) => state.cash)
  const activeOrders = useSelector((state) => state.orders.active)
  const isCreating = useSelector((state) => state.orders.isCreating)
  const isOrdersLoading = useSelector((state) => state.orders.isLoading)
  const finalizingOrderId = useSelector(
    (state) => state.orders.finalizingOrderId,
  )
  const { products, categories } = useSelector((state) => state.menu)
  const [filter, setFilter] = useState('ALL')
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [notice, setNotice] = useState(null)

  const availableProducts = useMemo(() => {
    const visibleCategories = new Set(
      categories
        .filter((category) => category.isVisible)
        .map((category) => category.id),
    )
    return products.filter(
      (product) =>
        product.isVisible && visibleCategories.has(product.categoryId),
    )
  }, [categories, products])

  const filteredOrders = activeOrders.filter(
    (order) => filter === 'ALL' || order.type === filter,
  )

  const handleCreateOrder = async (draft) => {
    try {
      await dispatch(createOrder(draft)).unwrap()
      dispatch(clearCart())
      setIsOrderFormOpen(false)
      setNotice({
        message: 'Pedido agregado a la lista activa.',
        kind: 'success',
      })
    } catch (error) {
      if (!cashOpen) onOpenCash()
      else
        setNotice({
          message: error || 'No se pudo crear el pedido.',
          kind: 'error',
        })
    }
  }

  const handleFinalizeOrder = async (paymentMethod) => {
    if (!paymentOrder) return
    try {
      await dispatch(
        finalizeOrder({ orderId: paymentOrder.id, paymentMethod }),
      ).unwrap()
      setPaymentOrder(null)
      setNotice({
        message:
          paymentMethod === 'CASH'
            ? 'Pedido pagado y efectivo sumado a caja.'
            : 'Pedido pagado y enviado al historial.',
        kind: 'success',
      })
    } catch (error) {
      setNotice({
        message: error || 'No se pudo finalizar el pedido.',
        kind: 'error',
      })
      if (!cashOpen) onOpenCash()
    }
  }

  const startOrder = () => {
    if (!cashOpen) {
      onOpenCash()
      return
    }
    if (availableProducts.length === 0) {
      setNotice({
        message: 'No hay productos visibles para vender.',
        kind: 'error',
      })
      return
    }
    setIsOrderFormOpen(true)
  }

  return (
    <main className="workspace-page pos-page" id="workspace">
      <div className="workspace-page-heading pos-page-heading">
        <div>
          <span className="eyebrow">PUNTO DE VENTA</span>
          <h1>Pedidos</h1>
          <p>Pedidos activos del turno y cobros pendientes.</p>
        </div>
        <div className="pos-heading-actions">
          <span
            className={`register-state ${cashOpen ? 'register-open' : 'register-closed'}`}
          >
            <span /> {cashOpen ? `${cash.name} · Abierta` : 'Caja cerrada'}
          </span>
          <button className="primary-button" onClick={startOrder} type="button">
            {cashOpen ? <Plus size={17} /> : <Banknote size={17} />}
            {cashOpen ? 'Nuevo pedido' : 'Abrir caja para vender'}
          </button>
        </div>
      </div>

      {!cashOpen && (
        <section className="cash-gate-banner" role="status">
          <span className="cash-gate-icon">
            <CircleAlert size={19} />
          </span>
          <div>
            <strong>La caja está cerrada</strong>
            <p>
              Declara el monto inicial antes de crear pedidos o registrar
              ventas.
            </p>
          </div>
          <button
            className="secondary-button"
            onClick={onOpenCash}
            type="button"
          >
            <Banknote size={16} /> Abrir caja
          </button>
        </section>
      )}

      {cashOpen && (
        <section className="pos-cash-strip" aria-label="Estado de caja">
          <span className="cash-strip-icon">
            <Banknote size={17} />
          </span>
          <div>
            <strong>{cash.name}</strong>
            <span>
              Turno iniciado {dateTime.format(new Date(cash.openedAt))}
            </span>
          </div>
          <div className="cash-strip-total">
            <span>Efectivo en caja</span>
            <strong>{currency.format(cash.currentTotal)}</strong>
          </div>
          <button
            aria-label="Ver resumen de caja"
            onClick={onOpenCash}
            title="Ver resumen de caja"
            type="button"
          >
            Ver caja
          </button>
        </section>
      )}

      <section className="orders-workspace">
        <div className="orders-toolbar">
          <div
            aria-label="Filtrar pedidos activos"
            className="order-filter-tabs"
            role="group"
          >
            {orderFilters.map((option) => (
              <button
                aria-pressed={filter === option.id}
                className={filter === option.id ? 'order-filter-active' : ''}
                key={option.id}
                onClick={() => setFilter(option.id)}
                type="button"
              >
                {option.label}
                {option.id === 'ALL' && <span>{activeOrders.length}</span>}
                {option.id !== 'ALL' && (
                  <span>
                    {
                      activeOrders.filter((order) => order.type === option.id)
                        .length
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="active-count">
            <Clock3 size={15} /> {activeOrders.length} activos
          </span>
        </div>

        {isOrdersLoading ? (
          <div className="pos-empty-state" role="status">
            <span className="button-spinner" />
            <strong>Cargando pedidos del servidor…</strong>
          </div>
        ) : filteredOrders.length ? (
          <div className="active-orders-grid">
            {filteredOrders.map((order) => (
              <OrderCard
                isPaying={finalizingOrderId === order.id}
                key={order.id}
                onPay={() => setPaymentOrder(order)}
                order={order}
              />
            ))}
          </div>
        ) : (
          <div className="pos-empty-state">
            <span className="pos-empty-icon">
              {cashOpen ? <Utensils size={23} /> : <Store size={23} />}
            </span>
            <strong>
              {cashOpen
                ? 'Todavía no hay pedidos activos'
                : 'Abre caja para empezar el turno'}
            </strong>
            <span>
              {cashOpen
                ? 'Los nuevos pedidos aparecerán aquí para preparar y cobrar.'
                : 'El monto inicial es obligatorio para habilitar las ventas.'}
            </span>
            <button
              className={cashOpen ? 'text-action' : 'primary-button'}
              onClick={cashOpen ? startOrder : onOpenCash}
              type="button"
            >
              {cashOpen ? (
                <>
                  <Plus size={15} /> Crear primer pedido
                </>
              ) : (
                <>
                  <Banknote size={16} /> Abrir caja
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {notice && (
        <div
          className={`toast workspace-toast toast-${notice.kind}`}
          role="status"
        >
          {notice.kind === 'error' ? (
            <CircleAlert size={17} />
          ) : (
            <Check size={17} />
          )}
          <span>{notice.message}</span>
          <button
            aria-label="Cerrar aviso"
            className="icon-button"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {isOrderFormOpen && (
        <OrderFormModal
          isSaving={isCreating}
          onClose={() => !isCreating && setIsOrderFormOpen(false)}
          onSubmit={handleCreateOrder}
          products={availableProducts}
        />
      )}
      {paymentOrder && (
        <PaymentModal
          isSaving={finalizingOrderId === paymentOrder.id}
          onClose={() => !finalizingOrderId && setPaymentOrder(null)}
          onConfirm={handleFinalizeOrder}
          order={paymentOrder}
        />
      )}
    </main>
  )
}

export default POSDashboard
