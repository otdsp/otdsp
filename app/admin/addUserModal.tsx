'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase, tempSupabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { UserPlus, X, Loader2, Save, FileSpreadsheet, CheckCircle2, Info } from 'lucide-react'

interface AddUserModalProps {
  onClose: () => void
  onSuccess: () => void
  onFeedback: (feedback: { type: 'success' | 'error'; message: string }) => void
}

// Utilitário inteligente para buscar colunas ignorando espaços e maiúsculas/minúsculas
const getCellValue = (row: any, possibleKeys: string[]): string => {
  const normalizedRow: Record<string, any> = {}
  Object.keys(row).forEach(key => {
    normalizedRow[key.toLowerCase().trim()] = row[key]
  })

  for (const key of possibleKeys) {
    const normalizedKey = key.toLowerCase().trim()
    if (normalizedRow[normalizedKey] !== undefined) {
      return String(normalizedRow[normalizedKey]).trim()
    }
  }
  return ''
}

// Lista de sinônimos para identificação das colunas úteis
const TARGET_ALIASES = [
  ['email', 'e-mail', 'correio eletrônico'],
  ['nome completo', 'full_name', 'nome', 'nome do participante'],
  ['cpf', 'documento'],
  ['telefone', 'phone', 'whatsapp', 'telefone/whatsapp', 'celular'],
  ['município', 'municipio', 'cidade'],
  ['instituição', 'instituicao', 'organização', 'empresa'],
  ['tipo organização', 'tipo organizacao'],
  ['cargo', 'função', 'funcao'],
  ['relação otdsp', 'vínculo'],
  ['indicação', 'indicacao', 'como nos conheceu']
]

const removeDuplicateEmails = (rows: any[]) => {
  const seenEmails = new Set<string>()
  const uniqueRows: any[] = []
  const duplicatedRows: any[] = []

  for (const row of rows) {
    const email = getCellValue(row, TARGET_ALIASES[0])
      .trim()
      .toLowerCase()

    if (!email) {
      uniqueRows.push(row)
      continue
    }

    if (seenEmails.has(email)) {
      duplicatedRows.push(row)
      continue
    }

    seenEmails.add(email)
    uniqueRows.push(row)
  }

  return {
    uniqueRows,
    duplicatedRows
  }
}

export function AddUserModal({ onClose, onSuccess, onFeedback }: AddUserModalProps) {
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  
  // Estados para Importação em Lote
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [detectedInfo, setDetectedInfo] = useState<{ users: number; usedColumns: string[]; duplicates: number; originalTotal: number; invalid: number } | null>(null)
  
  const [newUserForm, setNewUserForm] = useState({
    email: '', full_name: '', cpf: '', phone: '', municipality: '',
    institution_organization: '', organization_type: '', job_title: '', relationship_with_otdsp: '', referral_source: ''
  })

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+'
    return Array.from({ length: 16 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
  }

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUserForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ==========================================
  // FUNÇÃO 1: CADASTRO MANUAL (ÚNICO)
  // ==========================================
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingUser(true)

    try {
      const { error } = await tempSupabase.auth.signUp({
        email: newUserForm.email.trim().toLowerCase(),
        password: generateRandomPassword(),
        options: {
          data: {
            full_name: newUserForm.full_name,
            cpf: newUserForm.cpf.replace(/\D/g, ''), 
            phone: newUserForm.phone.replace(/\D/g, ''),
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

      onFeedback({ type: 'success', message: 'Usuário criado com sucesso!' })
      onSuccess()
      onClose()
    } catch (err: any) {
      onFeedback({ type: 'error', message: err.message })
    } finally {
      setIsCreatingUser(false)
    }
  }

  // ==========================================
  // FUNÇÃO 2A: LER E DETECTAR A PLANILHA
  // ==========================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCreatingUser(true)
    e.target.value = '' 

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const rawData: any[] = XLSX.utils.sheet_to_json(ws)

        if (!rawData || rawData.length === 0) {
          onFeedback({ type: 'error', message: 'A planilha selecionada está vazia.' })
          return
        }

        const { uniqueRows, duplicatedRows } = removeDuplicateEmails(rawData)

        const headers = Object.keys(rawData[0] || {})
        
        // Filtra apenas as colunas que o nosso sistema vai realmente utilizar
        const usedColumns = headers.filter(header => {
          const normalizedHeader = header.toLowerCase().trim()
          return TARGET_ALIASES.some(aliases => aliases.includes(normalizedHeader))
        })
        
        setParsedData(uniqueRows)
        setDetectedInfo({ users: uniqueRows.length, usedColumns, duplicates: duplicatedRows.length, originalTotal: rawData.length, invalid: rawData.length - uniqueRows.length - duplicatedRows.length })
        
      } catch (err: any) {
        onFeedback({ type: 'error', message: `Erro na leitura do arquivo: ${err.message}` })
      } finally {
        setIsCreatingUser(false)
      }
    }

    reader.readAsBinaryString(file)
  }

  const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms))

  // ==========================================
  // FUNÇÃO 2B: EXECUTAR A IMPORTAÇÃO APÓS CONFIRMAÇÃO
  // ==========================================
  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.length === 0) return

    setIsCreatingUser(true)
    setImportProgress({ current: 0, total: parsedData.length })

    let successCount = 0
    let errorCount = 0

    try {
      const usersToImport = []

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i]
        const email = getCellValue(row,TARGET_ALIASES[0]).trim().toLowerCase()
        const fullName = getCellValue(row,TARGET_ALIASES[1]).trim()

        if (!email || !fullName) {
          console.warn(`Linha ${i + 1} ignorada: email ou nome ausente`)
          errorCount++
          continue
        }

        const rawCpf = getCellValue(row,TARGET_ALIASES[2])
        const rawPhone = getCellValue(row,TARGET_ALIASES[3])

        usersToImport.push({
          originalIndex: i,
          email,
          fullName,
          cpf: rawCpf ? rawCpf.replace(/\D/g, '') : '',
          phone: rawPhone ? rawPhone.replace(/\D/g, '') : '',
          municipality: getCellValue(row, TARGET_ALIASES[4]).trim(),
          institutionOrganization: getCellValue(row, TARGET_ALIASES[5]).trim(),
          organizationType: getCellValue(row, TARGET_ALIASES[6]).trim(),
          jobTitle: getCellValue(row, TARGET_ALIASES[7]).trim(),
          relationshipWithOtdsp: getCellValue(row, TARGET_ALIASES[8]).trim(),
          referralSource: getCellValue(row, TARGET_ALIASES[9]).trim()
        })
      }

      if (usersToImport.length === 0) {
        onFeedback({
          type: 'error',
          message: 'Nenhum registro válido encontrado para importação.'
        })

        return
      }

      const BATCH_SIZE = 50
      let processedCount = parsedData.length - usersToImport.length
      
      for (let i = 0; i < usersToImport.length; i += BATCH_SIZE) {
        const batch = usersToImport.slice(i, i + BATCH_SIZE)
        const usersPayload = batch.map(({ originalIndex, ...user }) => user)

        try {
          const { data, error } = await supabase.functions.invoke('bulk-create-users', {
              body: {
                users: usersPayload
              }
            }
          )

          if (error) {
            errorCount += batch.length
          }
          else if ( data?.results && Array.isArray(data.results)) {
            for (const result of data.results) {
              if (result.success) {
                successCount++
              } else {
                errorCount++

                console.error(
                  `Erro ao importar ${result.email}:`,
                  result.error
                )
              }
            }
          } else {
            console.error('Resposta inválida da Edge Function:', data)
            errorCount += batch.length
          }
        } catch (batchError) {
          console.error('Erro inesperado ao importar lote:', batchError)
          errorCount += batch.length
        }

        processedCount += batch.length

        setImportProgress({
          current: processedCount,
          total: parsedData.length
        })
      }

      setImportProgress({
        current: parsedData.length,
        total: parsedData.length
      })

      if (successCount > 0) {
        onFeedback({
          type: 'success',
          message: `${successCount} usuário(s) importado(s) com sucesso! ` + (errorCount > 0 ? `(${errorCount} ignorado(s) por falha, duplicação ou dados inválidos)` : '')
        })
        onSuccess()
        onClose()
      } else {
        onFeedback({
          type: 'error',
          message: `Nenhum usuário foi importado. ` + `${errorCount} registro(s) apresentaram erro.`
        })
      }
    } catch (error) {
      console.error('Erro geral durante importação:', error)
      onFeedback({
        type: 'error',
        message: 'Ocorreu um erro inesperado durante a importação.'
      })
    } finally {
      setIsCreatingUser(false)
      setImportProgress(null)
      setParsedData(null)
      setDetectedInfo(null)
    }
  }

  const handleCancelImport = () => {
    setParsedData(null)
    setDetectedInfo(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl my-8 rounded-3xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-cyan-400" />
            Cadastrar Novo Usuário
          </h3>
          
          <div className="flex items-center gap-3">
            {!detectedInfo && (
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importar Excel</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={isCreatingUser}
                />
              </label>
            )}
            <button 
              onClick={onClose} 
              disabled={isCreatingUser}
              className="text-slate-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* PROGRESSO DA IMPORTAÇÃO */}
        <AnimatePresence>
          {importProgress && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50"
            >
              <div className="flex justify-between text-xs font-semibold text-cyan-400 mb-2">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Gerando usuários no Supabase, aguarde...
                </span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TELA DE REVISÃO DA PLANILHA */}
        {detectedInfo && !importProgress ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="space-y-6">
              {/* CABEÇALHO DO RESUMO */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Revisão da Importação
                        </h4>
                        <p className="text-sm text-slate-400">
                          Confira os dados antes de enviar os usuários ao Supabase.
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-800/60 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Arquivo processado
                  </span>
                </div>
              </div>

              {/* INDICADORES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* TOTAL */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Encontrado
                    </span>

                    <div className="rounded-lg bg-slate-800 p-2">
                      <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {detectedInfo.originalTotal}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Linhas lidas na planilha
                  </p>
                </div>

                {/* DUPLICADOS */}
                <div className="rounded-2xl border border-amber-900/50 bg-amber-950/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                      Duplicados
                    </span>

                    <div className="rounded-lg bg-amber-500/10 p-2">
                      <Info className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>

                  <div className="text-3xl font-black text-amber-400">
                    {detectedInfo.duplicates}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    E-mails removidos automaticamente
                  </p>
                </div>

                {/* INVÁLIDOS */}
                <div className="rounded-2xl border border-rose-900/50 bg-rose-950/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                      Com Pendência
                    </span>

                    <div className="rounded-lg bg-rose-500/10 p-2">
                      <X className="h-4 w-4 text-rose-400" />
                    </div>
                  </div>

                  <div className="text-3xl font-black text-rose-400">
                    {detectedInfo.invalid ?? 0}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Sem nome ou e-mail válido
                  </p>
                </div>

                {/* PRONTOS */}
                <div className="relative overflow-hidden rounded-2xl border border-cyan-700/50 bg-gradient-to-br from-cyan-950/50 to-emerald-950/20 p-5">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Prontos
                      </span>

                      <div className="rounded-lg bg-cyan-500/10 p-2">
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      </div>
                    </div>

                    <div className="text-3xl font-black text-cyan-400">
                      {detectedInfo.users}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Usuários aptos para importação
                    </p>
                  </div>
                </div>
              </div>

              {/* RESUMO VISUAL */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      Aproveitamento da planilha
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Percentual de registros que seguirão para importação.
                    </p>
                  </div>

                  <span className="text-lg font-black text-cyan-400">
                    {detectedInfo.originalTotal > 0
                      ? Math.round(
                          (detectedInfo.users / detectedInfo.originalTotal) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${
                        detectedInfo.originalTotal > 0
                          ? (detectedInfo.users / detectedInfo.originalTotal) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* COLUNAS DETECTADAS */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5">
                <div className="mb-4">
                  <h5 className="text-sm font-bold text-white">
                    Colunas reconhecidas
                  </h5>

                  <p className="mt-1 text-xs text-slate-500">
                    Apenas estas informações serão utilizadas no cadastro dos usuários.
                  </p>
                </div>

                {detectedInfo.usedColumns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detectedInfo.usedColumns.map((col, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-400"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {col}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-400">
                    Nenhuma coluna compatível foi encontrada.
                  </div>
                )}
              </div>

              {/* AÇÕES */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelImport}
                  className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-5 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  Cancelar e escolher outro arquivo
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={
                    detectedInfo.usedColumns.length === 0 ||
                    detectedInfo.users === 0
                  }
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 text-sm font-bold text-white transition-all hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Importar {detectedInfo.users} usuários
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* FORMULÁRIO PADRÃO (Oculto durante a importação) */
          <form onSubmit={handleCreateNewUser} className={`space-y-6 transition-opacity ${importProgress ? 'opacity-50 pointer-events-none hidden' : ''}`}>
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
              <button type="button" onClick={onClose} disabled={isCreatingUser} className="h-11 rounded-xl bg-transparent px-5 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={isCreatingUser} className="h-11 flex items-center gap-2 rounded-xl bg-cyan-600 px-6 text-sm font-bold text-white transition-colors hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)] disabled:opacity-50">
                {isCreatingUser && !importProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Usuário
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}