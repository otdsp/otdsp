import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Loader2,
  MapPin,
  X,
  XCircle
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Participant } from '@/types/engagement'

type SortField = 'name' | 'institution' | 'municipality' | 'status'
type SortDirection = 'asc' | 'desc'
type VisualStatus = 'green' | 'yellow' | 'red'

interface EngagementParticipantTableProps {
  participants: Participant[]
  onRemove: (index: number) => void
  readOnly?: boolean
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

interface ParticipantDetail {
  id: string
  full_name: string
  institution_organization: string
  organization_type: string
  job_title: string
  relationship_with_otdsp: string
  municipality: string
  referral_source: string
  status: VisualStatus
  missingFields: string[]
}

interface ParticipantRow {
  originalIndex: number
  participant: Participant
  status: VisualStatus
  displayName: string
  email: string
  institution: string
  organizationType: string
  jobTitle: string
  relationship: string
  municipality: string
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

const buildParticipantDetail = (
  profile: UserProfileRow
): ParticipantDetail => {
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

const statusOrder: Record<VisualStatus, number> = {
  green: 0,
  yellow: 1,
  red: 2
}

export function EngagementParticipantTable({
  participants,
  onRemove,
  readOnly = false,
  isStaff = false
}: EngagementParticipantTableProps) {
  const [detailsById, setDetailsById] = useState<
    Record<string, ParticipantDetail>
  >({})
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc')

  const registeredIds = useMemo(
    () =>
      Array.from(
        new Set(
          participants
            .map(participant => participant.user_id)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [participants]
  )

  useEffect(() => {
    if (registeredIds.length === 0) {
      setDetailsById({})
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchDetails = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('user_profile')
        .select(PROFILE_SELECT)
        .in('id', registeredIds)

      if (cancelled) return

      if (error) {
        console.error(
          'Erro ao carregar perfis dos participantes:',
          error.message
        )
        setDetailsById({})
        setLoading(false)
        return
      }

      const nextDetails = ((data ?? []) as UserProfileRow[]).reduce<
        Record<string, ParticipantDetail>
      >((accumulator, profile) => {
        accumulator[profile.id] = buildParticipantDetail(profile)
        return accumulator
      }, {})

      setDetailsById(nextDetails)
      setLoading(false)
    }

    fetchDetails()

    return () => {
      cancelled = true
    }
  }, [registeredIds])

  const rows = useMemo<ParticipantRow[]>(() => {
    return participants.map((participant, originalIndex) => {
      const detail = participant.user_id
        ? detailsById[participant.user_id]
        : undefined

      const status: VisualStatus = participant.user_id
        ? detail?.status ?? 'yellow'
        : 'red'

      const displayName =
        detail?.full_name ||
        (participant.full_name && participant.full_name !== 'Sem Nome'
          ? participant.full_name
          : participant.email || 'Sem identificação')

      return {
        originalIndex,
        participant,
        status,
        displayName,
        email: participant.email || '',
        institution: detail?.institution_organization || '',
        organizationType: detail?.organization_type || '',
        jobTitle: detail?.job_title || '',
        relationship: detail?.relationship_with_otdsp || '',
        municipality: detail?.municipality || '',
        missingFields: detail?.missingFields || []
      }
    })
  }, [participants, detailsById])

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let comparison = 0

      if (sortField === 'status') {
        comparison = statusOrder[a.status] - statusOrder[b.status]
      } else {
        const valueA =
          sortField === 'name'
            ? a.displayName
            : sortField === 'institution'
              ? a.institution
              : a.municipality

        const valueB =
          sortField === 'name'
            ? b.displayName
            : sortField === 'institution'
              ? b.institution
              : b.municipality

        comparison = valueA.localeCompare(valueB, 'pt-BR', {
          sensitivity: 'base'
        })
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [rows, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection('asc')
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    }

    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }

  const renderStatus = (row: ParticipantRow) => {
    if (row.status === 'green') {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Completo
        </span>
      )
    }

    if (row.status === 'yellow') {
      const pendingLabel = 'Incompleto'

      return (
        <span
          title={
            row.missingFields.length
              ? `Dados faltantes: ${row.missingFields.join(', ')}`
              : undefined
          }
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
        >
          <AlertCircle className="h-3.5 w-3.5" /> {pendingLabel}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
        <XCircle className="h-3.5 w-3.5" /> Externo
      </span>
    )
  }

  if (participants.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {loading && registeredIds.length > 0 ? (
        <div className="flex items-center justify-center gap-2 py-7 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          Carregando participantes...
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                {isStaff ? (
                  <>
                    <col className="w-[30%]" />
                    <col className="w-[27%]" />
                    <col className="w-[24%]" />
                    <col className="w-[11%]" />
                    <col className="w-[8%]" />
                  </>
                ) : (
                  <>
                    <col className="w-[36%]" />
                    <col className="w-[34%]" />
                    <col className="w-[30%]" />
                  </>
                )}
              </colgroup>

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-cyan-600"
                    >
                      Participante <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('institution')}
                      className="flex items-center gap-1 hover:text-cyan-600"
                    >
                      Instituição / Atuação <SortIcon field="institution" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('municipality')}
                      className="flex items-center gap-1 hover:text-cyan-600"
                    >
                      Classificação <SortIcon field="municipality" />
                    </button>
                  </th>
                  {isStaff && (
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="mx-auto flex items-center justify-center gap-1.5 hover:text-cyan-600"
                      >
                        Cadastro <SortIcon field="status" />
                      </button>
                    </th>
                  )}
                  {isStaff && !readOnly && (
                    <th className="px-3 py-3 text-center">Ação</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedRows.map(row => (
                  <tr
                    key={`${row.participant.user_id || row.participant.email}-${row.originalIndex}`}
                    className="hover:bg-cyan-50/30"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-bold text-slate-800"
                          title={row.displayName}
                        >
                          {row.displayName}
                        </div>
                        {row.email && (
                          <div
                            className="mt-1 truncate text-xs text-slate-500"
                            title={row.email}
                          >
                            {row.email}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-semibold text-slate-700"
                          title={row.institution || undefined}
                        >
                          {row.institution || 'Sem instituição'}
                        </div>
                        <div
                          className="mt-1 truncate text-xs text-slate-500"
                          title={row.jobTitle || undefined}
                        >
                          {row.jobTitle || 'Cargo não informado'}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span
                            className="truncate"
                            title={[row.municipality, row.organizationType]
                              .filter(Boolean)
                              .join(' • ')}
                          >
                            {row.municipality || 'Sem município'}
                            {row.organizationType && ` • ${row.organizationType}`}
                          </span>
                        </div>
                        <div
                          className="mt-1 truncate text-xs text-slate-400"
                          title={row.relationship || undefined}
                        >
                          {row.relationship || 'Relação não informada'}
                        </div>
                      </div>
                    </td>

                    {isStaff && (
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex items-center justify-center">
                          {renderStatus(row)}
                        </div>
                      </td>
                    )}

                    {isStaff && !readOnly && (
                      <td className="px-3 py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => onRemove(row.originalIndex)}
                          className="mx-auto rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title={`Remover ${row.displayName}`}
                          aria-label={`Remover ${row.displayName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
            {sortedRows.map(row => (
              <div
                key={`compact-${row.participant.user_id || row.participant.email}-${row.originalIndex}`}
                className="min-w-0 border-slate-100 p-4 sm:border-b sm:border-r lg:hidden"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-bold text-slate-800"
                      title={row.displayName}
                    >
                      {row.displayName}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {row.jobTitle || row.institution || row.email || 'Sem dados complementares'}
                    </div>
                    <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {row.municipality || 'Sem município'}
                        {row.organizationType && ` • ${row.organizationType}`}
                      </span>
                    </div>
                  </div>

                  {isStaff && (
                    <div className="flex shrink-0 items-center gap-1">
                      {renderStatus(row)}
                      {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onRemove(row.originalIndex)}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title={`Remover ${row.displayName}`}
                        aria-label={`Remover ${row.displayName}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}