import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UtensilsCrossed,
} from 'lucide-react'
import { signIn } from './authSlice.js'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import './LoginPage.css'

function LoginPage() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    try {
      await dispatch(signIn({ email: email.trim(), password })).unwrap()
    } catch (signInError) {
      setFormError(signInError || 'No se pudo iniciar sesión.')
    }
  }

  const errorMessage = formError || error

  return (
    <main className="login-screen">
      <section className="login-art-panel" aria-hidden="true">
        <div className="login-art-topline">
          <span className="login-art-mark">
            <UtensilsCrossed size={18} />
          </span>
          <span>OPERACIONES · RESTAURANTE</span>
        </div>
        <div className="login-art-content">
          <span className="login-art-index">01 / ACCESO DE EQUIPO</span>
          <h1>El ritmo de tu restaurante, en un solo lugar.</h1>
          <p>Pedidos, caja y menú listos para cada turno.</p>
        </div>
        <div className="login-art-grid" />
        <div className="login-art-caption">
          <span /> SISTEMA DE GESTIÓN · CUP
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <a aria-label="Mesa, inicio" className="login-brand" href="#login">
            <span className="brand-mark">
              <UtensilsCrossed size={18} />
            </span>
            <span className="brand-name">
              mesa<span>.</span>
            </span>
          </a>
          <span className="login-eyebrow">PORTAL DEL EQUIPO</span>
          <h2>Bienvenido de vuelta</h2>
          <p className="login-intro">
            Inicia sesión con tu cuenta de trabajo para continuar.
          </p>

          {!isSupabaseConfigured && (
            <div className="login-config-alert" role="alert">
              Falta conectar Supabase. Configura la URL y la clave pública en{' '}
              <code>.env.local</code>.
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Correo electrónico
              <input
                autoComplete="username"
                disabled={!isSupabaseConfigured || status === 'authenticating'}
                id="login-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@restaurante.com"
                required
                type="email"
                value={email}
              />
            </label>
            <label htmlFor="login-password">
              Contraseña
              <span className="login-password-wrap">
                <LockKeyhole size={15} />
                <input
                  autoComplete="current-password"
                  disabled={
                    !isSupabaseConfigured || status === 'authenticating'
                  }
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            {errorMessage && (
              <p className="login-error" role="alert">
                {errorMessage}
              </p>
            )}
            <button
              className="login-submit"
              disabled={!isSupabaseConfigured || status === 'authenticating'}
              type="submit"
            >
              {status === 'authenticating' ? 'Verificando…' : 'Iniciar sesión'}
              {status === 'authenticating' ? (
                <span className="button-spinner" />
              ) : (
                <ArrowRight size={17} />
              )}
            </button>
          </form>
          <p className="login-help">
            El acceso se administra desde el panel de Supabase.
          </p>
        </div>
        <footer className="login-footer">
          <span>© 2026 Mesa</span>
          <span>Acceso seguro</span>
        </footer>
      </section>
    </main>
  )
}

export default LoginPage
