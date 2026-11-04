import type { Categoria, ModifierGroup, Producto } from '../../types/index.ts'

export interface MenuData {
  categories: Categoria[]
  products: Producto[]
}

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=160&q=80`

let categories: Categoria[] = [
  { id: 'cat-featured', name: 'Destacados', isVisible: true },
  { id: 'cat-main', name: 'Platos', isVisible: true },
  { id: 'cat-desserts', name: 'Postres', isVisible: true },
  { id: 'cat-drinks', name: 'Bebidas', isVisible: true },
]

const meatModifiers: ModifierGroup[] = [
  {
    id: 'group-meat',
    name: 'Término de la carne',
    required: true,
    options: [
      { id: 'mod-medium', name: 'Medio', priceAdjustment: 0 },
      { id: 'mod-well', name: 'Bien cocida', priceAdjustment: 0 },
    ],
  },
]

let products: Producto[] = [
  {
    id: 'product-burger',
    categoryId: 'cat-featured',
    name: 'Hamburguesa de la casa',
    description: 'Res a la parrilla, queso cheddar y salsa de la casa.',
    price: 520,
    discountPrice: 470,
    image: image('photo-1568901346375-23c9450c58cd'),
    isVisible: true,
    trackStock: true,
    stock: 18,
    modifiers: meatModifiers,
  },
  {
    id: 'product-pasta',
    categoryId: 'cat-main',
    name: 'Pasta al pomodoro',
    description: 'Tomate rostizado, albahaca fresca y parmesano.',
    price: 390,
    isVisible: true,
    trackStock: false,
    stock: 0,
    modifiers: [],
  },
  {
    id: 'product-pizza',
    categoryId: 'cat-main',
    name: 'Pizza margarita',
    description: 'Mozzarella, tomate San Marzano y albahaca.',
    price: 480,
    image: image('photo-1513104890138-7c749659a591'),
    isVisible: true,
    trackStock: true,
    stock: 7,
    modifiers: [],
  },
  {
    id: 'product-cake',
    categoryId: 'cat-desserts',
    name: 'Cheesecake de frutos rojos',
    description: 'Porción cremosa con coulis de temporada.',
    price: 210,
    isVisible: false,
    trackStock: true,
    stock: 4,
    modifiers: [],
  },
  {
    id: 'product-lemonade',
    categoryId: 'cat-drinks',
    name: 'Limonada de hierbabuena',
    description: 'Limón fresco, hierbabuena y hielo.',
    price: 150,
    isVisible: true,
    trackStock: false,
    stock: 0,
    modifiers: [],
  },
]

const waitForBackend = () =>
  new Promise((resolve) => window.setTimeout(resolve, 1000))

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export async function fetchMenu(): Promise<MenuData> {
  await waitForBackend()
  return structuredClone({ categories, products })
}

export async function saveProduct(
  draft: Omit<Producto, 'id'> & { id?: string },
): Promise<Producto> {
  await waitForBackend()
  const product = { ...draft, id: draft.id || createId('product') }
  const existingIndex = products.findIndex((item) => item.id === product.id)

  if (existingIndex === -1) products = [...products, product]
  else
    products = products.map((item) => (item.id === product.id ? product : item))

  return structuredClone(product)
}

export async function setProductVisibility(
  id: string,
  isVisible: boolean,
): Promise<Producto> {
  await waitForBackend()
  products = products.map((product) =>
    product.id === id ? { ...product, isVisible } : product,
  )
  const updatedProduct = products.find((product) => product.id === id)
  if (!updatedProduct) throw new Error('No se encontró el producto.')
  return structuredClone(updatedProduct)
}

export async function duplicateProduct(id: string): Promise<Producto> {
  await waitForBackend()
  const source = products.find((product) => product.id === id)
  if (!source) throw new Error('No se encontró el producto.')

  const duplicate = {
    ...structuredClone(source),
    id: createId('product'),
    name: `${source.name} (copia)`,
    isVisible: false,
  }
  products = [...products, duplicate]
  return structuredClone(duplicate)
}

export async function deleteProduct(id: string): Promise<string> {
  await waitForBackend()
  products = products.filter((product) => product.id !== id)
  return id
}

export async function saveCategory(
  draft: Omit<Categoria, 'id'> & { id?: string },
): Promise<Categoria> {
  await waitForBackend()
  const category = { ...draft, id: draft.id || createId('category') }
  const existingIndex = categories.findIndex((item) => item.id === category.id)

  if (existingIndex === -1) categories = [...categories, category]
  else {
    categories = categories.map((item) =>
      item.id === category.id ? category : item,
    )
  }

  return structuredClone(category)
}

export async function setCategoryVisibility(
  id: string,
  isVisible: boolean,
): Promise<Categoria> {
  await waitForBackend()
  categories = categories.map((category) =>
    category.id === id ? { ...category, isVisible } : category,
  )
  const updatedCategory = categories.find((category) => category.id === id)
  if (!updatedCategory) throw new Error('No se encontró la categoría.')
  return structuredClone(updatedCategory)
}

export async function deleteCategory(id: string): Promise<string> {
  await waitForBackend()
  if (products.some((product) => product.categoryId === id)) {
    throw new Error('Mueve los productos antes de eliminar esta categoría.')
  }
  categories = categories.filter((category) => category.id !== id)
  return id
}
