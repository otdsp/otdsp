import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Participant } from '@/types/engagement'
import { sendSystemEmail } from '@/lib/emailService'

interface ParticipantManagerProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
}

interface UserProfileRow {
  id: string
  full_name: string
  institution_organization: string | null
  organization_type: string | null
  job_title: string | null
  relationship_with_otdsp: string | null
  municipality: string | null
  referral_source: string | null
}

interface UserAuthRow {
  id: string
  email: string
  cpf: string | null
  phone: string | null
  role: string
  is_active: boolean
}

interface UserSuggestion {
  id: string
  full_name: string
  email: string
  cpf: string
  phone: string
  role: string
  is_active: boolean
  institution_organization: string
  organization_type: string
  job_title: string
  relationship_with_otdsp: string
  municipality: string
  referral_source: string
  status: 'green' | 'yellow'
  missingFields: string[]
}

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '')

const escapeLikeValue = (value: string) =>
  value.replace(/[%_\\]/g, character => `\\${character}`)

const normalizeCpf = (value: string) => value.replace(/\D/g, '')

const buildSuggestion = (
  auth: UserAuthRow,
  profile?: UserProfileRow
): UserSuggestion => {
  const requiredFields: Array<[string, unknown]> = [
    ['Nome completo', profile?.full_name],
    ['E-mail', auth.email],
    ['CPF', auth.cpf],
    ['Telefone', auth.phone],
    ['Perfil de acesso', auth.role],
    ['Instituição/organização', profile?.institution_organization],
    ['Tipo de organização', profile?.organization_type],
    ['Cargo', profile?.job_title],
    ['Relação com o OTDSP', profile?.relationship_with_otdsp],
    ['Município', profile?.municipality],
    ['Como conheceu o projeto', profile?.referral_source]
  ]

  const missingFields = requiredFields
    .filter(([, value]) => isEmpty(value))
    .map(([label]) => label)

  return {
    id: auth.id,
    full_name: profile?.full_name?.trim() || auth.email,
    email: auth.email?.trim() || '',
    cpf: auth.cpf?.trim() || '',
    phone: auth.phone?.trim() || '',
    role: auth.role,
    is_active: auth.is_active,
    institution_organization: profile?.institution_organization?.trim() || '',
    organization_type: profile?.organization_type?.trim() || '',
    job_title: profile?.job_title?.trim() || '',
    relationship_with_otdsp:
      profile?.relationship_with_otdsp?.trim() || '',
    municipality: profile?.municipality?.trim() || '',
    referral_source: profile?.referral_source?.trim() || '',
    status: missingFields.length === 0 ? 'green' : 'yellow',
    missingFields
  }
}

export function ParticipantManager({
  participants,
  onChange
}: ParticipantManagerProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    const term = inputValue.trim()

    if (term.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      setSearchError(null)
      return
    }

    let cancelled = false

    const fetchUsers = async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const escapedTerm = escapeLikeValue(term)
        const digitsOnly = normalizeCpf(term)

        /*
         * A busca é feita separadamente porque:
         * - nome e demais dados de perfil estão em user_profile;
         * - e-mail, CPF e telefone estão em user_auth;
         * - não dependemos de um relacionamento embed configurado no Supabase.
         */
        const profilePromise = supabase
          .from('user_profile')
          .select(`
            id,
            full_name,
            institution_organization,
            organization_type,
            job_title,
            relationship_with_otdsp,
            municipality,
            referral_source
          `)
          .ilike('full_name', `%${escapedTerm}%`)
          .limit(10)

        const authFilters = [
          `email.ilike.%${escapedTerm}%`,
          `phone.ilike.%${escapedTerm}%`
        ]

        if (digitsOnly.length >= 3) {
          authFilters.push(`cpf.ilike.%${digitsOnly}%`)
        } else {
          authFilters.push(`cpf.ilike.%${escapedTerm}%`)
        }

        const authPromise = supabase
          .from('user_auth')
          .select('id, email, cpf, phone, role, is_active')
          .or(authFilters.join(','))
          .limit(10)

        const [
          { data: profilesFound, error: profileError },
          { data: authFound, error: authError }
        ] = await Promise.all([profilePromise, authPromise])

        if (profileError) throw profileError
        if (authError) throw authError

        const matchingProfiles = (profilesFound ?? []) as UserProfileRow[]
        const matchingAuth = (authFound ?? []) as UserAuthRow[]

        const matchingIds = new Set<string>([
          ...matchingProfiles.map(profile => profile.id),
          ...matchingAuth.map(auth => auth.id)
        ])

        if (matchingIds.size === 0) {
          if (!cancelled) {
            setSuggestions([])
            setShowSuggestions(false)
          }
          return
        }

        const ids = Array.from(matchingIds)

        /*
         * Completa os dois lados dos registros encontrados.
         * Quem foi localizado pelo nome ainda precisa de user_auth.
         * Quem foi localizado por e-mail/CPF ainda precisa de user_profile.
         */
        const foundProfileIds = new Set(matchingProfiles.map(profile => profile.id))
        const foundAuthIds = new Set(matchingAuth.map(auth => auth.id))

        const missingProfileIds = ids.filter(id => !foundProfileIds.has(id))
        const missingAuthIds = ids.filter(id => !foundAuthIds.has(id))

        const additionalProfilesPromise =
          missingProfileIds.length > 0
            ? supabase
                .from('user_profile')
                .select(`
                  id,
                  full_name,
                  institution_organization,
                  organization_type,
                  job_title,
                  relationship_with_otdsp,
                  municipality,
                  referral_source
                `)
                .in('id', missingProfileIds)
            : Promise.resolve({ data: [], error: null })

        const additionalAuthPromise =
          missingAuthIds.length > 0
            ? supabase
                .from('user_auth')
                .select('id, email, cpf, phone, role, is_active')
                .in('id', missingAuthIds)
            : Promise.resolve({ data: [], error: null })

        const [
          { data: additionalProfiles, error: additionalProfileError },
          { data: additionalAuth, error: additionalAuthError }
        ] = await Promise.all([
          additionalProfilesPromise,
          additionalAuthPromise
        ])

        if (additionalProfileError) throw additionalProfileError
        if (additionalAuthError) throw additionalAuthError

        const allProfiles = [
          ...matchingProfiles,
          ...((additionalProfiles ?? []) as UserProfileRow[])
        ]

        const allAuth = [
          ...matchingAuth,
          ...((additionalAuth ?? []) as UserAuthRow[])
        ]

        const profilesById = new Map(
          allProfiles.map(profile => [profile.id, profile])
        )
        const authById = new Map(allAuth.map(auth => [auth.id, auth]))

        const alreadyAddedIds = new Set(
          participants
            .map(participant => participant.user_id)
            .filter((id): id is string => Boolean(id))
        )

        const mergedSuggestions = ids
          .filter(id => !alreadyAddedIds.has(id))
          .map(id => {
            const auth = authById.get(id)

            // Um usuário só pode ser convidado como cadastrado se existir em user_auth.
            if (!auth) return null

            return buildSuggestion(auth, profilesById.get(id))
          })
          .filter(
            (suggestion): suggestion is UserSuggestion =>
              suggestion !== null
          )
          .sort((a, b) =>
            a.full_name.localeCompare(b.full_name, 'pt-BR', {
              sensitivity: 'base'
            })
          )
          .slice(0, 10)

        if (!cancelled) {
          setSuggestions(mergedSuggestions)
          setShowSuggestions(mergedSuggestions.length > 0)
        }
      } catch (error) {
        console.error('Erro ao buscar participantes:', error)

        if (!cancelled) {
          setSuggestions([])
          setShowSuggestions(false)
          setSearchError(
            error instanceof Error
              ? error.message
              : 'Não foi possível buscar participantes.'
          )
        }
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }

    const timer = window.setTimeout(fetchUsers, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [inputValue, participants])

  const handleAddSuggestion = (user: UserSuggestion) => {
    const newParticipant: Participant = {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      cpf: user.cpf,
      status: user.status
    }

    onChange([...participants, newParticipant])
    resetInput()
  }

  const handleAddManual = () => {
    const value = inputValue.trim()
    if (!value) return

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const cpfDigits = normalizeCpf(value)
    const isCpf = cpfDigits.length === 11

    const alreadyExists = participants.some(participant => {
      if (isEmail) {
        return participant.email?.trim().toLowerCase() === value.toLowerCase()
      }

      if (isCpf) {
        return normalizeCpf(participant.cpf || '') === cpfDigits
      }

      return (
        participant.full_name?.trim().toLowerCase() === value.toLowerCase()
      )
    })

    if (alreadyExists) {
      setSearchError('Este participante já foi adicionado.')
      return
    }

    const newParticipant: Participant = {
      user_id: null,
      full_name: !isEmail && !isCpf ? value : 'Sem Nome',
      email: isEmail ? value : '',
      cpf: isCpf ? value : '',
      status: 'red'
    }

    onChange([...participants, newParticipant])
    resetInput()
  }

  const handleNotifyPending = async () => {
    const pendingWithEmail = participants.filter(
      participant =>
        participant.status !== 'green' &&
        participant.email &&
        participant.email.trim() !== ''
    )

    if (pendingWithEmail.length === 0) {
      setEmailStatus({
        type: 'error',
        message:
          'Nenhum participante pendente possui um e-mail válido informado.'
      })
      return
    }

    const emailList = Array.from(
      new Set(
        pendingWithEmail.map(participant =>
          participant.email.trim().toLowerCase()
        )
      )
    )

    try {
      setIsSendingEmail(true)
      setEmailStatus(null)

      await sendSystemEmail({
        emails: emailList,
        subject: 'Você foi convidado para participar do nosso Engajamento!',
        htmlContent: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Olá!</h2>
            <p>Você foi adicionado à nossa lista de participantes de engajamento.</p>
            <p>Se você ainda não possui cadastro ou seu perfil está incompleto, acesse a plataforma para atualizar seus dados.</p>
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
    } catch (error) {
      setEmailStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Falha ao enviar as notificações.'
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const resetInput = () => {
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setSearchError(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return

    event.preventDefault()

    if (suggestions.length === 1 && showSuggestions) {
      handleAddSuggestion(suggestions[0])
      return
    }

    handleAddManual()
  }

  const removeParticipant = (index: number) => {
    onChange(participants.filter((_, participantIndex) => participantIndex !== index))
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
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              suggestions.length > 0 && setShowSuggestions(true)
            }
            onBlur={() =>
              window.setTimeout(() => setShowSuggestions(false), 200)
            }
            placeholder="Digite o nome, e-mail, CPF ou telefone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-sm"
          />

          {isSearching && (
            <Loader2 className="w-4 h-4 text-cyan-500 animate-spin absolute right-3 top-3.5" />
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={event => {
                    event.preventDefault()
                    handleAddSuggestion(suggestion)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center gap-3"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-700 truncate">
                      {suggestion.full_name}
                    </span>

                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {suggestion.email}
                      {suggestion.cpf && ` • CPF: ${suggestion.cpf}`}
                    </span>

                    {suggestion.missingFields.length > 0 && (
                      <span
                        className="text-[10px] text-amber-600 truncate"
                        title={`Dados faltantes: ${suggestion.missingFields.join(', ')}`}
                      >
                        Faltam: {suggestion.missingFields.join(', ')}
                      </span>
                    )}
                  </div>

                  {suggestion.status === 'green' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSearching &&
            inputValue.trim().length >= 3 &&
            !showSuggestions &&
            suggestions.length === 0 &&
            !searchError && (
              <p className="mt-1 px-1 text-[11px] text-slate-500">
                Nenhum usuário cadastrado encontrado. Use o botão “+” para
                adicionar como participante externo.
              </p>
            )}

          {searchError && (
            <p className="mt-1 px-1 text-[11px] text-rose-600">
              {searchError}
            </p>
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
          {participants.map((participant, index) => {
            let styles =
              'bg-slate-50 border-slate-200 text-slate-700'
            let Icon = Search

            if (participant.status === 'green') {
              styles =
                'bg-emerald-50 border-emerald-200 text-emerald-800'
              Icon = CheckCircle2
            } else if (participant.status === 'yellow') {
              styles =
                'bg-amber-50 border-amber-200 text-amber-800'
              Icon = AlertCircle
            } else if (participant.status === 'red') {
              styles = 'bg-rose-50 border-rose-200 text-rose-800'
              Icon = XCircle
            }

            const displayLabel =
              participant.full_name &&
              participant.full_name !== 'Sem Nome'
                ? participant.full_name
                : participant.email || participant.cpf || 'Sem identificação'

            return (
              <span
                key={`${participant.user_id || participant.email || participant.cpf}-${index}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${styles}`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />

                <span className="truncate max-w-[200px]">
                  {displayLabel}
                </span>

                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="ml-1 hover:text-red-500 hover:opacity-100 opacity-60 transition-all"
                  aria-label={`Remover ${displayLabel}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {participants.some(participant => participant.status !== 'green') && (
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

            {isSendingEmail
              ? 'Enviando convites...'
              : 'Notificar cadastros pendentes'}
          </button>

          {emailStatus && (
            <p
              className={`text-[11px] font-medium ${
                emailStatus.type === 'success'
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {emailStatus.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}