'use client';

import React, { useMemo } from 'react';
import {
  BarChart3,
  Briefcase,
  Globe,
  Globe2,
  PieChart as PieIcon,
  Target,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  DerivedEvidenceData,
  DurationChartSeries,
  PillarMetric,
} from '../types';
import MunicipalityChart from './MunicipalityChart';

const PIE_COLORS = [
  '#0891b2',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#475569',
];

const ORG_COLORS = [
  '#4f46e5',
  '#ea580c',
  '#0284c7',
  '#16a34a',
  '#9333ea',
  '#64748b',
];

const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

type KpiCardProps = {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
};

type OrgTooltipData = {
  name?: string;
  value?: number;
  orgType?: string;
  members?: string[];
};

type DurationChartRow = {
  label: string;
  [dimension: string]: string | number;
};

type DurationTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
  seriesColors: Record<string, string>;
};

function KpiCard({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: KpiCardProps) {
  return (
    <div className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-slate-300">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <p className="text-3xl font-bold tracking-tight text-slate-800">
          {value}
        </p>
      </div>

      <div
        className={`rounded-xl p-4 ${bgColor} ${iconColor} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function buildMiniPillarBars(items: PillarMetric[]) {
  const maxCount = items.reduce(
    (highest, item) => Math.max(highest, item.count),
    1
  );

  return items.map((item) => ({
    ...item,
    widthPercentage: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
  }));
}

function MiniPillarCard({ title, data }: { title: string; data: PillarMetric[] }) {
  const bars = buildMiniPillarBars(data);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 border-b border-slate-100 pb-3 text-base font-bold tracking-tight text-slate-800">
        {title}
      </h3>

      <div className="flex-1 space-y-4">
        {bars.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className="font-mono font-bold text-slate-900">
                {item.count}{' '}
                {item.count === 1 ? 'engajamento' : 'engajamentos'}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-cyan-600 transition-all duration-500"
                style={{ width: `${item.widthPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomOrgTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: OrgTooltipData }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  const members = Array.isArray(data?.members) ? data.members : [];

  return (
    <div className="z-50 min-w-[220px] space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl">
      <p className="text-sm font-extrabold tracking-tight text-slate-900">
        {data?.name}
      </p>

      <div className="flex items-center gap-4 text-slate-600">
        <span>
          <strong className="font-semibold text-slate-800">Membros:</strong>{' '}
          {data?.value ?? 0}
        </span>
      </div>

      <div className="border-t border-slate-100 pt-1 text-[11px]">
        <span className="text-slate-500">
          {data?.name === 'Outras'
            ? 'Segmentos Predominantes: '
            : 'Segmento: '}
        </span>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-sans font-medium text-indigo-700">
          {data?.orgType || 'Não informado'}
        </span>
      </div>

      <div className="border-t border-slate-100 pt-1">
        <p className="mb-1 text-[11px] font-semibold text-slate-700">
          Participantes
        </p>

        {members.length > 0 ? (
          <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
            {members.map((member, index) => (
              <li
                key={`${member}-${index}`}
                className="truncate text-[11px] text-slate-600"
              >
                • {member}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-500">
            Nenhum participante identificado.
          </p>
        )}
      </div>
    </div>
  );
}

function buildDurationChartRows(
  series: DurationChartSeries[]
): DurationChartRow[] {
  const labels = new Set<string>();
  series.forEach((item) =>
    item.data.forEach((point) => labels.add(point.label))
  );

  return Array.from(labels)
    .sort()
    .map((label) => {
      const row: DurationChartRow = { label };

      series.forEach((item) => {
        const match = item.data.find((point) => point.label === label);
        row[item.dimension] = match?.value ?? 0;
      });

      return row;
    });
}

function getActiveDurationDimensions(
  series: DurationChartSeries[],
  rows: DurationChartRow[]
) {
  const activeSet = new Set<string>();

  rows.forEach((row) => {
    series.forEach((item) => {
      const value = row[item.dimension];
      if (typeof value === 'number' && value > 0) {
        activeSet.add(item.dimension);
      }
    });
  });

  return activeSet;
}

function DurationCustomTooltip({
  active,
  payload,
  label,
  seriesColors,
}: DurationTooltipProps) {
  if (!active || !payload?.length) return null;

  const activeItems = payload.filter((item) => Number(item.value) > 0);
  if (!activeItems.length) return null;

  return (
    <div className="min-w-[200px] rounded-2xl border border-slate-100 bg-white/95 p-3.5 text-slate-900 shadow-xl backdrop-blur-md">
      <p className="mb-2.5 border-b border-slate-100 pb-1.5 text-sm font-bold text-slate-800">
        {label}
      </p>

      <div className="space-y-2">
        {activeItems.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    seriesColors[item.dataKey] || item.color,
                }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-bold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationChart({ series }: { series: DurationChartSeries[] }) {
  const seriesColors = useMemo(
    () =>
      Object.fromEntries(
        series.map((item) => [item.dimension, item.color])
      ) as Record<string, string>,
    [series]
  );

  const rows = useMemo(() => buildDurationChartRows(series), [series]);
  const activeDimensions = useMemo(
    () => getActiveDurationDimensions(series, rows),
    [series, rows]
  );

  const renderLegend = ({ payload }: any) => {
    if (!payload) return null;

    const filteredPayload = payload.filter((entry: any) =>
      activeDimensions.has(entry.value)
    );

    return (
      <div className="mb-6 flex h-10 items-center justify-end gap-4 text-xs font-medium text-slate-500">
        {filteredPayload.map((entry: any, index: number) => (
          <div key={`${entry.value}-${index}`} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-slate-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 10, right: 10, left: -25, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <DurationCustomTooltip seriesColors={seriesColors} />
            }
            cursor={{ fill: '#f8fafc', opacity: 0.6 }}
          />
          <Legend content={renderLegend} verticalAlign="top" align="right" />

          {series.map((item) => (
            <Bar
              key={item.dimension}
              dataKey={item.dimension}
              name={item.dimension}
              fill={item.color}
              stackId="single_item"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardCharts({
  data,
}: {
  data: DerivedEvidenceData;
}) {
  const {
    stats,
    timelineData,
    engagementTimelineData,
    referralData,
    organizationData,
    pillarsData,
    durationChart,
    municipalityChartData,
  } = data;

  return (
    <>
      <div className="avoid-break grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Engajamentos"
          value={stats.totalEngagements}
          icon={Target}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="Total de Membros"
          value={stats.totalUsers}
          icon={Users}
          bgColor="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <KpiCard
          title="Municípios Atendidos"
          value={stats.attendedCities}
          icon={Globe}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="avoid-break grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex h-96 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-emerald-500" />
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              Crescimento de Engajamentos
            </h2>
          </div>

          <div className="h-full w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={engagementTimelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorEngajamentos"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="Engajamentos"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEngajamentos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 flex h-96 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              Organizações / Instituições
            </h2>
          </div>

          <div className="relative h-full w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={organizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {organizationData.map((_, index) => (
                    <Cell
                      key={`organization-${index}`}
                      fill={ORG_COLORS[index % ORG_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomOrgTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="avoid-break rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-cyan-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Duração por Dimensão
          </h2>
        </div>
        <div className="h-80 w-full">
          <DurationChart series={durationChart} />
        </div>
      </div>

      <div className="avoid-break rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Globe2 className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            Engajamento dos Municípios
          </h2>
        </div>
        <div className="h-[420px] w-full">
          <MunicipalityChart data={municipalityChartData} />
        </div>
      </div>

      <div className="avoid-break grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {pillarsData.map((pillar) => (
          <MiniPillarCard
            key={pillar.category}
            title={pillar.category}
            data={pillar.items}
          />
        ))}
      </div>

      <div className="avoid-break grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="avoid-break flex h-96 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-cyan-600" />
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              Crescimento de Membros
            </h2>
          </div>

          <div className="h-full w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorMembros"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="Membros"
                  stroke="#0891b2"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMembros)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 flex h-96 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <PieIcon className="h-6 w-6 text-cyan-600" />
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              Origem de Descoberta
            </h2>
          </div>

          <div className="relative h-full w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {referralData.map((_, index) => (
                    <Cell
                      key={`referral-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
