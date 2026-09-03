import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Loader2,
  MapPin,
  UserRound,
  FlaskConical,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Participant } from '@/types/engagement'

type SortField = 'name' | 'contact' | 'institution' | 'municipality' | 'status'
type SortDirection = 'asc' | 'desc'
type VisualStatus = 'green' | 'yellow' | 'red'

interface EngagementParticipantTableProps {
  participants: Participant[]
  onRemove: (index: number) => void
  readOnly?: boolean
  isStaff?: boolean
  filterTerm?: string
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

interface UserAuthDetail {
  id: string
  email: string | null
  phone: string | null
  role: string | null
  is_active: boolean | null
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
  phone: string
  institution: string
  organizationType: string
  jobTitle: string
  relationship: string
  municipality: string
  role: string
  isActive: boolean | null
  missingFields: string[]
}

interface SortIconProps {
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
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

function SortIcon({
  field,
  sortField,
  sortDirection
}: SortIconProps) {
  if (sortField !== field) {
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
  }

  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  )
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

function renderRegistrationStatus(row: ParticipantRow) {
  if (row.status === 'green') {
    return (
      <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Completo
      </span>
    )
  }

  if (row.status === 'yellow') {
    return (
      <span
        title={
          row.missingFields.length
            ? `Dados faltantes: ${row.missingFields.join(', ')}`
            : undefined
        }
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
      >
        <AlertCircle className="h-3.5 w-3.5" /> Incompleto
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
      <XCircle className="h-3.5 w-3.5" /> Externo
    </span>
  )
}

export function EngagementParticipantTable({
  participants,
  onRemove,
  readOnly = false,
  isStaff = false,
  filterTerm = ''
}: EngagementParticipantTableProps) {
  const [detailsById, setDetailsById] = useState<Record<string, ParticipantDetail>>({})
  const [authById, setAuthById] = useState<Record<string, UserAuthDetail>>({})
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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

      try {
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
          return
        }

        const nextDetails = ((data ?? []) as UserProfileRow[]).reduce<
          Record<string, ParticipantDetail>
        >((accumulator, profile) => {
          accumulator[profile.id] = buildParticipantDetail(profile)
          return accumulator
        }, {})

        setDetailsById(nextDetails)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchDetails()

    return () => {
      cancelled = true
    }
  }, [registeredIds])

  useEffect(() => {
    if (!isStaff || registeredIds.length === 0) {
      setAuthById({})
      setAuthLoading(false)
      return
    }

    let cancelled = false

    const fetchAuthDetails = async () => {
      setAuthLoading(true)

      try {
        const { data, error } = await supabase
          .from('user_auth')
          .select(`
            id,
            email,
            phone,
            role,
            is_active
          `)
          .in('id', registeredIds)

        if (cancelled) return

        if (error) {
          console.error(
            'Erro ao carregar dados administrativos dos participantes:',
            error.message
          )
          setAuthById({})
          return
        }

        const nextAuth = ((data ?? []) as UserAuthDetail[]).reduce<
          Record<string, UserAuthDetail>
        >((accumulator, authDetail) => {
          accumulator[authDetail.id] = authDetail
          return accumulator
        }, {})

        setAuthById(nextAuth)
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    void fetchAuthDetails()

    return () => {
      cancelled = true
    }
  }, [registeredIds, isStaff])

  const effectiveDetailsById =
    registeredIds.length === 0 ? {} : detailsById

  const rows = useMemo<ParticipantRow[]>(() => {
    return participants.map((participant, originalIndex) => {
      const detail = participant.user_id
        ? effectiveDetailsById[participant.user_id]
        : undefined

      const authDetail =
        isStaff && participant.user_id
          ? authById[participant.user_id]
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
        email: authDetail?.email || participant.email || '',
        phone: authDetail?.phone || '',
        institution: detail?.institution_organization || '',
        organizationType: detail?.organization_type || '',
        jobTitle: detail?.job_title || '',
        relationship: detail?.relationship_with_otdsp || '',
        municipality: detail?.municipality || '',
        role: authDetail?.role || '',
        isActive: authDetail?.is_active ?? null,
        missingFields: detail?.missingFields || []
      }
    })
  }, [participants, effectiveDetailsById, authById, isStaff])

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR')

  const filteredRows = useMemo(() => {
    const term = normalizeText(filterTerm)

    if (!term) {
      return rows
    }

    return rows.filter(row => {
      const searchableText = [
        row.displayName,
        row.email,
        row.phone,
        row.institution,
        row.organizationType,
        row.jobTitle,
        row.municipality,
        row.role
      ]
        .map(normalizeText)
        .join(' ')

      return searchableText.includes(term)
    })
  }, [rows, filterTerm])

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let comparison = 0

      if (sortField === 'status') {
        comparison = statusOrder[a.status] - statusOrder[b.status]
      } else {
        const valueA =
          sortField === 'name'
            ? a.displayName
            : sortField === 'contact'
              ? a.email
              : sortField === 'institution'
                ? a.institution
                : a.municipality

        const valueB =
          sortField === 'name'
            ? b.displayName
            : sortField === 'contact'
              ? b.email
              : sortField === 'institution'
                ? b.institution
                : b.municipality

        comparison = valueA.localeCompare(valueB, 'pt-BR', {
          sensitivity: 'base'
        })
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredRows, sortField, sortDirection])

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

  if (participants.length === 0) return null

  const isLoading =
    registeredIds.length > 0 &&
    (loading || (isStaff && authLoading))

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {isLoading ? (
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
                  readOnly ? (
                    <>
                      <col className="w-[24%]" />
                      <col className="w-[21%]" />
                      <col className="w-[27%]" />
                      <col className="w-[16%]" />
                      <col className="w-[12%]" />
                    </>
                  ) : (
                    <>
                      <col className="w-[22%]" />
                      <col className="w-[19%]" />
                      <col className="w-[25%]" />
                      <col className="w-[15%]" />
                      <col className="w-[12%]" />
                      <col className="w-[7%]" />
                    </>
                  )
                ) : (
                  <>
                    <col className="w-[30%]" />
                    <col className="w-[44%]" />
                    <col className="w-[26%]" />
                  </>
                )}
              </colgroup>

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">
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

                  {isStaff && (
                    <th className="px-4 py-3">
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
                  )}

                  <th className="px-4 py-3">
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

                  <th className="px-4 py-3">
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

                  {isStaff && (
                    <th className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="mx-auto flex items-center justify-center gap-1.5 transition-colors hover:text-cyan-600"
                      >
                        Status
                        <SortIcon
                          field="status"
                          sortField={sortField}
                          sortDirection={sortDirection}
                        />
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
                    className="transition-colors hover:bg-cyan-50/30"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-bold text-slate-800"
                          title={row.displayName}
                        >
                          {row.displayName}
                        </div>
                      </div>
                    </td>

                    {isStaff && (
                      <td className="px-4 py-3 align-middle">
                        <div className="min-w-0">
                          {row.email && (
                            <div
                              className="truncate text-sm text-slate-700"
                              title={row.email}
                            >
                              {row.email}
                            </div>
                          )}

                          {row.phone && (
                            <div
                              className="mt-1 truncate text-xs font-medium text-slate-500"
                              title={row.phone}
                            >
                              {row.phone}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        {row.institution && (
                          <div
                            className="truncate text-sm font-semibold text-slate-700"
                            title={row.institution}
                          >
                            {row.institution}
                          </div>
                        )}

                        {row.jobTitle && (
                          <div
                            className="mt-1 truncate text-xs font-medium text-slate-500"
                            title={row.jobTitle}
                          >
                            {row.jobTitle}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      {row.municipality && (
                        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-600">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span
                            className="truncate"
                            title={row.municipality}
                          >
                            {row.municipality}
                          </span>
                        </div>
                      )}
                    </td>

                    {isStaff && (
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col items-start gap-2">
                          {row.role && renderRoleBadge(row.role)}

                          {renderRegistrationStatus(row)}

                          {row.isActive !== null && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                row.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Activity className="h-3.5 w-3.5" />
                              {row.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {isStaff && !readOnly && (
                      <td className="px-3 py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => onRemove(row.originalIndex)}
                          className="mx-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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

          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:hidden">
            {sortedRows.map(row => (
              <div
                key={`compact-${row.participant.user_id || row.participant.email}-${row.originalIndex}`}
                className="min-w-0 border-slate-100 p-4 sm:border-b sm:border-r"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-bold text-slate-800"
                      title={row.displayName}
                    >
                      {row.displayName}
                    </div>

                    {isStaff && row.email && (
                      <div className="mt-1 truncate text-xs font-medium text-slate-500">
                        {row.email}
                      </div>
                    )}

                    {isStaff && row.phone && (
                      <div className="mt-1 truncate text-xs font-medium text-slate-500">
                        {row.phone}
                      </div>
                    )}

                    {(row.institution || row.jobTitle) && (
                      <div className="mt-2 min-w-0">
                        {row.institution && (
                          <div className="truncate text-sm font-semibold text-slate-700">
                            {row.institution}
                          </div>
                        )}
                        {row.jobTitle && (
                          <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                            {row.jobTitle}
                          </div>
                        )}
                      </div>
                    )}

                    {row.municipality && (
                      <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {row.municipality}
                        </span>
                      </div>
                    )}
                  </div>

                  {isStaff && (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {row.role && renderRoleBadge(row.role)}

                      {renderRegistrationStatus(row)}

                      {row.isActive !== null && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            row.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          {row.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onRemove(row.originalIndex)}
                          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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