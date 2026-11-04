import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Archive,
  Check,
  ChevronDown,
  CircleAlert,
  CirclePlus,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers3,
  ListFilter,
  LoaderCircle,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import {
  deleteMenuCategory,
  deleteMenuProduct,
  duplicateMenuProduct,
  fetchMenu,
  saveMenuCategory,
  saveMenuProduct,
  setMenuCategoryVisibility,
  setMenuProductVisibility,
} from '../menuSlice.js'
import CategoryForm from './CategoryForm.jsx'
import MenuSkeleton from './MenuSkeleton.jsx'
import ProductEditForm from './ProductEditForm.jsx'
import './MenuManager.css'

const currency = new Intl.NumberFormat('es-CU', {
  style: 'currency',
  currency: 'CUP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
})

const filterOptions = [
  { id: 'all', label: 'Todos' },
  { id: 'visible', label: 'Visibles' },
  { id: 'hidden', label: 'Ocultos' },
]

function ProductRow({
  product,
  isMutating,
  menuOpen,
  onEdit,
  onMenuToggle,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}) {
  return (
    <article className={`product-row ${product.isVisible ? '' : 'is-hidden'}`}>
      {product.image ? (
        <img alt="" className="product-image" src={product.image} />
      ) : (
        <div className="product-image image-placeholder">
          <ImageIcon size={20} strokeWidth={1.7} />
        </div>
      )}
      <button className="product-copy" onClick={onEdit} type="button">
        <span className="product-name-line">
          <strong>{product.name}</strong>
          {!product.isVisible && <span className="visibility-dot hidden-dot" />}
        </span>
        <span className="product-description">
          {product.description || 'Sin descripción'}
        </span>
      </button>
      <div className="product-price">
        {product.discountPrice ? (
          <>
            <strong>{currency.format(product.discountPrice)}</strong>
            <span className="old-price">{currency.format(product.price)}</span>
          </>
        ) : (
          <strong>{currency.format(product.price)}</strong>
        )}
      </div>
      <div className="product-inventory">
        {product.trackStock ? (
          <span
            className={`stock-label ${product.stock <= 5 ? 'low-stock' : ''}`}
          >
            <PackageCheck size={15} /> {product.stock} unidades
          </span>
        ) : (
          <span className="stock-label no-stock">Sin control</span>
        )}
      </div>
      <div className="product-actions">
        <button
          aria-label={`Acciones de ${product.name}`}
          aria-expanded={menuOpen}
          className="icon-button row-menu-trigger"
          disabled={isMutating}
          onClick={onMenuToggle}
          type="button"
        >
          <Ellipsis size={19} />
        </button>
        {menuOpen && (
          <div className="action-popover product-popover" role="menu">
            <button onClick={onEdit} role="menuitem" type="button">
              <Pencil size={15} /> Editar producto
            </button>
            <button onClick={onToggleVisibility} role="menuitem" type="button">
              {product.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              {product.isVisible ? 'Ocultar del menú' : 'Mostrar en el menú'}
            </button>
            <button onClick={onDuplicate} role="menuitem" type="button">
              <Copy size={15} /> Duplicar
            </button>
            <span className="popover-divider" />
            <button
              className="danger-action"
              onClick={onDelete}
              role="menuitem"
              type="button"
            >
              <Trash2 size={15} /> Eliminar producto
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function CategorySection({
  category,
  products,
  totalProductCount,
  visibleProductCount,
  collapsed,
  activeMenu,
  isMutating,
  onCollapse,
  onAddProduct,
  onEditCategory,
  onToggleVisibility,
  onDeleteCategory,
  onToggleMenu,
  onEditProduct,
  onToggleProduct,
  onDuplicateProduct,
  onDeleteProduct,
}) {
  return (
    <section
      className={`category-section ${category.isVisible ? '' : 'category-hidden'}`}
    >
      <header className="category-heading">
        <button
          aria-expanded={!collapsed}
          className="category-collapse"
          onClick={onCollapse}
          type="button"
        >
          <ChevronDown
            className={collapsed ? 'chevron-collapsed' : ''}
            size={18}
          />
          <span className="category-marker">
            <Layers3 size={16} />
          </span>
          <span className="category-title-block">
            <strong>{category.name}</strong>
            <span>
              {totalProductCount}{' '}
              {totalProductCount === 1 ? 'producto' : 'productos'}
              {!category.isVisible && (
                <span className="hidden-category-label"> · Oculta</span>
              )}
            </span>
          </span>
        </button>
        <div className="category-tools">
          <span className="visible-count">
            <span className="visibility-dot" /> {visibleProductCount} visibles
          </span>
          <button
            aria-label={`Agregar producto a ${category.name}`}
            className="icon-button add-in-category"
            onClick={onAddProduct}
            title="Agregar producto"
            type="button"
          >
            <Plus size={17} />
          </button>
          <div className="category-menu-wrap">
            <button
              aria-expanded={activeMenu === `category:${category.id}`}
              aria-label={`Acciones de ${category.name}`}
              className="icon-button row-menu-trigger"
              disabled={isMutating}
              onClick={() => onToggleMenu(`category:${category.id}`)}
              type="button"
            >
              <Ellipsis size={19} />
            </button>
            {activeMenu === `category:${category.id}` && (
              <div className="action-popover category-popover" role="menu">
                <button onClick={onEditCategory} role="menuitem" type="button">
                  <Pencil size={15} /> Editar categoría
                </button>
                <button
                  onClick={onToggleVisibility}
                  role="menuitem"
                  type="button"
                >
                  {category.isVisible ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                  {category.isVisible
                    ? 'Ocultar categoría'
                    : 'Mostrar categoría'}
                </button>
                <span className="popover-divider" />
                <button
                  className="danger-action"
                  disabled={totalProductCount > 0}
                  onClick={onDeleteCategory}
                  role="menuitem"
                  title={
                    totalProductCount > 0
                      ? 'Mueve los productos antes de eliminar esta categoría.'
                      : undefined
                  }
                  type="button"
                >
                  <Trash2 size={15} /> Eliminar categoría
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {!collapsed && (
        <div className="category-products">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductRow
                isMutating={isMutating}
                key={product.id}
                menuOpen={activeMenu === `product:${product.id}`}
                onDelete={() => onDeleteProduct(product)}
                onDuplicate={() => onDuplicateProduct(product)}
                onEdit={() => onEditProduct(product)}
                onMenuToggle={() => onToggleMenu(`product:${product.id}`)}
                onToggleVisibility={() => onToggleProduct(product)}
                product={product}
              />
            ))
          ) : (
            <div className="category-empty-row">
              <span>
                {totalProductCount
                  ? 'No hay productos con este filtro.'
                  : 'Esta categoría todavía no tiene productos.'}
              </span>
              {totalProductCount === 0 && (
                <button
                  className="text-action"
                  onClick={onAddProduct}
                  type="button"
                >
                  <Plus size={15} /> Agregar producto
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ConfirmDialog({ item, onCancel, onConfirm, isMutating }) {
  return (
    <div className="overlay-layer confirm-overlay" onMouseDown={onCancel}>
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="dialog-panel confirm-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="confirm-icon">
          <Trash2 size={19} />
        </div>
        <button
          aria-label="Cerrar confirmación"
          className="icon-button confirm-close"
          onClick={onCancel}
          type="button"
        >
          <X size={18} />
        </button>
        <span className="eyebrow">ACCIÓN PERMANENTE</span>
        <h2 id="confirm-title">¿Eliminar {item.type}?</h2>
        <p>
          <strong>{item.name}</strong> dejará de estar disponible en el menú.
          Esta acción no se puede deshacer.
        </p>
        {item.type === 'categoría' && item.count > 0 && (
          <p className="form-error">
            Mueve sus {item.count} productos a otra categoría antes de
            eliminarla.
          </p>
        )}
        <footer className="confirm-actions">
          <button
            className="secondary-button"
            disabled={isMutating}
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="danger-button"
            disabled={
              isMutating || (item.type === 'categoría' && item.count > 0)
            }
            onClick={onConfirm}
            type="button"
          >
            {isMutating ? (
              <span className="button-spinner" />
            ) : (
              <Trash2 size={15} />
            )}
            Eliminar
          </button>
        </footer>
      </section>
    </div>
  )
}

function MenuManager() {
  const dispatch = useDispatch()
  const { categories, products, status, isMutating, error } = useSelector(
    (state) => state.menu,
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [openMenu, setOpenMenu] = useState(null)
  const [editor, setEditor] = useState(null)
  const [categoryEditor, setCategoryEditor] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchMenu())
  }, [dispatch, status])

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  const visibleProducts = products.filter((product) => product.isVisible).length
  const displayedCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()

    return categories
      .map((category) => {
        const categoryMatches = category.name
          .toLocaleLowerCase()
          .includes(normalizedSearch)
        const categoryProducts = products.filter((product) => {
          if (product.categoryId !== category.id) return false
          if (filter === 'visible' && !product.isVisible) return false
          if (filter === 'hidden' && product.isVisible) return false
          if (!normalizedSearch || categoryMatches) return true
          return `${product.name} ${product.description}`
            .toLocaleLowerCase()
            .includes(normalizedSearch)
        })
        const totalProductCount = products.filter(
          (product) => product.categoryId === category.id,
        ).length
        const visibleProductCount = products.filter(
          (product) => product.categoryId === category.id && product.isVisible,
        ).length
        return {
          category,
          products: categoryProducts,
          totalProductCount,
          visibleProductCount,
          categoryMatches,
        }
      })
      .filter(
        ({ products: categoryProducts, categoryMatches }) =>
          !normalizedSearch || categoryMatches || categoryProducts.length > 0,
      )
  }, [categories, filter, products, search])

  const showNotice = (message, kind = 'success') => {
    setNotice({ message, kind })
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200)
  }

  const runMutation = async (request, successMessage) => {
    try {
      await dispatch(request).unwrap()
      showNotice(successMessage)
      return true
    } catch (mutationError) {
      showNotice(mutationError || 'No se pudo completar la acción.', 'error')
      return false
    }
  }

  const handleSaveProduct = async (product) => {
    const saved = await runMutation(
      saveMenuProduct(product),
      'Producto guardado',
    )
    if (saved) setEditor(null)
  }

  const handleSaveCategory = async (category) => {
    const saved = await runMutation(
      saveMenuCategory(category),
      'Categoría guardada',
    )
    if (saved) setCategoryEditor(null)
  }

  const toggleProductVisibility = (product) => {
    setOpenMenu(null)
    runMutation(
      setMenuProductVisibility({
        id: product.id,
        isVisible: !product.isVisible,
      }),
      product.isVisible ? 'Producto oculto' : 'Producto visible',
    )
  }

  const toggleCategoryVisibility = (category) => {
    setOpenMenu(null)
    runMutation(
      setMenuCategoryVisibility({
        id: category.id,
        isVisible: !category.isVisible,
      }),
      category.isVisible ? 'Categoría oculta' : 'Categoría visible',
    )
  }

  const handleConfirmDelete = async () => {
    if (!confirmation) return
    const { type, id } = confirmation
    const deleted = await runMutation(
      type === 'producto' ? deleteMenuProduct(id) : deleteMenuCategory(id),
      `${type === 'producto' ? 'Producto' : 'Categoría'} eliminado`,
    )
    if (deleted) setConfirmation(null)
  }

  const productCount = products.length
  const hiddenCount = productCount - visibleProducts

  return (
    <div
      className="menu-app"
      onClick={(event) => {
        if (!event.target.closest('.row-menu-trigger, .action-popover'))
          setOpenMenu(null)
      }}
    >
      <header className="topbar">
        <a aria-label="Mesa, inicio" className="brand-lockup" href="#menu">
          <span className="brand-mark">
            <UtensilsCrossed size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-name">
            mesa<span>.</span>
          </span>
          <span className="brand-divider" />
          <span className="brand-product">GESTIÓN</span>
        </a>
        <div className="topbar-right">
          <div className="store-switcher">
            <span className="store-avatar">
              <Store size={15} />
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

      <main className="manager-shell" id="menu">
        <div className="page-heading">
          <div>
            <div className="breadcrumb">
              <span>NEGOCIO</span>
              <span>/</span>
              <strong>MENÚ</strong>
            </div>
            <h1>Tu menú, al día.</h1>
            <p className="page-subtitle">
              {categories.length} categorías <span>·</span> {productCount}{' '}
              productos
            </p>
          </div>
          <div className="heading-actions">
            <button
              className="secondary-button"
              onClick={() => setCategoryEditor({ category: null })}
              type="button"
            >
              <CirclePlus size={17} /> Nueva categoría
            </button>
            <button
              className="primary-button"
              disabled={categories.length === 0}
              onClick={() =>
                setEditor({ product: null, categoryId: categories[0]?.id })
              }
              title={
                categories.length === 0
                  ? 'Crea primero una categoría'
                  : undefined
              }
              type="button"
            >
              <Plus size={17} /> Nuevo producto
            </button>
          </div>
        </div>

        <section aria-label="Resumen del menú" className="menu-overview">
          <div className="overview-primary">
            <span className="overview-icon">
              <UtensilsCrossed size={17} />
            </span>
            <div>
              <strong>Catálogo activo</strong>
              <span>Actualizado ahora</span>
            </div>
          </div>
          <div className="overview-stat">
            <span>Visibles</span>
            <strong>{visibleProducts}</strong>
          </div>
          <div className="overview-stat">
            <span>Ocultos</span>
            <strong>{hiddenCount}</strong>
          </div>
          <div className="overview-stat overview-stat-last">
            <span>En oferta</span>
            <strong>
              {products.filter((product) => product.discountPrice).length}
            </strong>
          </div>
          <div aria-hidden="true" className="overview-decoration">
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-heading">
            <div>
              <span className="eyebrow">CATÁLOGO</span>
              <h2>Productos y categorías</h2>
            </div>
            <span className="catalog-count">
              <span className="catalog-count-dot" /> {productCount} productos
            </span>
          </div>
          <div className="catalog-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar productos o categorías"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en el menú"
                type="search"
                value={search}
              />
              {search && (
                <button
                  aria-label="Limpiar búsqueda"
                  className="search-clear"
                  onClick={() => setSearch('')}
                  type="button"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <div
              aria-label="Filtrar productos"
              className="filter-control"
              role="group"
            >
              <ListFilter className="filter-icon" size={16} />
              {filterOptions.map((option) => (
                <button
                  aria-pressed={filter === option.id}
                  className={filter === option.id ? 'filter-active' : ''}
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {status === 'loading' && <MenuSkeleton />}
          {status === 'failed' && (
            <div className="load-error" role="alert">
              <CircleAlert size={20} />
              <div>
                <strong>No se pudo cargar el menú</strong>
                <span>{error || 'Intenta nuevamente.'}</span>
              </div>
              <button
                className="secondary-button"
                onClick={() => dispatch(fetchMenu())}
                type="button"
              >
                Reintentar
              </button>
            </div>
          )}
          {status === 'succeeded' && (
            <div className="category-list">
              {displayedCategories.map(
                ({
                  category,
                  products: categoryProducts,
                  totalProductCount,
                  visibleProductCount,
                }) => (
                  <CategorySection
                    activeMenu={openMenu}
                    category={category}
                    collapsed={Boolean(collapsedCategories[category.id])}
                    isMutating={isMutating}
                    key={category.id}
                    onAddProduct={() =>
                      setEditor({ product: null, categoryId: category.id })
                    }
                    onCollapse={() =>
                      setCollapsedCategories((current) => ({
                        ...current,
                        [category.id]: !current[category.id],
                      }))
                    }
                    onDeleteCategory={() => {
                      setOpenMenu(null)
                      setConfirmation({
                        type: 'categoría',
                        id: category.id,
                        name: category.name,
                        count: totalProductCount,
                      })
                    }}
                    onDeleteProduct={(product) =>
                      setConfirmation({
                        type: 'producto',
                        id: product.id,
                        name: product.name,
                        count: 0,
                      })
                    }
                    onDuplicateProduct={(product) => {
                      setOpenMenu(null)
                      runMutation(
                        duplicateMenuProduct(product.id),
                        'Copia creada y guardada como oculta',
                      )
                    }}
                    onEditCategory={() => {
                      setOpenMenu(null)
                      setCategoryEditor({ category })
                    }}
                    onEditProduct={(product) => {
                      setOpenMenu(null)
                      setEditor({ product })
                    }}
                    onToggleMenu={(menuKey) =>
                      setOpenMenu((current) =>
                        current === menuKey ? null : menuKey,
                      )
                    }
                    onToggleProduct={toggleProductVisibility}
                    onToggleVisibility={() =>
                      toggleCategoryVisibility(category)
                    }
                    products={categoryProducts}
                    totalProductCount={totalProductCount}
                    visibleProductCount={visibleProductCount}
                  />
                ),
              )}
              {displayedCategories.length === 0 && categories.length > 0 && (
                <div className="empty-results">
                  <span className="empty-results-icon">
                    <Search size={20} />
                  </span>
                  <strong>No hay resultados</strong>
                  <span>Prueba otra búsqueda o cambia el filtro.</span>
                  <button
                    className="text-action"
                    onClick={() => {
                      setSearch('')
                      setFilter('all')
                    }}
                    type="button"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
              {categories.length === 0 && (
                <div className="empty-results">
                  <span className="empty-results-icon">
                    <Archive size={20} />
                  </span>
                  <strong>Empieza por crear una categoría</strong>
                  <span>Luego podrás agregar productos a tu menú.</span>
                  <button
                    className="primary-button"
                    onClick={() => setCategoryEditor({ category: null })}
                    type="button"
                  >
                    <Plus size={16} /> Nueva categoría
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="manager-footer">
          <span>
            {isMutating ? (
              <LoaderCircle className="spin-icon" size={14} />
            ) : (
              <Check size={14} />
            )}
            {isMutating ? 'Guardando cambios…' : 'Cambios sincronizados'}
          </span>
          <span>API simulada · 1 s</span>
        </footer>
      </main>

      {editor && (
        <ProductEditForm
          categories={categories}
          initialCategoryId={editor.categoryId}
          isSaving={isMutating}
          onClose={() => !isMutating && setEditor(null)}
          onSave={handleSaveProduct}
          product={editor.product}
        />
      )}
      {categoryEditor && (
        <CategoryForm
          category={categoryEditor.category}
          isSaving={isMutating}
          onClose={() => !isMutating && setCategoryEditor(null)}
          onSave={handleSaveCategory}
        />
      )}
      {confirmation && (
        <ConfirmDialog
          isMutating={isMutating}
          item={confirmation}
          onCancel={() => !isMutating && setConfirmation(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {notice && (
        <div className={`toast toast-${notice.kind}`} role="status">
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
    </div>
  )
}

export default MenuManager
