'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Engagement } from '@/types/engagement'

type EngagementGridProps = {
  engagements: Engagement[]
  onOpenDetails: (engagement: Engagement) => void
}

type SortKey =
  | 'status'
  | 'title'
  | 'horizontal'
  | 'vertical'
  | 'transversal'
  | 'event_date'
  | 'location'
  | 'estimated_duration'
  | 'members'

type SortDirection = 'asc' | 'desc'

type SortConfig = {
  key: SortKey
  direction: SortDirection
}

const formatGridDate = (dateString: string) => {
  if (!dateString) {
    return {
      date: 'Não definida',
      time: ''
    }
  }

  const date = new Date(dateString)

  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const formatFullDate = (dateString: string) => {
  if (!dateString) return 'Data não definida'

  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDimension = (values?: string[]) => {
  if (!values?.length) return '—'

  return values.join(', ')
}

const normalizeText = (value: unknown) => {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function EngagementGrid({
  engagements,
  onOpenDetails
}: EngagementGridProps) {

  /*
   * Estado da classificação.
   *
   * null = nenhuma ordenação adicional.
   * Nesse caso mantemos a ordem recebida da página principal.
   */
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  /*
   * Alterna:
   *
   * 1º clique -> crescente
   * 2º clique -> decrescente
   */
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {

      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc'
            ? 'desc'
            : 'asc'
        }
      }

      return {
        key,
        direction: 'asc'
      }
    })
  }

  /*
   * Extrai o valor adequado para cada tipo de coluna.
   */
  const getSortValue = (
    engagement: Engagement,
    key: SortKey
  ): string | number => {

    switch (key) {

      case 'status':
        return normalizeText(engagement.status)

      case 'title':
        return normalizeText(engagement.title)

      case 'horizontal':
        return normalizeText(
          engagement.horizontal?.join(', ') || ''
        )

      case 'vertical':
        return normalizeText(
          engagement.vertical?.join(', ') || ''
        )

      case 'transversal':
        return normalizeText(
          engagement.transversal?.join(', ') || ''
        )

      case 'event_date':
        return engagement.event_date
          ? new Date(engagement.event_date).getTime()
          : 0

      case 'location':
        return normalizeText(engagement.location)

      case 'estimated_duration':
        return engagement.estimated_duration ?? 0

      case 'members':
        return engagement.engagement_participants?.length ?? 0

      default:
        return ''
    }
  }

  /*
   * Lista ordenada.
   *
   * Importante:
   * usamos [...engagements] para NÃO alterar
   * diretamente a propriedade recebida.
   */
  const sortedEngagements = useMemo(() => {

    if (!sortConfig) {
      return engagements
    }

    const sorted = [...engagements].sort((a, b) => {

      const valueA = getSortValue(a, sortConfig.key)
      const valueB = getSortValue(b, sortConfig.key)

      /*
       * Valores numéricos:
       * Data, duração e quantidade de membros.
       */
      if (
        typeof valueA === 'number' &&
        typeof valueB === 'number'
      ) {
        return sortConfig.direction === 'asc'
          ? valueA - valueB
          : valueB - valueA
      }

      /*
       * Valores textuais.
       *
       * localeCompare é preferível porque respeita
       * acentos e a ordenação do português.
       */
      const comparison = String(valueA).localeCompare(
        String(valueB),
        'pt-BR',
        {
          sensitivity: 'base'
        }
      )

      return sortConfig.direction === 'asc'
        ? comparison
        : -comparison
    })

    return sorted

  }, [engagements, sortConfig])

  /*
   * Ícone apresentado no cabeçalho.
   */
  const getSortIcon = (key: SortKey) => {

    if (sortConfig?.key !== key) {
      return (
        <ArrowUpDown
          className="h-3 w-3 text-slate-400"
        />
      )
    }

    if (sortConfig.direction === 'asc') {
      return (
        <ArrowUp
          className="h-3 w-3 text-cyan-600"
        />
      )
    }

    return (
      <ArrowDown
        className="h-3 w-3 text-cyan-600"
      />
    )
  }

  /*
   * Componente reutilizável para os cabeçalhos.
   */
  const SortableHeader = ({
    label,
    sortKey,
    className = ''
  }: {
    label: string
    sortKey: SortKey
    className?: string
  }) => {

    const isActive = sortConfig?.key === sortKey

    return (
      <th
        className={`
          border-b
          border-r
          border-slate-200
          p-0
          font-black
          ${className}
        `}
      >
        <button
          type="button"
          onClick={() => handleSort(sortKey)}
          className={`
            flex
            w-full
            items-center
            gap-1.5
            px-2
            py-2.5
            text-left
            transition-colors
            hover:bg-slate-200/70
            focus:outline-none
            focus:ring-2
            focus:ring-inset
            focus:ring-cyan-500
            ${
              isActive
                ? 'text-cyan-700'
                : 'text-slate-500'
            }
          `}
        >
          <span>
            {label}
          </span>

          {getSortIcon(sortKey)}
        </button>
      </th>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">

      <table className="w-full table-fixed border-collapse text-left text-xs">

        <colgroup>
          <col className="w-[9%]" />
          <col className="w-[19%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[7%]" />
          <col className="w-[7%]" />
        </colgroup>

        {/* CABEÇALHO */}
        <thead className="bg-slate-100 text-[10px] uppercase tracking-wide">

          <tr>

            <SortableHeader
              label="Status"
              sortKey="status"
            />

            <SortableHeader
              label="Engajamento"
              sortKey="title"
            />

            <SortableHeader
              label="Horizontal"
              sortKey="horizontal"
            />

            <SortableHeader
              label="Vertical"
              sortKey="vertical"
            />

            <SortableHeader
              label="Transversal"
              sortKey="transversal"
            />

            <SortableHeader
              label="Data"
              sortKey="event_date"
            />

            <SortableHeader
              label="Local"
              sortKey="location"
            />

            <SortableHeader
              label="Duração"
              sortKey="estimated_duration"
            />

            <SortableHeader
              label="Membros"
              sortKey="members"
              className="border-r-0"
            />

          </tr>

        </thead>

        {/* DADOS */}
        <tbody className="divide-y divide-slate-200 bg-white">

          {sortedEngagements.map((eng) => {

            const formattedDate =
              formatGridDate(eng.event_date)

            return (
              <tr
                key={eng.id}
                role="button"
                tabIndex={0}

                onClick={() => onOpenDetails(eng)}

                onKeyDown={(event) => {

                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    onOpenDetails(eng)
                  }

                }}

                className="
                  cursor-pointer
                  outline-none
                  transition-colors
                  hover:bg-cyan-50/60
                  focus:bg-cyan-50/60
                  focus:ring-2
                  focus:ring-inset
                  focus:ring-cyan-500
                "
              >

                {/* STATUS */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top">

                  <span
                    className="
                      inline-flex
                      max-w-full
                      truncate
                      rounded-md
                      bg-cyan-50
                      px-1.5
                      py-1
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wide
                      text-cyan-700
                    "
                  >
                    {eng.status}
                  </span>

                </td>


                {/* ENGAJAMENTO */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top">

                  <p
                    className="truncate font-bold text-slate-900"
                    title={eng.title}
                  >
                    {eng.title}
                  </p>

                  <p
                    className="mt-0.5 truncate text-[11px] text-slate-500"
                    title={eng.description || 'Sem descrição'}
                  >
                    {eng.description || 'Sem descrição'}
                  </p>

                </td>


                {/* HORIZONTAL */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">

                  <p
                    className="line-clamp-2"
                    title={formatDimension(eng.horizontal)}
                  >
                    {formatDimension(eng.horizontal)}
                  </p>

                </td>


                {/* VERTICAL */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">

                  <p
                    className="line-clamp-2"
                    title={formatDimension(eng.vertical)}
                  >
                    {formatDimension(eng.vertical)}
                  </p>

                </td>


                {/* TRANSVERSAL */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">

                  <p
                    className="line-clamp-2"
                    title={formatDimension(eng.transversal)}
                  >
                    {formatDimension(eng.transversal)}
                  </p>

                </td>


                {/* DATA */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">

                  <div
                    className="min-w-0 leading-tight"
                    title={formatFullDate(eng.event_date)}
                  >

                    <p className="whitespace-nowrap tabular-nums text-slate-700">
                      {formattedDate.date}
                    </p>

                    {formattedDate.time && (

                      <p className="mt-0.5 whitespace-nowrap text-[10px] tabular-nums text-slate-500">
                        {formattedDate.time}
                      </p>

                    )}

                  </div>

                </td>


                {/* LOCAL */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">

                  <p
                    className="truncate"
                    title={eng.location || '—'}
                  >
                    {eng.location || '—'}
                  </p>

                </td>


                {/* DURAÇÃO */}
                <td className="border-r border-slate-200 px-2 py-2.5 align-top whitespace-nowrap text-[11px] text-slate-600">

                  {eng.estimated_duration
                    ? `${eng.estimated_duration} h`
                    : '—'}

                </td>


                {/* MEMBROS */}
                <td className="px-2 py-2.5 text-center align-top whitespace-nowrap text-[11px] text-slate-600">

                  {eng.engagement_participants?.length || 0}

                </td>

              </tr>
            )
          })}

        </tbody>

      </table>

    </div>
  )
}