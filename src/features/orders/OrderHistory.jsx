import { useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, Search } from 'lucide-react'
import { useSelector } from 'react-redux'

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

const orderTypes = {
  LOCAL: 'Mostrador',
  DELIVERY: 'A domicilio',
  TABLE: 'Mesa',
}

const paymentLabels = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}

function OrderHistory() {
  const history = useSelector((state) => state.orders.history)
  const isLoading = useSelector((state) => state.orders.historyLoading)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')

  const filteredOrders = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
    const normalizedSearch = search.trim().toLocaleLowerCase()

    return history.filter((order) => {
      const paidAt = new Date(order.paidAt || order.createdAt)
      if (from && paidAt < from) return false
      if (to && paidAt > to) return false
      if (!normalizedSearch) return true
      return `${order.id} ${order.customerName || ''} ${orderTypes[order.type]}`
        .toLocaleLowerCase()
        .includes(normalizedSearch)
    })
  }, [fromDate, history, search, toDate])

  const total = filteredOrders.reduce((sum, order) => sum + order.total, 0)

  return (
    <main className="workspace-page history-page" id="workspace">
      <div className="workspace-page-heading">
        <div>
          <span className="eyebrow">VENTAS</span>
          <h1>Historial de pedidos</h1>
          <p>Pedidos pagados y movimientos del período seleccionado.</p>
        </div>
        <div className="history-total">
          <span>{filteredOrders.length} pedidos</span>
          <strong>{currency.format(total)}</strong>
        </div>
      </div>

      <section className="history-controls" aria-label="Filtros del historial">
        <label className="history-search">
          <Search size={16} />
          <input
            aria-label="Buscar en el historial"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pedido o cliente"
            type="search"
            value={search}
          />
        </label>
        <label className="history-date-field">
          <CalendarDays size={15} />
          <span>Desde</span>
          <input
            aria-label="Fecha desde"
            onChange={(event) => setFromDate(event.target.value)}
            type="date"
            value={fromDate}
          />
        </label>
        <label className="history-date-field">
          <CalendarDays size={15} />
          <span>Hasta</span>
          <input
            aria-label="Fecha hasta"
            onChange={(event) => setToDate(event.target.value)}
            type="date"
            value={toDate}
          />
        </label>
        {(fromDate || toDate || search) && (
          <button
            className="text-action"
            onClick={() => {
              setFromDate('')
              setToDate('')
              setSearch('')
            }}
            type="button"
          >
            Limpiar filtros
          </button>
        )}
      </section>

      <section aria-label="Pedidos pagados" className="history-table-wrap">
        <div className="history-table-head">
          <span>Pedido</span>
          <span>Fecha y hora</span>
          <span>Tipo</span>
          <span>Cliente</span>
          <span>Pago</span>
          <span>Total</span>
          <span>Estado</span>
        </div>
        {isLoading ? (
          <div className="history-empty" role="status">
            <span className="button-spinner" />
            <strong>Cargando historial…</strong>
          </div>
        ) : filteredOrders.length ? (
          filteredOrders.map((order) => (
            <article className="history-row" key={order.id}>
              <strong className="history-order-id">
                #{order.id.slice(-4)}
              </strong>
              <span className="history-date">
                {dateTime.format(new Date(order.paidAt || order.createdAt))}
              </span>
              <span>{orderTypes[order.type]}</span>
              <span className="history-customer">
                {order.customerName || 'Cliente de mostrador'}
              </span>
              <span className="history-payment">
                {paymentLabels[order.paymentMethod] || '—'}
              </span>
              <strong className="history-order-total">
                {currency.format(order.total)}
              </strong>
              <span className="paid-status">Pagado</span>
            </article>
          ))
        ) : (
          <div className="history-empty">
            <span>
              <ClipboardList size={20} />
            </span>
            <strong>
              {history.length
                ? 'Sin resultados para esas fechas'
                : 'Aún no hay pedidos pagados'}
            </strong>
            <p>
              {history.length
                ? 'Cambia el rango o limpia los filtros.'
                : 'Los pedidos finalizados aparecerán aquí.'}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

export default OrderHistory
