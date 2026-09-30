'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  Filter,
  Layers3,
  Loader2,
  Rows3,
  Search,
  ShieldAlert,
  Target,
  Waypoints,
  X,
} from 'lucide-react';
import { MultiSelectFilter } from '../../components/MultiSelectFilter';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import DashboardCharts from './components/DashboardCharts';
import MembersMap, {
  type MembersMapHandle,
} from './components/MembersMap';
import type {
  EvidenceFilterOptions,
  EvidenceFilters,
} from './types';
import { useEvidence } from './useEvidence';
import { exportToPDF } from './utils/exportPdf';

const MAX_ENGAGEMENT_SUGGESTIONS = 10;

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function buildActiveFiltersSummary(filters: EvidenceFilters) {
  const describeDimension = (
    label: string,
    filter: EvidenceFilters['vertical']
  ) => {
    if (!filter.enabled) return `${label}: Desativado`;
    if (!filter.values.length) return `${label}: Nenhum item selecionado`;
    return `${label}: ${filter.values.join(', ')}`;
  };

  return [
    describeDimension('Vertical', filters.vertical),
    describeDimension('Horizontal', filters.horizontal),
    describeDimension('Transversal', filters.transversal),
  ].join(' • ');
}

type FilterChangeHandler = <K extends keyof EvidenceFilters>(
  key: K,
  value: EvidenceFilters[K]
) => void;

function DashboardFilters({
  filters,
  filterOptions,
  onFilterChange,
}: {
  filters: EvidenceFilters;
  filterOptions: EvidenceFilterOptions;
  onFilterChange: FilterChangeHandler;
}) {
  const [isEngagementSearchOpen, setIsEngagementSearchOpen] = useState(false);
  const [engagementSearchInput, setEngagementSearchInput] = useState(
    filters.engagementSearch
  );

  const normalizedSearch = normalizeText(engagementSearchInput);
  const engagementSuggestions = filterOptions.engagements
    .filter((title) =>
      normalizedSearch
        ? normalizeText(title).includes(normalizedSearch)
        : true
    )
    .slice(0, MAX_ENGAGEMENT_SUGGESTIONS);

  return (
    <div className="relative z-40 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-center gap-2 pr-4 lg:border-r lg:border-slate-100">
        <Filter className="h-5 w-5 text-slate-400" />
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Filtros
        </span>
      </div>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-2">
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Engajamento
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={engagementSearchInput}
                onFocus={() => setIsEngagementSearchOpen(true)}
                onBlur={() => setIsEngagementSearchOpen(false)}
                onChange={(event) => {
                  setEngagementSearchInput(event.target.value);
                  setIsEngagementSearchOpen(true);
                }}
                placeholder="Buscar engajamento..."
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />

              {engagementSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setEngagementSearchInput('');
                    onFilterChange('engagementSearch', '');
                    setIsEngagementSearchOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isEngagementSearchOpen && engagementSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {engagementSuggestions.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setEngagementSearchInput(title);
                      onFilterChange('engagementSearch', title);
                      setIsEngagementSearchOpen(false);
                    }}
                    className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition-colors last:border-b-0 hover:bg-cyan-50 hover:text-cyan-800"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DateRangeFilter
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) =>
              onFilterChange('startDate', date)
            }
            onEndDateChange={(date) => onFilterChange('endDate', date)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <MultiSelectFilter
            label="Vertical"
            icon={Layers3}
            enabled={filters.vertical.enabled}
            values={filters.vertical.values}
            options={filterOptions.verticals}
            onEnabledChange={(enabled) =>
              onFilterChange('vertical', {
                enabled,
                values: enabled ? [...filterOptions.verticals] : [],
              })
            }
            onValuesChange={(values) =>
              onFilterChange('vertical', { ...filters.vertical, values })
            }
          />

          <MultiSelectFilter
            label="Horizontal"
            icon={Rows3}
            enabled={filters.horizontal.enabled}
            values={filters.horizontal.values}
            options={filterOptions.horizontals}
            onEnabledChange={(enabled) =>
              onFilterChange('horizontal', {
                enabled,
                values: enabled ? [...filterOptions.horizontals] : [],
              })
            }
            onValuesChange={(values) =>
              onFilterChange('horizontal', { ...filters.horizontal, values })
            }
          />

          <MultiSelectFilter
            label="Transversal"
            icon={Waypoints}
            enabled={filters.transversal.enabled}
            values={filters.transversal.values}
            options={filterOptions.transversals}
            onEnabledChange={(enabled) =>
              onFilterChange('transversal', {
                enabled,
                values: enabled ? [...filterOptions.transversals] : [],
              })
            }
            onValuesChange={(values) =>
              onFilterChange('transversal', { ...filters.transversal, values })
            }
          />
        </div>
      </div>
    </div>
  );
}

function PdfHeader({
  eventName,
  filters,
}: {
  eventName: string;
  filters: EvidenceFilters;
}) {
  const activeFiltersSummary = buildActiveFiltersSummary(filters);

  return (
    <div
      id="pdf-header"
      style={{ display: 'none' }}
      className="mb-6 border-b border-slate-200 pb-4"
    >
      <div className="mb-6 flex items-center gap-6">
        <img
          src={`${process.env.__NEXT_ROUTER_BASEPATH || ''}/logo.png`}
          alt="OTDSP Logo"
          style={{ height: '40px', objectFit: 'contain' }}
        />
        <div
          style={{
            width: '2px',
            height: '32px',
            backgroundColor: '#e2e8f0',
          }}
        />
        <img
          src={`${process.env.__NEXT_ROUTER_BASEPATH || ''}/inovausp.png`}
          alt="Inova USP Logo"
          style={{ height: '56px', objectFit: 'contain' }}
        />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        OTDSP - Dashboard
      </h1>
      <p className="mt-2 text-lg text-slate-600">
        Evento / Contexto:{' '}
        <strong className="text-cyan-700">{eventName || 'Geral'}</strong>
      </p>
      <p className="mt-1 text-slate-500">
        Período consultado:{' '}
        {filters.startDate
          ? new Date(`${filters.startDate}T00:00:00`).toLocaleDateString('pt-BR')
          : 'Início'}{' '}
        até{' '}
        {filters.endDate
          ? new Date(`${filters.endDate}T23:59:59`).toLocaleDateString('pt-BR')
          : 'Hoje'}
      </p>
      <p className="mt-1 text-slate-500">
        Filtros utilizados: {activeFiltersSummary}
      </p>
    </div>
  );
}

function ExportModal({
  isOpen,
  eventName,
  isExporting,
  onEventNameChange,
  onClose,
  onExport,
}: {
  isOpen: boolean;
  eventName: string;
  isExporting: boolean;
  onEventNameChange: (value: string) => void;
  onClose: () => void;
  onExport: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Download className="h-5 w-5 text-cyan-600" />
            Exportar Relatório PDF
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
            aria-label="Fechar modal de exportação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nome do Evento / Contexto
            </label>
            <input
              type="text"
              placeholder="Ex: Workshop Caninos 2026"
              value={eventName}
              onChange={(event) => onEventNameChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              Isso será impresso no cabeçalho do PDF e formará o nome do arquivo final.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
            disabled={isExporting}
          >
            Cancelar
          </button>
          <button
            onClick={onExport}
            disabled={!eventName.trim() || isExporting}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Gerando PDF...' : 'Baixar Arquivo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvidenciasStaff() {
  const membersMapRef = useRef<MembersMapHandle>(null);
  const {
    isLoading,
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData,
  } = useEvidence();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      membersMapRef.current?.prepareForExport();

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      await exportToPDF('pdf-content', eventName);
    } finally {
      setIsExporting(false);
      setIsModalOpen(false);
      setEventName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
        <p className="animate-pulse text-sm font-medium tracking-wide text-slate-600">
          Sincronizando...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <ShieldAlert className="h-16 w-16 text-red-500" />
      </div>
    );
  }

  if (
    derivedData.stats.totalEngagements === 0 &&
    !filters.engagementSearch.trim()
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 pt-28 font-sans">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 border-b border-slate-200 pb-6">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-[#0F172A] md:text-5xl">
              Dashboard
            </h1>
            <p className="text-lg font-light tracking-wide text-slate-500">
              Inteligência operacional e métricas da comunidade{' '}
              <span className="font-medium text-cyan-600">OTDSP</span>
            </p>
          </header>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
            <Target className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700">
              Nenhum engajamento encontrado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Você ainda não está inserido em nenhum engajamento para poder visualizar métricas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 pt-28 font-sans text-[#0F172A]">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-[#0F172A] md:text-5xl">
              Dashboard
            </h1>
            <p className="text-lg font-light tracking-wide text-slate-500">
              Visão geral dos engajamentos no{' '}
              <span className="font-medium text-cyan-600">OTDSP</span>
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </header>

        <DashboardFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
        />

        <div id="pdf-content" className="space-y-8 bg-slate-50 p-2">
          <PdfHeader eventName={eventName} filters={filters} />
          <DashboardCharts data={derivedData} />
          <MembersMap ref={membersMapRef} data={derivedData.geoData} />
        </div>
      </div>

      <ExportModal
        isOpen={isModalOpen}
        eventName={eventName}
        isExporting={isExporting}
        onEventNameChange={setEventName}
        onClose={() => setIsModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}
