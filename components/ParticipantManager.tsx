import { useState, useEffect } from 'react'
import { Plus, Search, Mail, Loader2, CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Participant } from '@/types/engagement'
import { sendSystemEmail } from '@/lib/emailService'

interface ParticipantManagerProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
}

export function ParticipantManager({ participants, onChange }: ParticipantManagerProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Auto-complete Relacional (user_profile + user_auth)
  useEffect(() => {
    if (inputValue.trim().length < 3) {
      setSuggestions([])
      return
    }

    const fetchUsers = async () => {
      setIsSearching(true)
      const { data, error } = await supabase
        .from('user_profile')
        .select(`
          id, 
          full_name, 
          cpf, 
          phone, 
          municipality,
          user_auth!inner(email)
        `)
        .or(`full_name.ilike.%${inputValue}%,cpf.ilike.%${inputValue}%`)
        .limit(5)

      if (!error && data) {
        const addedIds = participants.map(p => p.user_id).filter(Boolean)
        const newSuggestions = data.filter(d => !addedIds.includes(d.id))
        
        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
      }
      setIsSearching(false)
    }

    const timer = setTimeout(fetchUsers, 400)
    return () => clearTimeout(timer)
  }, [inputValue, participants])

  const isProfileComplete = (user: any) => {
    return Boolean(user.full_name && user.cpf && user.phone && user.municipality)
  }

  const extractEmail = (user: any) => {
    if (Array.isArray(user.user_auth)) return user.user_auth[0]?.email || ''
    return user.user_auth?.email || ''
  }

  const handleAddSuggestion = (user: any) => {
    const status = isProfileComplete(user) ? 'green' : 'yellow'
    const newParticipant: Participant = {
      user_id: user.id,
      full_name: user.full_name,
      email: extractEmail(user),
      cpf: user.cpf || '',
      status
    }
    
    onChange([...participants, newParticipant])
    resetInput()
  }

  const handleAddManual = () => {
    const val = inputValue.trim()
    if (!val) return

    const isEmail = val.includes('@')
    const isCpf = /^[\d.-]{11,14}$/.test(val)

    const newParticipant: Participant = {
      user_id: null,
      full_name: (!isEmail && !isCpf) ? val : 'Sem Nome',
      email: isEmail ? val : '',
      cpf: isCpf ? val : '',
      status: 'red'
    }
    
    onChange([...participants, newParticipant])
    resetInput()
  }

  // 2. Função que filtra os pendentes e realiza o disparo
  const handleNotifyPending = async () => {
    // Filtra quem não está com perfil completo ('green') e possui e-mail preenchido
    const pendingWithEmail = participants.filter(
      p => p.status !== 'green' && p.email && p.email.trim() !== ''
    )

    if (pendingWithEmail.length === 0) {
      setEmailStatus({
        type: 'error',
        message: 'Nenhum participante pendente possui um e-mail válido informado.'
      })
      return
    }

    const emailList = pendingWithEmail.map(p => p.email)

    try {
      setIsSendingEmail(true)
      setEmailStatus(null)

      // Executa a sua função de integração
      await sendSystemEmail({
        emails: emailList,
        subject: 'Você foi convidado para participar do nosso Engajamento!',
        htmlContent: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Olá!</h2>
            <p>Você foi adicionado à nossa lista de participantes de engajamento.</p>
            <p>Se você ainda não possui cadastro ou seu perfil está incompleto, por favor acesse a plataforma para atualizar seus dados.</p>
            <br />
            <a href="${window.location.origin}" style="background-color: #06b6d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Plataforma
            </a>
          </div>
        `
      })

      setEmailStatus({
        type: 'success',
        message: `E-mail de notificação enviado com sucesso para ${emailList.length} participante(s)!`
      })
    } catch (error: any) {
      setEmailStatus({
        type: 'error',
        message: error.message || 'Falha ao enviar as notificações.'
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const resetInput = () => {
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddManual()
    }
  }

  const removeParticipant = (index: number) => {
    onChange(participants.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 relative">
        <div className="relative flex-grow">
          <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Digite o Nome, E-mail ou CPF..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-sm"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-cyan-500 animate-spin absolute right-3 top-3" />}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleAddSuggestion(s); }}
                  className="w-full text-left px-4 py-3 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{s.full_name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {extractEmail(s)} {s.cpf && ` • CPF: ${s.cpf}`}
                    </span>
                  </div>
                  {isProfileComplete(s) 
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                    : <AlertCircle className="w-4 h-4 text-amber-500" />
                  }
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          type="button" 
          onClick={handleAddManual} 
          className="bg-[#0F172A] hover:bg-slate-800 px-4 rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"
          title="Adicionar participante externo"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {participants.map((p, idx) => {
            let styles = 'bg-slate-50 border-slate-200 text-slate-700';
            let Icon = Search;
            
            if (p.status === 'green') { 
              styles = 'bg-emerald-50 border-emerald-200 text-emerald-800'; 
              Icon = CheckCircle2; 
            } else if (p.status === 'yellow') { 
              styles = 'bg-amber-50 border-amber-200 text-amber-800'; 
              Icon = AlertCircle; 
            } else if (p.status === 'red') { 
              styles = 'bg-rose-50 border-rose-200 text-rose-800'; 
              Icon = XCircle; 
            }

            const displayLabel = p.full_name !== 'Sem Nome' ? p.full_name : (p.email || p.cpf)

            return (
              <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${styles}`}>
                <Icon className="w-3.5 h-3.5 opacity-80" />
                
                <span className="truncate max-w-[200px]">
                  {displayLabel}
                </span>
                
                <button 
                  type="button" 
                  onClick={() => removeParticipant(idx)} 
                  className="ml-1 hover:text-red-500 hover:opacity-100 opacity-60 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* 3. Seção do botão alterada para usar a API de e-mail real */}
      {participants.some(p => p.status !== 'green') && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button 
            type="button" 
            onClick={handleNotifyPending}
            disabled={isSendingEmail} 
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100/50 py-1.5 px-3 rounded-lg transition-colors border border-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingEmail ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            {isSendingEmail ? 'Enviando convites...' : 'Notificar cadastros pendentes'}
          </button>

          {/* Toast / Alerta em tela do status do envio */}
          {emailStatus && (
            <p className={`text-[11px] font-medium ${
              emailStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {emailStatus.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}