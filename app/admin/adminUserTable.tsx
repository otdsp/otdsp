import React, { useMemo, useState } from 'react'
import {
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  PencilLine,
  X,
  Save,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  UserRound,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react'
import {
  AdminUser,
  EditableUserFields,
  extractEmail,
  extractRole,
  extractDateJoined,
  extractIsActive,
  getUserStatus,
} from './adminUserUtils'

type SortField =
  | 'name'
  | 'contact'
  | 'institution'
  | 'municipality'
  | 'status'
type SortDirection = 'asc' | 'desc'

type AdminUserDisplayFields = AdminUser & {
  institution_organization?: string | null
  institution?: string | null
  job_title?: string | null
  jobTitle?: string | null
}

interface SortIconProps {
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: SortIconProps) {
  if (sortField !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
  }

  return sortDirection === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />
}

function extractInstitution(user: AdminUser) {
  const displayUser = user as AdminUserDisplayFields

  return (
    displayUser.institution_organization ||
    displayUser.institution ||
    ''
  )
}

function extractJobTitle(user: AdminUser) {
  const displayUser = user as AdminUserDisplayFields

  return displayUser.job_title || displayUser.jobTitle || ''
}

function renderRoleBadge(role: string) {
  const normalizedRole = role.trim().toLowerCase()

  if (normalizedRole === 'staff') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
        <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
        Staff
      </span>
    )
  }

  if (normalizedRole === 'pesquisa') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
        <FlaskConical className="h-3.5 w-3.5" />
        Pesquisa
      </span>
    )
  }

  if (normalizedRole === 'user' || normalizedRole === 'comum') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
        <UserRound className="h-3.5 w-3.5" />
        Comum
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
      <UserRound className="h-3.5 w-3.5" />
      {role}
    </span>
  )
}

interface AdminUserTableProps {
  users: AdminUser[]
  loading: boolean
  selectedUserIds: Set<string>
  onToggleAll: () => void
  onToggleSelection: (id: string) => void
  editingUserId: string | null
  editDraft: EditableUserFields | null
  savingUserId: string | null
  onStartEdit: (user: AdminUser) => void
  onCancelEdit: () => void
  onDraftChange: (
    field: keyof EditableUserFields,
    value: string | boolean
  ) => void
  onSaveUser: (user: AdminUser) => void
}

export function AdminUserTable({
  users,
  loading,
  selectedUserIds,
  onToggleAll,
  onToggleSelection,
  editingUserId,
  editDraft,
  savingUserId,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSaveUser,
}: AdminUserTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current =>
        current === 'asc' ? 'desc' : 'asc'
      )
      return
    }

    setSortField(field)
    setSortDirection('asc')
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let valueA = ''
      let valueB = ''

      switch (sortField) {
        case 'name':
          valueA = a.full_name || ''
          valueB = b.full_name || ''
          break

        case 'contact':
          valueA = extractEmail(a) || ''
          valueB = extractEmail(b) || ''
          break

        case 'institution':
          valueA = extractInstitution(a)
          valueB = extractInstitution(b)
          break

        case 'municipality':
          valueA = a.municipality || ''
          valueB = b.municipality || ''
          break

        case 'status':
          valueA = `${getUserStatus(a)} ${extractRole(a) || ''}`
          valueB = `${getUserStatus(b)} ${extractRole(b) || ''}`
          break
      }

      const comparison = valueA.localeCompare(valueB, 'pt-BR', {
        sensitivity: 'base',
      })

      return sortDirection === 'asc'
        ? comparison
        : -comparison
    })
  }, [users, sortField, sortDirection])

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[4%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
          <col className="w-[22%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col className="w-[6%]" />
        </colgroup>

        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="p-4 text-center">
              <button
                type="button"
                onClick={onToggleAll}
                className="text-slate-400 transition-colors hover:text-cyan-600"
              >
                {selectedUserIds.size === users.length &&
                users.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-cyan-600" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
            </th>

            <th className="p-4">
              <button
                type="button"
                onClick={() => handleSort('name')}
                className="flex items-center gap-1.5 transition-colors hover:text-cyan-600"
              >
                Usuário
                <SortIcon
                  field="name"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </th>

            <th className="p-4">
              <button
                type="button"
                onClick={() => handleSort('contact')}
                className="flex items-center gap-1.5 transition-colors hover:text-cyan-600"
              >
                Contato
                <SortIcon
                  field="contact"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </th>

            <th className="p-4">
              <button
                type="button"
                onClick={() => handleSort('institution')}
                className="flex items-center gap-1.5 transition-colors hover:text-cyan-600"
              >
                Instituição / Atuação
                <SortIcon
                  field="institution"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </th>

            <th className="p-4">
              <button
                type="button"
                onClick={() => handleSort('municipality')}
                className="flex items-center gap-1.5 transition-colors hover:text-cyan-600"
              >
                Município
                <SortIcon
                  field="municipality"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </th>

            <th className="p-4">
              <button
                type="button"
                onClick={() => handleSort('status')}
                className="flex items-center gap-1.5 transition-colors hover:text-cyan-600"
              >
                Status
                <SortIcon
                  field="status"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </th>

            <th className="p-4 text-right">
              Ações
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="p-8 text-center text-slate-500"
              >
                Nenhum usuário encontrado com os filtros atuais.
              </td>
            </tr>
          ) : (
            sortedUsers.map(user => {
              const isSelected = selectedUserIds.has(user.id)
              const isEditing = editingUserId === user.id
              const status = getUserStatus(user)
              const userRole = extractRole(user)
              const joinedDate = extractDateJoined(user)
              const isSaving = savingUserId === user.id
              const institution = extractInstitution(user)
              const jobTitle = extractJobTitle(user)
              const email = extractEmail(user)
              const isActive = extractIsActive(user)

              return (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-cyan-50/30' : ''
                  }`}
                >
                  {isEditing && editDraft ? (
                    <td colSpan={7} className="p-3">
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 shadow-sm">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
                            <div className="sm:col-span-1 xl:col-span-3">
                              <label
                                htmlFor={`full-name-${user.id}`}
                                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                              >
                                Nome
                              </label>

                              <input
                                id={`full-name-${user.id}`}
                                value={editDraft.full_name}
                                onChange={event =>
                                  onDraftChange(
                                    'full_name',
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="Nome completo"
                              />
                            </div>

                            <div className="sm:col-span-1 xl:col-span-3">
                              <label
                                htmlFor={`email-${user.id}`}
                                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                              >
                                E-mail
                              </label>

                              <input
                                id={`email-${user.id}`}
                                type="email"
                                value={editDraft.email}
                                onChange={event =>
                                  onDraftChange(
                                    'email',
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="usuario@exemplo.com"
                              />
                            </div>

                            <div className="sm:col-span-1 xl:col-span-2">
                              <label
                                htmlFor={`municipality-${user.id}`}
                                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                              >
                                Município
                              </label>

                              <input
                                id={`municipality-${user.id}`}
                                value={editDraft.municipality ?? ''}
                                onChange={event =>
                                  onDraftChange(
                                    'municipality',
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                placeholder="Ex.: Campinas"
                              />
                            </div>

                            <div className="sm:col-span-1 xl:col-span-2">
                              <label
                                htmlFor={`role-${user.id}`}
                                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                              >
                                Nível
                              </label>

                              <select
                                id={`role-${user.id}`}
                                value={editDraft.role}
                                onChange={event =>
                                  onDraftChange(
                                    'role',
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                              >
                                <option value="user">COMUM</option>
                                <option value="pesquisa">
                                  PESQUISA
                                </option>
                                <option value="staff">STAFF</option>
                              </select>
                            </div>

                            <div className="sm:col-span-1 xl:col-span-2">
                              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Status
                              </span>

                              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={editDraft.is_active}
                                  onChange={event =>
                                    onDraftChange(
                                      'is_active',
                                      event.target.checked
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />

                                <span>
                                  {editDraft.is_active
                                    ? 'Ativo'
                                    : 'Inativo'}
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-cyan-100 pt-3 xl:border-t-0 xl:pt-0">
                            <button
                              type="button"
                              onClick={onCancelEdit}
                              disabled={isSaving}
                              className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={() => onSaveUser(user)}
                              disabled={isSaving}
                              className="flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}

                              {isSaving
                                ? 'Salvando...'
                                : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleSelection(user.id)
                          }
                          className="text-slate-400 transition-colors hover:text-cyan-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-cyan-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="min-w-0">
                          <div
                            className="truncate text-sm font-bold text-slate-800"
                            title={user.full_name || undefined}
                          >
                            {user.full_name || 'Usuário Sem Nome'}
                          </div>

                          {joinedDate && (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              Cadastrado em:{' '}
                              {new Date(
                                joinedDate
                              ).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="min-w-0">
                          {email && (
                            <div
                              className="truncate text-sm text-slate-700"
                              title={email}
                            >
                              {email}
                            </div>
                          )}

                          {user.phone && (
                            <div
                              className="mt-1 truncate text-xs font-medium text-slate-500"
                              title={user.phone}
                            >
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="min-w-0">
                          {institution && (
                            <div
                              className="truncate text-sm font-semibold text-slate-700"
                              title={institution}
                            >
                              {institution}
                            </div>
                          )}

                          {jobTitle && (
                            <div
                              className="mt-1 truncate text-xs font-medium text-slate-500"
                              title={jobTitle}
                            >
                              {jobTitle}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        {user.municipality && (
                          <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-600">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span
                              className="truncate"
                              title={user.municipality}
                            >
                              {user.municipality}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-start gap-2">
                          {userRole && renderRoleBadge(userRole)}

                          {status === 'green' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completo
                            </span>
                          )}

                          {status === 'yellow' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Incompleto
                            </span>
                          )}

                          {status === 'red' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                              <XCircle className="h-3.5 w-3.5" />
                              Sem Dados
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onStartEdit(user)}
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
  )
}