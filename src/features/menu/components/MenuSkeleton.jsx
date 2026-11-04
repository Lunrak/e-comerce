function MenuSkeleton() {
  return (
    <div aria-label="Cargando menú" className="menu-skeleton" role="status">
      <span className="sr-only">Cargando productos y categorías</span>
      {[0, 1, 2].map((section) => (
        <section className="skeleton-category" key={section}>
          <div className="skeleton-line skeleton-heading" />
          <div className="skeleton-product">
            <div className="skeleton-thumb" />
            <div className="skeleton-copy">
              <div className="skeleton-line" />
              <div className="skeleton-line short-line" />
            </div>
            <div className="skeleton-line skeleton-price" />
          </div>
          <div className="skeleton-product">
            <div className="skeleton-thumb" />
            <div className="skeleton-copy">
              <div className="skeleton-line" />
              <div className="skeleton-line short-line" />
            </div>
            <div className="skeleton-line skeleton-price" />
          </div>
        </section>
      ))}
    </div>
  )
}

export default MenuSkeleton
