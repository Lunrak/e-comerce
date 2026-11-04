import { requireSupabase } from '../../lib/supabase.ts'

async function getProfile(userId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role, business_id')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`)
  if (!data || !['admin', 'cashier'].includes(data.role)) {
    throw new Error(
      'El usuario no tiene un rol habilitado para esta aplicación.',
    )
  }
  return data
}

export async function restoreSession() {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  if (!data.session) return null

  return {
    user: data.session.user,
    profile: await getProfile(data.session.user.id),
  }
}

export async function signIn(credentials: { email: string; password: string }) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword(credentials)
  if (error) throw error
  if (!data.user) throw new Error('Supabase no devolvió un usuario válido.')

  try {
    return {
      user: data.user,
      profile: await getProfile(data.user.id),
    }
  } catch (profileError) {
    await client.auth.signOut()
    throw profileError
  }
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
