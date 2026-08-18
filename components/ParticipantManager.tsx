import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Participant } from '@/types/engagement'
import { EngagementParticipantTable } from '@/components/EngagementParticipantTable'

interface ParticipantManagerProps {
  participants: Participant[]
  onChange: (participants: Participant[]) => void
  isStaff?: boolean
}

interface UserProfileRow {
  id: string
  full_name: string | null
  institution_organization: string | null
  organization_type: string | null
  job_title: string | null
  relationship_with_otdsp: string | null
  municipality: string | null
  referral_source: string | null
}

interface UserSuggestion {
  id: string
  full_name: string
  institution_organization: string
  organization_type: string
  job_title: string
  relationship_with_otdsp: string
  municipality: string
  referral_source: string
  status: 'green' | 'yellow'
  missingFields: string[]
}

const PROFILE_SELECT = `
  id,
  full_name,
  institution_organization,
  organization_type,
  job_title,
  relationship_with_otdsp,
  municipality,
  referral_source
`

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '')

const escapeLikeValue = (value: string) =>
  value.replace(/[%_\\]/g, character => `\\${character}`)

const buildSuggestion = (profile: UserProfileRow): UserSuggestion => {
  const requiredFields: Array<[string, unknown]> = [
    ['Nome completo', profile.full_name],
    ['Instituição/organização', profile.institution_organization],
    ['Tipo de organização', profile.organization_type],
    ['Cargo', profile.job_title],
    ['Relação com o OTDSP', profile.relationship_with_otdsp],
    ['Município', profile.municipality],
    ['Como conheceu o projeto', profile.referral_source]
  ]

  const missingFields = requiredFields
    .filter(([, value]) => isEmpty(value))
    .map(([label]) => label)

  return {
    id: profile.id,
    full_name: profile.full_name?.trim() || 'Usuário sem nome',
    institution_organization:
      profile.institution_organization?.trim() || '',
    organization_type: profile.organization_type?.trim() || '',
    job_title: profile.job_title?.trim() || '',
    relationship_with_otdsp:
      profile.relationship_with_otdsp?.trim() || '',
    municipality: profile.municipality?.trim() || '',
    referral_source: profile.referral_source?.trim() || '',
    status: missingFields.length === 0 ? 'green' : 'yellow',
    missingFields
  }
}

export function ParticipantManager({
  participants,
  onChange,
  isStaff = false
}: ParticipantManagerProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!isStaff) {
      setSuggestions([])
      setShowSuggestions(false)
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const term = inputValue.trim()

    if (term.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      setSearchError(null)
      setIsSearching(false)
      return
    }

    let cancelled = false

    const fetchUsers = async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const escapedTerm = escapeLikeValue(term)
        const searchPattern = `%${escapedTerm}%`

        const { data, error } = await supabase
          .from('user_profile')
          .select(PROFILE_SELECT)
          .or(
            [
              `full_name.ilike.${searchPattern}`,
              `institution_organization.ilike.${searchPattern}`,
              `organization_type.ilike.${searchPattern}`,
              `job_title.ilike.${searchPattern}`,
              `relationship_with_otdsp.ilike.${searchPattern}`,
              `municipality.ilike.${searchPattern}`
            ].join(',')
          )
          .limit(15)

        if (error) throw error

        const alreadyAddedIds = new Set(
          participants
            .map(participant => participant.user_id)
            .filter((id): id is string => Boolean(id))
        )

        const nextSuggestions = ((data ?? []) as UserProfileRow[])
          .filter(profile => !alreadyAddedIds.has(profile.id))
          .map(buildSuggestion)
          .sort((a, b) =>
            a.full_name.localeCompare(b.full_name, 'pt-BR', {
              sensitivity: 'base'
            })
          )
          .slice(0, 10)

        if (!cancelled) {
          setSuggestions(nextSuggestions)
          setShowSuggestions(nextSuggestions.length > 0)
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
  }, [inputValue, participants, isStaff])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleAddSuggestion = (user: UserSuggestion) => {
    const newParticipant: Participant = {
      user_id: user.id,
      full_name: user.full_name,
      email: '',
      cpf: '',
      status: user.status
    }

    onChange([...participants, newParticipant])
    resetInput()
  }

  const handleAddManual = () => {
    const value = inputValue.trim()
    if (!value) return

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    const alreadyExists = participants.some(participant => {
      if (isEmail) {
        return participant.email?.trim().toLowerCase() === value.toLowerCase()
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
      full_name: isEmail ? 'Participante externo' : value,
      email: isEmail ? value : '',
      cpf: '',
      status: 'red'
    }

    onChange([...participants, newParticipant])
    resetInput()
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
    onChange(
      participants.filter((_, participantIndex) => participantIndex !== index)
    )
  }

  return (
    <div className="space-y-5">
      {isStaff && (
        <div className="relative flex gap-2">
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute bottom-0 left-3 top-0 flex items-center">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
  
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() =>
                suggestions.length > 0 && setShowSuggestions(true)
              }
              onBlur={() =>
                window.setTimeout(() => setShowSuggestions(false), 200)
              }
              placeholder="Busque por nome, instituição, cargo ou município..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-cyan-500"
            />
  
            {isSearching && (
              <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-cyan-500" />
            )}
  
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={event => {
                      event.preventDefault()
                      handleAddSuggestion(suggestion)
                    }}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-cyan-50"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold text-slate-700">
                        {suggestion.full_name}
                      </span>
                      <span className="truncate text-[11px] font-medium text-slate-500">
                        {[
                          suggestion.job_title,
                          suggestion.institution_organization,
                          suggestion.municipality
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'Perfil sem classificação'}
                      </span>
                      {suggestion.missingFields.length > 0 && (
                        <span
                          className="truncate text-[10px] text-amber-600"
                          title={`Dados faltantes: ${suggestion.missingFields.join(', ')}`}
                        >
                          {suggestion.missingFields.length}{' '}
                          {suggestion.missingFields.length === 1
                            ? 'dado pendente'
                            : 'dados pendentes'}
                        </span>
                      )}
                    </div>
  
                    {suggestion.status === 'green' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
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
                  Nenhum perfil encontrado. Use o botão “+” para adicionar um
                  participante externo pelo nome ou e-mail.
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
            className="flex shrink-0 items-center justify-center rounded-xl bg-[#0F172A] px-4 shadow-sm transition-colors hover:bg-slate-800"
            title="Adicionar participante externo"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {participants.length > 0 && (
        <EngagementParticipantTable
          participants={participants}
          onRemove={removeParticipant}
          isStaff={isStaff}
          readOnly={!isStaff}
        />
      )}
    </div>
  )
}