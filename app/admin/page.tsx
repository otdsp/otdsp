'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendSystemEmail } from '@/lib/emailService'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldAlert,
  CheckSquare,
  Square,
  Activity,
  Save,
  X,
  PencilLine,
  Trash2,
  Power,
} from 'lucide-react'

import { DateRangeFilter } from '@/components/DateRangeFilter'

interface AdminUser {
  id: string
  full_name: string
  cpf: string
  phone: string
  municipality: string
  user_auth: any
}

interface EditableUserFields {
  full_name: string
  cpf: string
  phone: string
  municipality: string
  email: string
  role: string
  is_active: boolean
}

function FilterSelectField({
  label,
  icon: Icon,
  value,
  onChange,
  options,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-1">
      <label className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative flex h-full min-h-[42px] items-center">
        <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-full w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none transition-all cursor-pointer hover:bg-slate-100/50 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 text-[10px] text-slate-400">▼</div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorizing, setIsAuthorizing] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditableUserFields | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Estados adicionados para controle de envio de e-mail customizado
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  // Modal de Adicionar Usuário
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    full_name: '',
    cpf: '',
    phone: '',
    municipality: '',
    institution_organization: '',
    organization_type: '',
    job_title: '',
    relationship_with_otdsp: '',
    referral_source: ''
  })

  // Filtros
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'comum' | 'pesquisa' | 'staff'>('all')

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const extractEmail = (user: AdminUser) => {
    if (Array.isArray(user.user_auth)) return user.user_auth[0]?.email || ''
    return user.user_auth?.email || ''
  }

  const extractRole = (user: any) => {
    if (!user) return ''
    if (Array.isArray(user.user_auth)) return user.user_auth[0]?.role || ''
    return user.user_auth?.role || ''
  }

  const extractDateJoined = (user: AdminUser) => {
    if (Array.isArray(user.user_auth)) return user.user_auth[0]?.date_joined || ''
    return user.user_auth?.date_joined || ''
  }

  const extractIsActive = (user: AdminUser) => {
    if (Array.isArray(user.user_auth)) return user.user_auth[0]?.is_active ?? true
    return user.user_auth?.is_active ?? true
  }

  const getUserStatus = (user: AdminUser) => {
    const hasName = Boolean(user.full_name)
    const hasCpf = Boolean(user.cpf)
    const hasPhone = Boolean(user.phone)
    const hasMuni = Boolean(user.municipality)

    if (hasName && hasCpf && hasPhone && hasMuni) return 'green'
    if (hasName || hasCpf || hasPhone || hasMuni) return 'yellow'
    return 'red'
  }

  const getUserActivity = (user: AdminUser) => (extractIsActive(user) ? 'active' : 'inactive')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profile')
      .select(`
        id,
        full_name,
        municipality,
        user_auth!inner(id, email, role, date_joined, is_active, cpf, phone)
      `)

    if (error) {
      console.error('Erro ao buscar usuários:', error)
    } else {
      const normalizedUsers = (data || []).map((user: any) => {
        const authData = Array.isArray(user.user_auth) ? user.user_auth[0] : user.user_auth
        return {
          ...user,
          id: authData?.id || user.id,
          full_name: user.full_name || '',
          cpf: authData?.cpf || '',
          phone: authData?.phone || '',
          municipality: user.municipality || '',
          user_auth: authData ? [authData] : user.user_auth,
        }
      })

      const sortedData = normalizedUsers.sort((a: any, b: any) => {
        const dateA = new Date(extractDateJoined(a)).getTime()
        const dateB = new Date(extractDateJoined(b)).getTime()
        return dateB - dateA
      })
      setUsers(sortedData)
    }

    setLoading(false)
  }

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setIsAuthorizing(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('user_profile')
        .select(`
          user_auth!inner(role)
        `)
        .eq('id', session.user.id)
        .single()

      const currentRole = extractRole(profile)

      if (error || currentRole !== 'staff') {
        console.warn('Acesso negado. Role atual:', currentRole)
        router.push('/')
        return
      }

      setIsAuthorizing(false)
      await fetchUsers()
    }

    checkAuthAndFetch()
  }, [router])

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingUser(true)
    setFeedback(null)

    try {
      const randomPassword = generateRandomPassword()
      const { data, error } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: randomPassword,
        options: {
          data: {
            full_name: newUserForm.full_name,
            cpf: newUserForm.cpf,
            phone: newUserForm.phone,
            municipality: newUserForm.municipality,
            institution_organization: newUserForm.institution_organization,
            organization_type: newUserForm.organization_type,
            job_title: newUserForm.job_title,
            relationship_with_otdsp: newUserForm.relationship_with_otdsp,
            referral_source: newUserForm.referral_source
          }
        }
      })
      
      if (error) throw error

      const user = data.user
      if (user) {
        // Try to insert/upsert into user_auth (using upsert to avoid primary key conflict if trigger executed)
        const { error: authTableError } = await supabase
          .from('user_auth')
          .upsert({
            id: user.id,
            email: user.email,
            role: 'user',
            is_active: true,
            cpf: newUserForm.cpf,
            phone: newUserForm.phone,
          })
        
        if (authTableError) console.error('Error in user_auth upsert:', authTableError)

        // Try to insert/upsert into user_profile (using upsert to avoid primary key conflict if trigger executed)
        const { error: profileTableError } = await supabase
          .from('user_profile')
          .upsert({
            id: user.id,
            full_name: newUserForm.full_name,
            municipality: newUserForm.municipality,
            institution_organization: newUserForm.institution_organization,
            organization_type: newUserForm.organization_type,
            job_title: newUserForm.job_title,
            relationship_with_otdsp: newUserForm.relationship_with_otdsp,
            referral_source: newUserForm.referral_source
          })
        
        if (profileTableError) console.error('Error in user_profile upsert:', profileTableError)
      }

      setFeedback({ type: 'success', message: 'Usuário criado com sucesso!' })
      setIsAddUserModalOpen(false)
      setNewUserForm({
        email: '', full_name: '', cpf: '', phone: '', municipality: '',
        institution_organization: '', organization_type: '', job_title: '', relationship_with_otdsp: '', referral_source: ''
      })
      await fetchUsers()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUserForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        (user.full_name?.toLowerCase() || '').includes(searchLower) ||
        (extractEmail(user).toLowerCase()).includes(searchLower) ||
        (user.cpf || '').includes(searchLower)

      const dateJoinedStr = extractDateJoined(user)
      const userDate = dateJoinedStr ? new Date(dateJoinedStr) : null

      let matchesDate = true
      if (userDate) {
        matchesDate =
          (!startDate || userDate >= new Date(startDate + 'T00:00:00')) &&
          (!endDate || userDate <= new Date(endDate + 'T23:59:59'))
      } else if (startDate || endDate) {
        matchesDate = false
      }

      const activity = getUserActivity(user)
      const matchesActivity = activityFilter === 'all' || activity === activityFilter
      const status = getUserStatus(user)
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const level = (extractRole(user) || 'user').toLowerCase()
      const matchesLevel = levelFilter === 'all' || level === levelFilter

      return matchesSearch && matchesDate && matchesActivity && matchesStatus && matchesLevel
    })
  }, [users, searchTerm, startDate, endDate, activityFilter, statusFilter, levelFilter])

  const toggleUserSelection = (id: string) => {
    const newSet = new Set(selectedUserIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedUserIds(newSet)
  }

  const toggleAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(user => user.id)))
    }
  }

  // Dispara e-mail customizado para os usuários selecionados
  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserIds.size === 0 || !emailSubject || !emailHtml) return

    setEmailSending(true)
    setFeedback(null)

    // Filtra e obtém a lista de e-mails de quem foi selecionado
    const selectedEmails = filteredUsers
      .filter(u => selectedUserIds.has(u.id))
      .map(u => extractEmail(u))
      .filter(Boolean)

    try {
      await sendSystemEmail({
        emails: selectedEmails,
        subject: emailSubject,
        htmlContent: emailHtml.replace(/\n/g, '<br />') // formatação quebra de linha simples
      })

      setFeedback({ type: 'success', message: `E-mail enviado com sucesso para ${selectedEmails.length} destinatários!` })
      setIsEmailModalOpen(false)
      setEmailSubject('')
      setEmailHtml('')
      setSelectedUserIds(new Set())
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao realizar disparo de e-mails.' })
    } finally {
      setEmailSending(false)
    }
  }

  const missingDataEmails = useMemo(() => {
    return filteredUsers
      .filter(user => selectedUserIds.has(user.id) && getUserStatus(user) !== 'green')
      .map(user => extractEmail(user))
      .filter(Boolean)
  }, [filteredUsers, selectedUserIds])

  // 👇 NOVA INTEGRAÇÃO: Dispara automaticamente usando a API local
  const handleSendMissingDataEmails = async () => {
    if (missingDataEmails.length === 0) {
      setFeedback({ type: 'error', message: 'Nenhum e-mail com dados faltantes está selecionado.' })
      return
    }

    setBulkActionLoading(true)
    setFeedback(null)

    try {
      await sendSystemEmail({
        emails: missingDataEmails,
        subject: 'Complete seu cadastro no sistema',
        htmlContent: `
          Olá!\n
          Estamos solicitando que você complete os dados pendentes do seu cadastro para continuar utilizando a plataforma.\n
          Por favor, acesse seu perfil e atualize suas informações.
        `
      })

      setFeedback({ type: 'success', message: `E-mail de cobrança enviado com sucesso para ${missingDataEmails.length} usuário(s).` })
      setSelectedUserIds(new Set())
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao enviar cobrança.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const startEditing = (user: AdminUser) => {
    setEditingUserId(user.id)
    setEditDraft({
      full_name: user.full_name || '',
      cpf: user.cpf || '',
      phone: user.phone || '',
      municipality: user.municipality || '',
      email: extractEmail(user),
      role: extractRole(user),
      is_active: extractIsActive(user),
    })
    setFeedback(null)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditDraft(null)
  }

  const handleDraftChange = (field: keyof EditableUserFields, value: string | boolean) => {
    if (!editDraft) return
    setEditDraft(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSaveUser = async (user: AdminUser) => {
    if (!editDraft) return

    setSavingUserId(user.id)
    try {
      const { error: profileError } = await supabase
        .from('user_profile')
        .update({
          full_name: editDraft.full_name,
          municipality: editDraft.municipality,
        })
        .eq('id', user.id)

      const { error: authError } = await supabase
        .from('user_auth')
        .update({
          email: editDraft.email,
          role: editDraft.role,
          is_active: editDraft.is_active,
          cpf: editDraft.cpf,
          phone: editDraft.phone,
        })
        .eq('id', user.id)

      if (profileError || authError) {
        throw profileError || authError
      }

      setUsers(prev => prev.map(item => {
        if (item.id !== user.id) return item

        const nextUserAuth = Array.isArray(item.user_auth)
          ? [{ ...(item.user_auth[0] || {}), email: editDraft.email, role: editDraft.role, is_active: editDraft.is_active }]
          : { ...(item.user_auth || {}), email: editDraft.email, role: editDraft.role, is_active: editDraft.is_active }

        return {
          ...item,
          full_name: editDraft.full_name,
          cpf: editDraft.cpf,
          phone: editDraft.phone,
          municipality: editDraft.municipality,
          user_auth: nextUserAuth,
        }
      }))

      setFeedback({ type: 'success', message: 'Usuário updated com sucesso.' })
      setEditingUserId(null)
      setEditDraft(null)
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível salvar as alterações.' })
    } finally {
      setSavingUserId(null)
    }
  }

  const handleDeleteSelectedUsers = async () => {
    if (selectedUserIds.size === 0) return
    if (!confirm(`Deseja deletar ${selectedUserIds.size} usuário(s) selecionado(s) do banco?`)) return

    setBulkActionLoading(true)
    try {
      const selectedIds = Array.from(selectedUserIds)

      for (const id of selectedIds) {
        const { error: profileError } = await supabase
          .from('user_profile')
          .delete()
          .eq('id', id)

        if (profileError) throw profileError

        const { error: authError } = await supabase
          .from('user_auth')
          .delete()
          .eq('id', id)

        if (authError) throw authError
      }

      setUsers(prev => prev.filter(user => !selectedIds.includes(user.id)))
      setSelectedUserIds(new Set())
      setFeedback({ type: 'success', message: `${selectedIds.length} usuário(s) deletado(s) com sucesso.` })
    } catch (error: any) {
      console.error('Erro ao deletar usuários:', error)
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível deletar os usuários selecionados.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleToggleSelectedUsers = async () => {
    if (selectedUserIds.size === 0) return

    const selectedUsers = users.filter(user => selectedUserIds.has(user.id))
    const updates = selectedUsers.map(user => ({
      id: user.id,
      nextIsActive: !extractIsActive(user),
    }))

    if (!confirm(`Deseja alternar a atividade de ${selectedUserIds.size} usuário(s) selecionado(s)?`)) return

    setBulkActionLoading(true)
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('user_auth')
          .update({ is_active: update.nextIsActive })
          .eq('id', update.id)

        if (error) throw error
      }

      setUsers(prev => prev.map(user => {
        const matchingUpdate = updates.find(update => update.id === user.id)
        if (!matchingUpdate) return user

        const nextUserAuth = Array.isArray(user.user_auth)
          ? [{ ...(user.user_auth[0] || {}), is_active: matchingUpdate.nextIsActive }]
          : { ...(user.user_auth || {}), is_active: matchingUpdate.nextIsActive }

        return { ...user, user_auth: nextUserAuth }
      }))

      setSelectedUserIds(new Set())
      setFeedback({ type: 'success', message: `${updates.length} usuário(s) atualizado(s) com sucesso.` })
    } catch (error: any) {
      console.error('Erro ao alterar status dos usuários:', error)
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível alterar o status dos usuários selecionados.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  if (isAuthorizing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              <ShieldAlert className="h-8 w-8 text-cyan-600" />
              Administração do Sistema
            </h1>
            <p className="mt-1 font-medium text-slate-500">
              Gerencie usuários, acessos e integridade de dados (Visão Staff)
            </p>
          </div>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700"
          >
            <UserPlus className="h-5 w-5" /> Novo Usuário
        </button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
            >
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL DE ADICIONAR USUÁRIO */}
        <AnimatePresence>
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl my-8 rounded-3xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-cyan-400" />
                    Cadastrar Novo Usuário
                  </h3>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateNewUser} className="space-y-6">
                  {/* Dados Obrigatórios */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-500">Credenciais (Obrigatório)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                        <input required type="text" name="full_name" value={newUserForm.full_name} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                        <input required type="email" name="email" value={newUserForm.email} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                    </div>
                  </div>

                  {/* Dados Opcionais */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Dados Complementares (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">CPF</label>
                        <input type="text" name="cpf" value={newUserForm.cpf} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
                        <input type="tel" name="phone" value={newUserForm.phone} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Município de Sede</label>
                        <input type="text" name="municipality" value={newUserForm.municipality} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Instituição / Organização</label>
                        <input type="text" name="institution_organization" value={newUserForm.institution_organization} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Organização</label>
                        <select name="organization_type" value={newUserForm.organization_type} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                          <option value="">Selecione...</option>
                          <option value="Governamental">Governamental</option>
                          <option value="Privada">Privada</option>
                          <option value="Privada sem fins lucrativos">Privada sem fins lucrativos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Cargo / Função</label>
                        <input type="text" name="job_title" value={newUserForm.job_title} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Relação com o OTDSP</label>
                        <select name="relationship_with_otdsp" value={newUserForm.relationship_with_otdsp} onChange={handleNewUserChange} className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                          <option value="">Selecione...</option>
                          <option value="Visitante">Visitante</option>
                          <option value="Pesquisador">Pesquisador</option>
                          <option value="Voluntário">Voluntário</option>
                          <option value="Aluno">Aluno</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="h-11 rounded-xl bg-transparent px-5 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isCreatingUser} className="h-11 flex items-center gap-2 rounded-xl bg-cyan-600 px-6 text-sm font-bold text-white transition-colors hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)] disabled:opacity-50">
                      {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar Usuário
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col space-y-1 xl:max-w-[420px]">
              <label className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Busca</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou CPF..."
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 lg:flex-row xl:max-w-[760px] xl:flex-1">
              <div className="flex-1 min-w-0">
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[470px] lg:flex-nowrap">
                <FilterSelectField
                  label="Atividade"
                  icon={Activity}
                  value={activityFilter}
                  onChange={value => setActivityFilter(value as 'all' | 'active' | 'inactive')}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Ativos' },
                    { value: 'inactive', label: 'Não ativos' },
                  ]}
                />
                <FilterSelectField
                  label="Status"
                  icon={CheckCircle2}
                  value={statusFilter}
                  onChange={value => setStatusFilter(value as 'all' | 'green' | 'yellow' | 'red')}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'green', label: 'Completo' },
                    { value: 'yellow', label: 'Incompleto' },
                    { value: 'red', label: 'Sem dados' },
                  ]}
                />
                <FilterSelectField
                  label="Nível"
                  icon={ShieldAlert}
                  value={levelFilter}
                  onChange={value => setLevelFilter(value as 'all' | 'comum' | 'pesquisa' | 'staff')}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'comum', label: 'Comum' },
                    { value: 'pesquisa', label: 'Pesquisa' },
                    { value: 'staff', label: 'Staff' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedUserIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3 rounded-2xl bg-cyan-900 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Users className="h-5 w-5 text-cyan-300" />
                {selectedUserIds.size} usuário(s) selecionado(s)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendMissingDataEmails}
                  disabled={bulkActionLoading || missingDataEmails.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  E-mails para dados ausentes ({missingDataEmails.length})
                </button>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold transition-colors hover:bg-cyan-600"
                >
                  <Mail className="h-4 w-4" /> E-mail Customizado
                </button>
                <button
                  type="button"
                  onClick={handleToggleSelectedUsers}
                  disabled={bulkActionLoading || selectedUserIds.size === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  Desativar/Ativar Usuários
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedUsers}
                  disabled={bulkActionLoading || selectedUserIds.size === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Deletar Usuário(s)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 👇 MODAL DO E-MAIL CUSTOMIZADO 👇 */}
        <AnimatePresence>
          {isEmailModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-cyan-600" />
                    Enviar E-mail Customizado ({selectedUserIds.size} dest.)
                  </h3>
                  <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSendCustomEmail} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Assunto</label>
                    <input 
                      type="text" 
                      required
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Ex: Atualização importante do sistema"
                      className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mensagem (HTML/Texto)</label>
                    <textarea 
                      required
                      rows={6}
                      value={emailHtml}
                      onChange={e => setEmailHtml(e.target.value)}
                      placeholder="Escreva o conteúdo do e-mail aqui..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={emailSending}
                      className="h-10 flex items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disparar E-mails'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="w-12 p-4 text-center">
                      <button onClick={toggleAll} className="text-slate-400 transition-colors hover:text-cyan-600">
                        {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                          <CheckSquare className="h-5 w-5 text-cyan-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Usuário & Contato</th>
                    <th className="p-4">Credenciais & Nível</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Nenhum usuário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = selectedUserIds.has(user.id)
                      const isEditing = editingUserId === user.id
                      const status = getUserStatus(user)
                      const userRole = extractRole(user)
                      const joinedDate = extractDateJoined(user)
                      const isSaving = savingUserId === user.id

                      return (
                        <tr key={user.id} className={`transition-colors hover:bg-slate-50 ${isSelected ? 'bg-cyan-50/30' : ''}`}>
                          {isEditing && editDraft ? (
                            <td colSpan={5} className="p-3">
                              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3 shadow-sm">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                  <div className="flex flex-1 flex-wrap gap-2">
                                    <div className="min-w-[180px] flex-1">
                                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Nome
                                      </label>
                                      <input
                                        value={editDraft.full_name}
                                        onChange={event => handleDraftChange('full_name', event.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Nome"
                                      />
                                    </div>

                                    <div className="min-w-[180px] flex-1">
                                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        E-mail
                                      </label>
                                      <input
                                        value={editDraft.email}
                                        onChange={event => handleDraftChange('email', event.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                                        placeholder="E-mail"
                                      />
                                    </div>

                                    <div className="min-w-[120px]">
                                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Nível
                                      </label>
                                      <select
                                        value={editDraft.role}
                                        onChange={event => handleDraftChange('role', event.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
                                      >
                                        <option value="user">COMUM</option>
                                        <option value="pesquisa">PESQUISA</option>
                                        <option value="staff">STAFF</option>
                                      </select>
                                    </div>

                                    <div className="min-w-[120px]">
                                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Status
                                      </label>
                                      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={editDraft.is_active}
                                          onChange={event => handleDraftChange('is_active', event.target.checked)}
                                          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        {editDraft.is_active ? 'Ativo' : 'Inativo'}
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                    >
                                      <X className="h-4 w-4" /> Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleSaveUser(user)}
                                      disabled={isSaving}
                                      className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                      Salvar
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                  <span>CPF: {user.cpf || 'Sem CPF'}</span>
                                  <span>Telefone: {user.phone || 'Sem telefone'}</span>
                                  <span>Município: {user.municipality || 'Sem município'}</span>
                                  {joinedDate && <span>Cadastrado em: {new Date(joinedDate).toLocaleDateString('pt-BR')}</span>}
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="p-4 text-center">
                                <button onClick={() => toggleUserSelection(user.id)} className="text-slate-400 transition-colors hover:text-cyan-600">
                                  {isSelected ? <CheckSquare className="h-5 w-5 text-cyan-600" /> : <Square className="h-5 w-5" />}
                                </button>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800">{user.full_name || 'Usuário Sem Nome'}</span>
                                  <span className="mt-0.5 text-xs text-slate-500">
                                    {user.phone || 'Sem telefone'} • {user.municipality || 'Sem município'}
                                  </span>
                                  {joinedDate && (
                                    <span className="mt-0.5 text-[10px] font-medium text-slate-400">
                                      Cadastrado em: {new Date(joinedDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-700">{extractEmail(user)}</span>
                                  <span className="mt-0.5 text-xs font-medium text-slate-500">
                                    <span className="font-mono">{user.cpf ? `CPF: ${user.cpf}` : 'Sem CPF'}</span>
                                    {userRole && ` • Nível: ${userRole.toUpperCase()}`}
                                  </span>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-col gap-2">
                                  {status === 'green' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Completo
                                    </span>
                                  )}
                                  {status === 'yellow' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                      <AlertCircle className="h-3.5 w-3.5" /> Incompleto
                                    </span>
                                  )}
                                  {status === 'red' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                                      <XCircle className="h-3.5 w-3.5" /> Sem Dados
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${extractIsActive(user) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    <Activity className="h-3.5 w-3.5" /> {extractIsActive(user) ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEditing(user)}
                                    title="Editar usuário"
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-600"
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}