'use client'

import React from 'react'
import { CheckSquare, Square, CheckCircle2, AlertCircle, XCircle, Activity, PencilLine, X, Save, Loader2 } from 'lucide-react'
import { 
  AdminUser, EditableUserFields, extractEmail, extractRole, 
  extractDateJoined, extractIsActive, getUserStatus 
} from './adminUtils'

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
  onDraftChange: (field: keyof EditableUserFields, value: string | boolean) => void
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
  onSaveUser
}: AdminUserTableProps) {

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="w-12 p-4 text-center">
              <button onClick={onToggleAll} className="text-slate-400 transition-colors hover:text-cyan-600">
                {selectedUserIds.size === users.length && users.length > 0 ? (
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
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-500">
                Nenhum usuário encontrado com os filtros atuais.
              </td>
            </tr>
          ) : (
            users.map(user => {
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
                                onChange={event => onDraftChange('full_name', event.target.value)}
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
                                onChange={event => onDraftChange('email', event.target.value)}
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
                                onChange={event => onDraftChange('role', event.target.value)}
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
                                  onChange={event => onDraftChange('is_active', event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                {editDraft.is_active ? 'Ativo' : 'Inativo'}
                              </label>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={onCancelEdit}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                            >
                              <X className="h-4 w-4" /> Cancelar
                            </button>
                            <button
                              onClick={() => onSaveUser(user)}
                              disabled={isSaving}
                              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="p-4 text-center">
                        <button onClick={() => onToggleSelection(user.id)} className="text-slate-400 transition-colors hover:text-cyan-600">
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