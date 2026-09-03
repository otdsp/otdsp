'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendSystemEmail } from '@/lib/emailService'
import { motion, AnimatePresence } from 'motion/react'
import { UserPlus, Search, Loader2, CheckCircle2, ShieldAlert, Activity, MapPin } from 'lucide-react'

// Utilidades e Tipos
import { 
  AdminUser, EditableUserFields, extractEmail, extractMunicipality, extractRole, 
  extractDateJoined, extractIsActive, getUserStatus, getUserActivity 
} from './adminUserUtils'

// Componentes Extraídos
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { FilterSelectField } from '@/components/FilterSelectField'
import { AddUserModal } from './addUserModal'
import { CustomEmailModal } from './customEmailModal'
import { AdminBulkActions } from './adminBulkActions'
import { AdminUserTable } from './adminUserTable'

export default function AdminPage() {
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorizing, setIsAuthorizing] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Seleção e Edição
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditableUserFields | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // UI & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)

  // Filtros
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [municipioFilter, setMunicipioFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'comum' | 'pesquisa' | 'staff'>('all')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profile')
      .select(`
        id,
        full_name,
        municipality,
        institution_organization,
        job_title,
        user_auth!inner(id, email, role, date_joined, is_active, cpf, phone)
      `)

    if (!error) {
      const normalizedUsers = (data || []).map((user: any) => {
        const authData = Array.isArray(user.user_auth) ? user.user_auth[0] : user.user_auth
        return {
          ...user,
          id: authData?.id || user.id,
          full_name: user.full_name || '',
          cpf: authData?.cpf || '',
          phone: authData?.phone || '',
          municipality: user.municipality || '',
          institution_organization: user.institution_organization || '',
          job_title: user.job_title || '',
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

      try {
        // 1. Verifica o usuário autenticado
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('Erro ao verificar sessão:', authError)
          router.push('/login')
          return
        }

        // 2. Busca diretamente o nível do usuário autenticado
        const {
          data: authProfile,
          error: profileError,
        } = await supabase
          .from('user_auth')
          .select('id, role, is_active')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error(
            'Erro ao verificar perfil da sessão:',
            profileError
          )
          router.push('/')
          return
        }

        // 3. Usuário precisa existir, estar ativo e ser staff
        if (
          !authProfile ||
          authProfile.role !== 'staff' ||
          authProfile.is_active === false
        ) {
          console.warn(
            'Acesso administrativo negado:',
            authProfile
          )
          router.push('/')
          return
        }

        // 4. Autorizado
        setIsAuthorizing(false)

        await fetchUsers()
      } catch (error) {
        console.error(
          'Erro inesperado durante autorização:',
          error
        )

        router.push('/')
      }
    }

    void checkAuthAndFetch()
  }, [router])

  const municipioOptions = useMemo(() => {
    const municipios = users
      .map(user => extractMunicipality(user))
      .filter(Boolean)

    const municipiosUnicos = Array.from(new Set(municipios))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))

    return [
      { value: 'all', label: 'Todos' },
      ...municipiosUnicos.map(municipio => ({
        value: municipio,
        label: municipio,
      })),
    ]
  }, [users])

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

      return matchesSearch && matchesDate && 
             (municipioFilter === 'all' || extractMunicipality(user) === municipioFilter) &&
             (activityFilter === 'all' || getUserActivity(user) === activityFilter) &&
             (statusFilter === 'all' || getUserStatus(user) === statusFilter) &&
             (levelFilter === 'all' || (extractRole(user) || 'user').toLowerCase() === levelFilter)
    })
  }, [users, searchTerm, startDate, endDate, municipioFilter, activityFilter, statusFilter, levelFilter])

  const missingDataEmails = useMemo(() => {
    return filteredUsers
      .filter(user => selectedUserIds.has(user.id) && getUserStatus(user) !== 'green')
      .map(user => extractEmail(user))
      .filter(Boolean)
  }, [filteredUsers, selectedUserIds])

  const handleSendMissingDataEmails = async () => {
    if (missingDataEmails.length === 0) return
    setBulkActionLoading(true)
    try {
      await sendSystemEmail({
        emails: missingDataEmails,
        subject: 'Complete seu cadastro no sistema',
        htmlContent: `Olá!<br/>Estamos solicitando que você complete os dados pendentes...`
      })
      setFeedback({ type: 'success', message: `Cobrança enviada com sucesso.` })
      setSelectedUserIds(new Set())
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao enviar cobrança.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSaveUser = async (user: AdminUser) => {
    if (!editDraft) return
    setSavingUserId(user.id)
    try {
      await supabase.from('user_profile').update({ full_name: editDraft.full_name, municipality: editDraft.municipality }).eq('id', user.id)
      await supabase.from('user_auth').update({ email: editDraft.email, role: editDraft.role, is_active: editDraft.is_active, cpf: editDraft.cpf, phone: editDraft.phone }).eq('id', user.id)

      setUsers(prev => prev.map(item => {
        if (item.id !== user.id) return item
        const nextUserAuth = Array.isArray(item.user_auth)
          ? [{ ...(item.user_auth[0] || {}), email: editDraft.email, role: editDraft.role, is_active: editDraft.is_active }]
          : { ...(item.user_auth || {}), email: editDraft.email, role: editDraft.role, is_active: editDraft.is_active }

        return { ...item, full_name: editDraft.full_name, cpf: editDraft.cpf, phone: editDraft.phone, municipality: editDraft.municipality, user_auth: nextUserAuth }
      }))
      setFeedback({ type: 'success', message: 'Usuário atualizado com sucesso.' })
      setEditingUserId(null)
      setEditDraft(null)
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível salvar.' })
    } finally {
      setSavingUserId(null)
    }
  }

  const handleDeleteSelectedUsers = async () => {
    if (selectedUserIds.size === 0 || !confirm(`Deletar ${selectedUserIds.size} usuário(s)?`)) return
    setBulkActionLoading(true)
    try {
      const selectedIds = Array.from(selectedUserIds)
      for (const id of selectedIds) {
        await supabase.from('user_profile').delete().eq('id', id)
        await supabase.from('user_auth').delete().eq('id', id)
      }
      setUsers(prev => prev.filter(user => !selectedIds.includes(user.id)))
      setSelectedUserIds(new Set())
      setFeedback({ type: 'success', message: `Usuários deletados com sucesso.` })
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível deletar.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleToggleSelectedUsers = async () => {
    if (selectedUserIds.size === 0 || !confirm(`Alternar atividade de ${selectedUserIds.size} usuário(s)?`)) return
    setBulkActionLoading(true)
    try {
      const updates = users.filter(user => selectedUserIds.has(user.id)).map(user => ({ id: user.id, nextIsActive: !extractIsActive(user) }))
      for (const update of updates) {
        await supabase.from('user_auth').update({ is_active: update.nextIsActive }).eq('id', update.id)
      }
      setUsers(prev => prev.map(user => {
        const matchingUpdate = updates.find(u => u.id === user.id)
        if (!matchingUpdate) return user
        const nextUserAuth = Array.isArray(user.user_auth) ? [{ ...(user.user_auth[0] || {}), is_active: matchingUpdate.nextIsActive }] : { ...(user.user_auth || {}), is_active: matchingUpdate.nextIsActive }
        return { ...user, user_auth: nextUserAuth }
      }))
      setSelectedUserIds(new Set())
      setFeedback({ type: 'success', message: `Usuários atualizados.` })
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Falha ao alterar status.' })
    } finally {
      setBulkActionLoading(false)
    }
  }

  if (isAuthorizing) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              <ShieldAlert className="h-8 w-8 text-cyan-600" /> Administração do Sistema
            </h1>
            <p className="mt-1 font-medium text-slate-500">Gerencie usuários, acessos e integridade de dados</p>
          </div>
          <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700">
            <UserPlus className="h-5 w-5" /> Novo Usuário
          </button>
        </div>

        {/* FEEDBACK */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAIS (Renderizados Condicionalmente) */}
        <AnimatePresence>
          {isAddUserModalOpen && <AddUserModal onClose={() => setIsAddUserModalOpen(false)} onSuccess={fetchUsers} onFeedback={setFeedback} />}
          {isEmailModalOpen && <CustomEmailModal selectedEmails={filteredUsers.filter(u => selectedUserIds.has(u.id)).map(extractEmail)} onClose={() => setIsEmailModalOpen(false)} onSuccess={() => setSelectedUserIds(new Set())} onFeedback={setFeedback} />}
        </AnimatePresence>

        {/* FILTROS E BUSCA */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-end">

            {/* Busca */}
            <div className="xl:col-span-4">
              <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Busca
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou CPF..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            {/* Período */}
            <div className="min-w-0 xl:col-span-3">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>

            {/* Filtros */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-4">

              <FilterSelectField
                label="Município"
                icon={MapPin}
                value={municipioFilter}
                onChange={setMunicipioFilter}
                options={municipioOptions}
              />

              <FilterSelectField
                label="Atividade"
                icon={Activity}
                value={activityFilter}
                onChange={v => setActivityFilter(v as any)}
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
                onChange={v => setStatusFilter(v as any)}
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
                onChange={v => setLevelFilter(v as any)}
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

        {/* BARRA DE AÇÕES EM MASSA (Extraída) */}
        <AnimatePresence>
          {selectedUserIds.size > 0 && (
            <AdminBulkActions 
              selectedCount={selectedUserIds.size}
              missingDataCount={missingDataEmails.length}
              loading={bulkActionLoading}
              onSendMissingDataEmails={handleSendMissingDataEmails}
              onOpenCustomEmailModal={() => setIsEmailModalOpen(true)}
              onToggleStatus={handleToggleSelectedUsers}
              onDelete={handleDeleteSelectedUsers}
            />
          )}
        </AnimatePresence>

        {/* TABELA DE USUÁRIOS (Extraída) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <AdminUserTable 
            users={filteredUsers}
            loading={loading}
            selectedUserIds={selectedUserIds}
            onToggleAll={() => setSelectedUserIds(selectedUserIds.size === filteredUsers.length ? new Set() : new Set(filteredUsers.map(u => u.id)))}
            onToggleSelection={id => {
              const newSet = new Set(selectedUserIds)
              newSet.has(id) ? newSet.delete(id) : newSet.add(id)
              setSelectedUserIds(newSet)
            }}
            editingUserId={editingUserId}
            editDraft={editDraft}
            savingUserId={savingUserId}
            onStartEdit={user => {
              setEditingUserId(user.id)
              setEditDraft({ full_name: user.full_name || '', cpf: user.cpf || '', phone: user.phone || '', municipality: user.municipality || '', email: extractEmail(user), role: extractRole(user), is_active: extractIsActive(user) })
            }}
            onCancelEdit={() => { setEditingUserId(null); setEditDraft(null) }}
            onDraftChange={(field, value) => setEditDraft(prev => prev ? { ...prev, [field]: value } : prev)}
            onSaveUser={handleSaveUser}
          />
        </div>

      </div>
    </div>
  )
}