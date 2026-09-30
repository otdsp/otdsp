'use client'

import type { Dispatch, SetStateAction } from 'react'
import { motion } from 'motion/react'
import {
  Activity,
  Calendar,
  Filter,
  Layers3,
  LayoutGrid,
  Loader2,
  Lock,
  MapPin,
  Rows3,
  Search,
  Table2,
  Users,
  Waypoints
} from 'lucide-react'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { MultiSelectFilter } from '@/components/MultiSelectFilter'
import { EngagementGrid } from './EngagementGrid'
import type { Engagement } from '@/types/engagement'

type DimensionFilter = {
  enabled: boolean
  values: string[]
}

type PeriodFilters = {
  startDate: string
  endDate: string
  vertical: DimensionFilter
  horizontal: DimensionFilter
  transversal: DimensionFilter
}

type FilterOptions = {
  verticals: string[]
  horizontals: string[]
  transversals: string[]
}

type EngagementHistoryProps = {
  loading: boolean
  engagements: Engagement[]
  viewMode: 'cards' | 'grid'
  handleViewModeChange: (mode: 'cards' | 'grid') => void
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  statusFilter: string
  setStatusFilter: Dispatch<SetStateAction<string>>
  filterOptions: FilterOptions
  periodFilters: PeriodFilters
  handleFilterChange: (filterKey: string, newValue: any) => void
  isStaff: boolean
  checkIsPast: (eventDate: string, duration: number) => boolean
  handleOpenDetails: (engagement: Engagement) => void
  formatDate: (dateString: string) => string
  getParticipantDisplayName: (participant: any) => string
}

export function EngagementHistory({
  loading,
  engagements: filteredEngagements,
  viewMode,
  handleViewModeChange,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filterOptions,
  periodFilters,
  handleFilterChange,
  isStaff,
  checkIsPast,
  handleOpenDetails,
  formatDate,
  getParticipantDisplayName
}: EngagementHistoryProps) {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white p-2 mt-8">
      <div className="bg-white rounded-[2rem] shadow-sm p-8 md:p-12 min-h-[500px]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800">
              <Calendar className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Seu Histórico
              </h2>

              <p className="text-slate-500">
                Acompanhe suas ações no
                ecossistema.
              </p>
            </div>
          </div>

          <div
            className="inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              aria-pressed={
                viewMode === 'cards'
              }
              onClick={() =>
                handleViewModeChange(
                  'cards'
                )
              }
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>

            <button
              type="button"
              aria-pressed={
                viewMode === 'grid'
              }
              onClick={() =>
                handleViewModeChange(
                  'grid'
                )
              }
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table2 className="w-4 h-4" />
              Grade
            </button>
          </div>
        </div>

        {/* Bloco de Filtros */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-5 lg:items-center relative z-40 mb-8">
          <div className="flex items-center gap-2 lg:border-r border-slate-100 pr-4 shrink-0">
            <Filter className="w-5 h-5 text-slate-400" />

            <span className="font-semibold text-slate-700 text-sm tracking-wide uppercase">
              Filtros
            </span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-80 flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                  Buscar
                </label>

                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

                  <input
                    type="text"
                    placeholder="Título ou descrição..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 w-full">
                <DateRangeFilter
                  startDate={
                    periodFilters.startDate
                  }
                  endDate={
                    periodFilters.endDate
                  }
                  onStartDateChange={(
                    date
                  ) =>
                    handleFilterChange(
                      'startDate',
                      date
                    )
                  }
                  onEndDateChange={(
                    date
                  ) =>
                    handleFilterChange(
                      'endDate',
                      date
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MultiSelectFilter
                label="Vertical"
                icon={Layers3}
                enabled={
                  periodFilters.vertical
                    .enabled
                }
                values={
                  periodFilters.vertical
                    .values
                }
                options={
                  filterOptions.verticals
                }
                onEnabledChange={(
                  nextEnabled
                ) =>
                  handleFilterChange(
                    'vertical',
                    {
                      enabled:
                        nextEnabled,
                      values:
                        nextEnabled
                          ? [
                              ...filterOptions.verticals
                            ]
                          : []
                    }
                  )
                }
                onValuesChange={(
                  nextValues
                ) =>
                  handleFilterChange(
                    'vertical',
                    {
                      ...periodFilters.vertical,
                      values:
                        nextValues
                    }
                  )
                }
              />

              <MultiSelectFilter
                label="Horizontal"
                icon={Rows3}
                enabled={
                  periodFilters
                    .horizontal.enabled
                }
                values={
                  periodFilters
                    .horizontal.values
                }
                options={
                  filterOptions.horizontals
                }
                onEnabledChange={(
                  nextEnabled
                ) =>
                  handleFilterChange(
                    'horizontal',
                    {
                      enabled:
                        nextEnabled,
                      values:
                        nextEnabled
                          ? [
                              ...filterOptions.horizontals
                            ]
                          : []
                    }
                  )
                }
                onValuesChange={(
                  nextValues
                ) =>
                  handleFilterChange(
                    'horizontal',
                    {
                      ...periodFilters.horizontal,
                      values:
                        nextValues
                    }
                  )
                }
              />

              <MultiSelectFilter
                label="Transversal"
                icon={Waypoints}
                enabled={
                  periodFilters
                    .transversal.enabled
                }
                values={
                  periodFilters
                    .transversal.values
                }
                options={
                  filterOptions.transversals
                }
                onEnabledChange={(
                  nextEnabled
                ) =>
                  handleFilterChange(
                    'transversal',
                    {
                      enabled:
                        nextEnabled,
                      values:
                        nextEnabled
                          ? [
                              ...filterOptions.transversals
                            ]
                          : []
                    }
                  )
                }
                onValuesChange={(
                  nextValues
                ) =>
                  handleFilterChange(
                    'transversal',
                    {
                      ...periodFilters.transversal,
                      values:
                        nextValues
                    }
                  )
                }
              />

              <div className="relative flex items-center h-full min-h-[42px]">
                <Activity className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full h-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl pl-9 pr-8 text-xs font-semibold text-slate-600 appearance-none outline-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all py-3"
                >
                  <option value="Todos">
                    Todos os Status
                  </option>

                  <option value="Planejado">
                    Planejado
                  </option>

                  <option value="Pendente">
                    Pendente
                  </option>

                  <option value="Cancelado">
                    Cancelado
                  </option>

                  <option value="Concluído">
                    Concluído
                  </option>
                </select>

                <div className="absolute right-3 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          </div>
        ) : filteredEngagements.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4" />

            <h3 className="text-lg font-bold text-slate-700">
              Nenhum engajamento
              encontrado
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Ajuste os filtros ou a
              busca para visualizar
              outros resultados.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEngagements.map(
              (eng) => {
                const isPast =
                  checkIsPast(
                    eng.event_date,
                    eng.estimated_duration ||
                      0
                  )

                return (
                  <motion.div
                    key={eng.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleOpenDetails(
                        eng
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault()
                        handleOpenDetails(
                          eng
                        )
                      }
                    }}
                    className="cursor-pointer bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-xl rounded-3xl p-8 outline-none transition-all duration-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-600">
                        {eng.status}
                      </span>

                      {isPast && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <Lock className="w-3 h-3" />
                          Encerrado
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {eng.title}
                    </h3>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {eng.description}
                    </p>

                    {isStaff &&
                      eng
                        .engagement_staff_notes
                        ?.notes && (
                        <div className="mb-4 p-4 bg-cyan-50/20 rounded-xl border border-cyan-100/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-1">
                            Notas
                            Administrativas
                            (Staff)
                          </p>

                          <p className="text-xs text-slate-700 italic font-medium">
                            &quot;
                            {
                              eng
                                .engagement_staff_notes
                                .notes
                            }
                            &quot;
                          </p>
                        </div>
                      )}

                    {eng
                      .engagement_participants &&
                      eng
                        .engagement_participants
                        .length >
                        0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Participantes
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {eng.engagement_participants
                              .slice(
                                0,
                                5
                              )
                              .map(
                                (
                                  p: any,
                                  idx: number
                                ) => {
                                  const displayName =
                                    getParticipantDisplayName(
                                      p
                                    )

                                  return (
                                    <span
                                      key={
                                        p.user_id ||
                                        p.email ||
                                        idx
                                      }
                                      className="text-[11px] font-semibold border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1 text-slate-600"
                                    >
                                      {
                                        displayName
                                      }
                                    </span>
                                  )
                                }
                              )}

                            {eng
                              .engagement_participants
                              .length >
                              5 && (
                              <span
                                className="text-[11px] font-bold border border-slate-200 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md flex items-center"
                                title={`+${
                                  eng
                                    .engagement_participants
                                    .length -
                                  5
                                } participantes`}
                              >
                                +
                                {eng
                                  .engagement_participants
                                  .length -
                                  5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    <div className="pt-4 border-t border-slate-50">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(
                            eng.event_date
                          )}
                        </span>

                        <span className="flex items-center gap-1 text-cyan-600">
                          <MapPin className="w-4 h-4" />
                          {eng.location ||
                            'Local não definido'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              }
            )}
          </div>
        ) : (
          <EngagementGrid
            engagements={
              filteredEngagements
            }
            onOpenDetails={
              handleOpenDetails
            }
          />
        )}
      </div>
    </div>
  )
}