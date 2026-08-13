'use client'

import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// Estrutura padrão dos dados esperados
export interface ImportUserPayload {
  email: string
  full_name: string
  cpf?: string
  phone?: string
  municipality?: string
  institution_organization?: string
  organization_type?: string
  job_title?: string
  relationship_with_otdsp?: string
  referral_source?: string
}

interface ExcelImporterProps {
  onSuccess?: () => void
}

export default function ExcelImporter({ onSuccess }: ExcelImporterProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [logs, setLogs] = useState<{ type: 'success' | 'error'; message: string }[]>([])

  // Função para processar a planilha
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setLogs([])

    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })

        // Pega a primeira aba da planilha
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]

        // Converte para JSON
        const rawData: any[] = XLSX.utils.sheet_to_json(ws)

        if (!rawData || rawData.length === 0) {
          setLogs([{ type: 'error', message: 'A planilha está vazia.' }])
          setLoading(false)
          return
        }

        setProgress({ current: 0, total: rawData.length })

        // Processa usuário por usuário
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i]

          // Mapeia os nomes das colunas da planilha para as chaves do seu estado
          const userPayload: ImportUserPayload = {
            email: String(row['Email'] || row['email'] || '').trim(),
            full_name: String(row['Nome Completo'] || row['full_name'] || row['nome'] || '').trim(),
            cpf: String(row['CPF'] || row['cpf'] || '').trim(),
            phone: String(row['Telefone'] || row['phone'] || '').trim(),
            municipality: String(row['Município'] || row['municipality'] || '').trim(),
            institution_organization: String(row['Instituição'] || row['institution_organization'] || '').trim(),
            organization_type: String(row['Tipo Organização'] || row['organization_type'] || '').trim(),
            job_title: String(row['Cargo'] || row['job_title'] || '').trim(),
            relationship_with_otdsp: String(row['Relação OTDSP'] || row['relationship_with_otdsp'] || '').trim(),
            referral_source: String(row['Indicação'] || row['referral_source'] || '').trim(),
          }

          // Validação dos campos obrigatórios
          if (!userPayload.email || !userPayload.full_name) {
            setLogs((prev) => [
              ...prev,
              { type: 'error', message: `Linha ${i + 2}: Email e Nome Completo são obrigatórios.` }
            ])
            continue
          }

          // Gera uma senha temporária padrão para novos cadastros
          const tempPassword = `OTDSP@${Math.random().toString(36).slice(-8)}`

          // 1. Cria a conta no Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userPayload.email,
            password: tempPassword,
            options: {
              data: {
                full_name: userPayload.full_name,
                phone: userPayload.phone,
                municipality: userPayload.municipality,
                institution_organization: userPayload.institution_organization,
                organization_type: userPayload.organization_type,
                job_title: userPayload.job_title,
                relationship_with_otdsp: userPayload.relationship_with_otdsp,
                referral_source: userPayload.referral_source
              }
            }
          })

          if (authError) {
            setLogs((prev) => [
              ...prev,
              { type: 'error', message: `Erro ao criar ${userPayload.email}: ${authError.message}` }
            ])
            continue
          }

          const newUser = authData.user

          if (newUser) {
            // 2. Insere/Atualiza na tabela user_auth
            await supabase.from('user_auth').upsert({
              id: newUser.id,
              email: newUser.email,
              is_staff: false,
              is_active: true
            })

            // 3. Insere/Atualiza na tabela user_profile
            await supabase.from('user_profile').upsert({
              user_id: newUser.id,
              full_name: userPayload.full_name,
              phone: userPayload.phone,
              municipality: userPayload.municipality,
              institution_organization: userPayload.institution_organization,
              organization_type: userPayload.organization_type,
              job_title: userPayload.job_title,
              relationship_with_otdsp: userPayload.relationship_with_otdsp,
              referral_source: userPayload.referral_source
            })

            setLogs((prev) => [
              ...prev,
              { type: 'success', message: `Usuário ${userPayload.email} criado com sucesso!` }
            ])
          }

          setProgress({ current: i + 1, total: rawData.length })
        }

        if (onSuccess) onSuccess()
      } catch (err: any) {
        setLogs((prev) => [...prev, { type: 'error', message: `Erro ao ler arquivo: ${err.message}` }])
      } finally {
        setLoading(false)
      }
    }

    reader.readAsBinaryString(file)
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl text-slate-100 font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">Importar Usuários em Lote</h3>
          <p className="text-xs text-slate-400">Envie uma planilha (.xlsx, .xls ou .csv)</p>
        </div>
      </div>

      {/* Area de Upload */}
      <label className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 group">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
        <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
          Clique para selecionar a planilha
        </span>
        <span className="text-xs text-slate-500 mt-1">Colunas recomendadas: Email, Nome Completo, Telefone, Município, Instituição, Cargo</span>
      </label>

      {/* Barra de Progresso */}
      {loading && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-cyan-400">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processando registros...
            </span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-yellow-400 h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Logs de Retorno */}
      {logs.length > 0 && (
        <div className="mt-6 max-h-48 overflow-y-auto space-y-2 pr-2 text-xs font-mono border-t border-slate-800 pt-4">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg flex items-center gap-2 ${
                log.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-950/40 border border-red-500/30 text-red-400'
              }`}
            >
              {log.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}