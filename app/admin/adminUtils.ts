export interface AdminUser {
  id: string
  full_name: string
  cpf: string
  phone: string
  municipality: string
  user_auth: any
}

export interface EditableUserFields {
  full_name: string
  cpf: string
  phone: string
  municipality: string
  email: string
  role: string
  is_active: boolean
}

export const extractEmail = (user: AdminUser) => {
  if (Array.isArray(user.user_auth)) return user.user_auth[0]?.email || ''
  return user.user_auth?.email || ''
}

export const extractRole = (user: any) => {
  if (!user) return ''
  if (Array.isArray(user.user_auth)) return user.user_auth[0]?.role || ''
  return user.user_auth?.role || ''
}

export const extractDateJoined = (user: AdminUser) => {
  if (Array.isArray(user.user_auth)) return user.user_auth[0]?.date_joined || ''
  return user.user_auth?.date_joined || ''
}

export const extractIsActive = (user: AdminUser) => {
  if (Array.isArray(user.user_auth)) return user.user_auth[0]?.is_active ?? true
  return user.user_auth?.is_active ?? true
}

export const getUserStatus = (user: AdminUser) => {
  const hasName = Boolean(user.full_name)
  const hasCpf = Boolean(user.cpf)
  const hasPhone = Boolean(user.phone)
  const hasMuni = Boolean(user.municipality)

  if (hasName && hasCpf && hasPhone && hasMuni) return 'green'
  if (hasName || hasCpf || hasPhone || hasMuni) return 'yellow'
  return 'red'
}

export const getUserActivity = (user: AdminUser) => (extractIsActive(user) ? 'active' : 'inactive')