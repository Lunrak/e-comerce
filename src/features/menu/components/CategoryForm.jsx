import { useState } from 'react'
import { X } from 'lucide-react'

function CategoryForm({ category, isSaving, onClose, onSave }) {
  const [name, setName] = useState(category?.name ?? '')
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true)
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim()) {
      setValidationError('Escribe un nombre para la categoría.')
      return
    }
    setValidationError('')
    onSave({ id: category?.id, name: name.trim(), isVisible })
  }

  return (
    <div className="overlay-layer" onMouseDown={onClose}>
      <section
        aria-labelledby="category-form-title"
        aria-modal="true"
        className="dialog-panel category-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="drawer-header">
          <div>
            <span className="eyebrow">ORGANIZACIÓN</span>
            <h2 id="category-form-title">
              {category ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <form className="category-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="category-name">
            Nombre de la categoría
            <input
              autoFocus
              id="category-name"
              maxLength={45}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Entradas"
              required
              value={name}
            />
          </label>
          {validationError && (
            <p className="form-error" role="alert">
              {validationError}
            </p>
          )}

          <label className="switch-card category-visibility">
            <div>
              <strong>Visible en el menú</strong>
              <span>La categoría se mostrará a los clientes</span>
            </div>
            <span className="switch-control">
              <input
                checked={isVisible}
                onChange={(event) => setIsVisible(event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" className="switch-track" />
            </span>
          </label>

          <footer className="drawer-footer">
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
              disabled={isSaving}
              type="submit"
            >
              {isSaving && <span className="button-spinner" />}
              {isSaving ? 'Guardando…' : 'Guardar categoría'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CategoryForm
