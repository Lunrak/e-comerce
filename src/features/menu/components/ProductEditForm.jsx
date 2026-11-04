import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function ProductEditForm({
  product,
  categories,
  initialCategoryId,
  isSaving,
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(() => ({
    id: product?.id,
    categoryId:
      product?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    discountPrice: product?.discountPrice ?? '',
    image: product?.image ?? '',
    isVisible: product?.isVisible ?? true,
    trackStock: product?.trackStock ?? false,
    stock: product?.stock ?? 0,
    modifiers: structuredClone(product?.modifiers ?? []),
  }))
  const [validationError, setValidationError] = useState('')

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateModifierGroup = (groupId, key, value) => {
    setDraft((current) => ({
      ...current,
      modifiers: current.modifiers.map((group) =>
        group.id === groupId ? { ...group, [key]: value } : group,
      ),
    }))
  }

  const updateModifierOption = (groupId, optionId, key, value) => {
    setDraft((current) => ({
      ...current,
      modifiers: current.modifiers.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, [key]: value } : option,
              ),
            }
          : group,
      ),
    }))
  }

  const addModifierGroup = () => {
    setDraft((current) => ({
      ...current,
      modifiers: [
        ...current.modifiers,
        {
          id: createId('group'),
          name: '',
          required: false,
          options: [],
        },
      ],
    }))
  }

  const addModifierOption = (groupId) => {
    setDraft((current) => ({
      ...current,
      modifiers: current.modifiers.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                { id: createId('option'), name: '', priceAdjustment: 0 },
              ],
            }
          : group,
      ),
    }))
  }

  const removeModifierGroup = (groupId) => {
    setDraft((current) => ({
      ...current,
      modifiers: current.modifiers.filter((group) => group.id !== groupId),
    }))
  }

  const removeModifierOption = (groupId, optionId) => {
    setDraft((current) => ({
      ...current,
      modifiers: current.modifiers.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((option) => option.id !== optionId),
            }
          : group,
      ),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setValidationError('')

    if (!draft.name.trim()) {
      setValidationError('Escribe un nombre para el producto.')
      return
    }

    const emptyRequiredGroup = draft.modifiers.find(
      (group) =>
        group.name.trim() &&
        group.required &&
        !group.options.some((option) => option.name.trim()),
    )

    if (emptyRequiredGroup) {
      setValidationError(
        `Agrega al menos una opción a “${emptyRequiredGroup.name}”.`,
      )
      return
    }

    const price = Number(draft.price)
    const discountPrice =
      draft.discountPrice === '' ? undefined : Number(draft.discountPrice)

    if (discountPrice !== undefined && discountPrice >= price) {
      setValidationError(
        'El precio de oferta debe ser menor al precio regular.',
      )
      return
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      price,
      discountPrice,
      stock: draft.trackStock ? Number(draft.stock) : 0,
      modifiers: draft.modifiers
        .filter((group) => group.name.trim())
        .map((group) => ({
          ...group,
          name: group.name.trim(),
          options: group.options
            .filter((option) => option.name.trim())
            .map((option) => ({
              ...option,
              name: option.name.trim(),
              priceAdjustment: Number(option.priceAdjustment) || 0,
            })),
        })),
    })
  }

  return (
    <div className="overlay-layer" onMouseDown={onClose}>
      <aside
        aria-labelledby="product-form-title"
        aria-modal="true"
        className="edit-drawer"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="drawer-header">
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h2 id="product-form-title">
              {product ? 'Editar producto' : 'Nuevo producto'}
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

        <form className="drawer-form" onSubmit={handleSubmit}>
          <div className="drawer-scroll-area">
            <section className="form-section">
              <div className="form-section-heading">
                <span className="section-index">01</span>
                <div>
                  <h3>Información básica</h3>
                  <p>Nombre y ubicación en el menú</p>
                </div>
              </div>

              <label className="field-label" htmlFor="product-name">
                Nombre del producto
                <input
                  autoComplete="off"
                  id="product-name"
                  maxLength={70}
                  onChange={(event) => updateDraft('name', event.target.value)}
                  placeholder="Ej. Hamburguesa de la casa"
                  required
                  value={draft.name}
                />
              </label>

              <label className="field-label" htmlFor="product-description">
                Descripción
                <textarea
                  id="product-description"
                  maxLength={180}
                  onChange={(event) =>
                    updateDraft('description', event.target.value)
                  }
                  placeholder="Ingredientes, preparación o detalles del plato"
                  rows={3}
                  value={draft.description}
                />
                <span className="field-hint">
                  {draft.description.length}/180 caracteres
                </span>
              </label>

              <label className="field-label" htmlFor="product-category">
                Categoría
                <select
                  id="product-category"
                  onChange={(event) =>
                    updateDraft('categoryId', event.target.value)
                  }
                  required
                  value={draft.categoryId}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <span className="section-index">02</span>
                <div>
                  <h3>Precio e inventario</h3>
                  <p>Precios en CUP</p>
                </div>
              </div>

              <div className="field-grid">
                <label className="field-label" htmlFor="product-price">
                  Precio regular
                  <div className="input-suffix">
                    <input
                      id="product-price"
                      min="0"
                      onChange={(event) =>
                        updateDraft('price', event.target.value)
                      }
                      placeholder="0"
                      required
                      step="0.01"
                      type="number"
                      value={draft.price}
                    />
                    <span>CUP</span>
                  </div>
                </label>

                <label className="field-label" htmlFor="product-discount">
                  Precio de oferta
                  <div className="input-suffix">
                    <input
                      id="product-discount"
                      min="0"
                      onChange={(event) =>
                        updateDraft('discountPrice', event.target.value)
                      }
                      placeholder="Opcional"
                      step="0.01"
                      type="number"
                      value={draft.discountPrice}
                    />
                    <span>CUP</span>
                  </div>
                </label>
              </div>

              <div className="switch-card">
                <div>
                  <strong>Control de stock</strong>
                  <span>Descuenta unidades al registrar ventas</span>
                </div>
                <label className="switch-control">
                  <input
                    checked={draft.trackStock}
                    onChange={(event) =>
                      updateDraft('trackStock', event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" className="switch-track" />
                  <span className="sr-only">Control de stock</span>
                </label>
              </div>

              {draft.trackStock && (
                <label
                  className="field-label stock-field"
                  htmlFor="product-stock"
                >
                  Unidades disponibles
                  <input
                    id="product-stock"
                    min="0"
                    onChange={(event) =>
                      updateDraft('stock', event.target.value)
                    }
                    required
                    step="1"
                    type="number"
                    value={draft.stock}
                  />
                </label>
              )}
            </section>

            <section className="form-section modifier-section">
              <div className="form-section-heading">
                <span className="section-index">03</span>
                <div>
                  <h3>Modificadores</h3>
                  <p>Opciones adicionales para el pedido</p>
                </div>
              </div>

              {draft.modifiers.length === 0 && (
                <div className="modifier-empty">
                  <span>Sin modificadores</span>
                  <span>Agrega opciones como término o extras.</span>
                </div>
              )}

              <div className="modifier-groups">
                {draft.modifiers.map((group, groupIndex) => (
                  <fieldset className="modifier-group" key={group.id}>
                    <div className="modifier-group-topline">
                      <span className="modifier-number">
                        {String(groupIndex + 1).padStart(2, '0')}
                      </span>
                      <button
                        aria-label={`Eliminar grupo ${group.name || groupIndex + 1}`}
                        className="icon-button subtle-button"
                        onClick={() => removeModifierGroup(group.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <label
                      className="field-label"
                      htmlFor={`group-${group.id}`}
                    >
                      Nombre del grupo
                      <input
                        id={`group-${group.id}`}
                        onChange={(event) =>
                          updateModifierGroup(
                            group.id,
                            'name',
                            event.target.value,
                          )
                        }
                        placeholder="Ej. Término de la carne"
                        value={group.name}
                      />
                    </label>
                    <label className="checkbox-row">
                      <input
                        checked={group.required}
                        onChange={(event) =>
                          updateModifierGroup(
                            group.id,
                            'required',
                            event.target.checked,
                          )
                        }
                        type="checkbox"
                      />
                      Selección obligatoria
                    </label>

                    <div className="modifier-options">
                      {group.options.map((option) => (
                        <div className="modifier-option" key={option.id}>
                          <input
                            aria-label="Nombre de la opción"
                            onChange={(event) =>
                              updateModifierOption(
                                group.id,
                                option.id,
                                'name',
                                event.target.value,
                              )
                            }
                            placeholder="Ej. Medio"
                            value={option.name}
                          />
                          <div className="modifier-price">
                            <span>+</span>
                            <input
                              aria-label="Precio adicional en CUP"
                              min="0"
                              onChange={(event) =>
                                updateModifierOption(
                                  group.id,
                                  option.id,
                                  'priceAdjustment',
                                  event.target.value,
                                )
                              }
                              step="0.01"
                              type="number"
                              value={option.priceAdjustment}
                            />
                            <span>CUP</span>
                          </div>
                          <button
                            aria-label={`Eliminar opción ${option.name || ''}`}
                            className="icon-button subtle-button"
                            onClick={() =>
                              removeModifierOption(group.id, option.id)
                            }
                            type="button"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="text-action add-option"
                      onClick={() => addModifierOption(group.id)}
                      type="button"
                    >
                      <Plus size={15} /> Agregar opción
                    </button>
                  </fieldset>
                ))}
              </div>

              <button
                className="secondary-button add-group-button"
                onClick={addModifierGroup}
                type="button"
              >
                <Plus size={16} /> Agregar grupo de modificadores
              </button>
            </section>

            <label className="switch-card visibility-switch">
              <div>
                <strong>Visible en el menú</strong>
                <span>El cliente podrá encontrar este producto</span>
              </div>
              <span className="switch-control">
                <input
                  checked={draft.isVisible}
                  onChange={(event) =>
                    updateDraft('isVisible', event.target.checked)
                  }
                  type="checkbox"
                />
                <span aria-hidden="true" className="switch-track" />
              </span>
            </label>

            {validationError && (
              <p className="form-error" role="alert">
                {validationError}
              </p>
            )}
          </div>

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
              {isSaving ? (
                <span className="button-spinner" />
              ) : (
                <Plus size={16} />
              )}
              {isSaving ? 'Guardando…' : 'Guardar producto'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}

export default ProductEditForm
