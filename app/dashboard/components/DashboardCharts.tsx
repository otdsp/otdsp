'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  Info,
  Layers3,
  Rows3,
  Target,
  Users,
  Waypoints,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  DashboardDerivedData,
  DashboardInsight,
  DashboardOrganizationMetric,
  DashboardPillarMetric,
} from '../utils/evidenceProcessor';
import MunicipalityChart from './MunicipalityChart';

const STATUS_COLORS: Record<string, string> = {
  Concluído: '#10b981',
  Planejado: '#0ea5e9',
  Pendente: '#f59e0b',
  Cancelado: '#ef4444',
  Outro: '#64748b',
};

const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: 'none',
};

type KpiCardProps = {
  title: string;
  value: number | string;
  icon: React.ElementType;
  tone: 'amber' | 'cyan' | 'emerald' | 'rose';
};

const TONE_CLASSES: Record<KpiCardProps['tone'], { bg: string; icon: string }> = {
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
};

function KpiCard({ title, value, icon: Icon, tone }: KpiCardProps) {
  const colors = TONE_CLASSES[tone];

  return (
    <div className="group flex min-h-[120px] items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-colors duration-200 hover:border-slate-300">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>

      <div
        className={`rounded-xl p-4 ${colors.bg} ${colors.icon} transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = '',
  subtitle,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={`avoid-break rounded-2xl border border-slate-200 bg-white p-6 ${className}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function EngagementTimeline({ data }: { data: DashboardDerivedData['engagementTimelineData'] }) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={false} />
          {['Concluído', 'Planejado', 'Pendente', 'Cancelado', 'Outro'].map((status) => (
            <Bar
              key={status}
              dataKey={status}
              stackId="status"
              fill={STATUS_COLORS[status]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusChart({ data }: { data: DashboardDerivedData['statusData'] }) {
  return (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 35, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={85}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#475569"
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={false} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {data.map((item) => (
              <Cell key={item.name} fill={STATUS_COLORS[item.name] ?? '#64748b'} />
            ))}
            <LabelList dataKey="value" position="right" className="fill-slate-700" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function UpcomingList({ data }: { data: DashboardDerivedData['upcomingEngagements'] }) {
  if (!data.length) {
    return (
      <div className="flex min-h-[270px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <div>
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Nenhum engajamento nos próximos 30 dias</p>
          <p className="mt-1 text-xs text-slate-400">Considerando os filtros temáticos atuais.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
      {data.map((engagement) => {
        const date = new Date(engagement.eventDate);
        return (
          <div key={engagement.id} className="flex gap-4 bg-white px-4 py-3.5">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
              </span>
              <span className="text-lg font-extrabold leading-5">{String(date.getDate()).padStart(2, '0')}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{engagement.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {engagement.location && <span>{engagement.location}</span>}
                <span className="font-medium text-cyan-700">{engagement.status}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ insight }: { insight: DashboardInsight }) {
  const styles = {
    warning: {
      icon: AlertTriangle,
      iconClass: 'text-amber-600',
      bg: 'bg-amber-50/70',
      border: 'border-amber-100',
    },
    info: {
      icon: Info,
      iconClass: 'text-cyan-600',
      bg: 'bg-cyan-50/60',
      border: 'border-cyan-100',
    },
    success: {
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-100',
    },
  }[insight.type];

  const Icon = styles.icon;

  return (
    <div className={`rounded-xl border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.iconClass}`} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-sm font-bold text-slate-800">{insight.title}</p>
            {insight.value !== undefined && (
              <span className="text-lg font-extrabold text-slate-900">{insight.value}</span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

function MiniPillarCard({
  title,
  data,
}: {
  title: string;
  data: DashboardPillarMetric[];
}) {
  const maxCount = data.reduce((highest, item) => Math.max(highest, item.count), 1);

  const styleByCategory: Record<
    string,
    {
      icon: React.ElementType;
      iconBox: string;
      iconColor: string;
      bar: string;
      badge: string;
      label: string;
    }
  > = {
    Verticais: {
      icon: Layers3,
      iconBox: 'bg-[#10b981]/10',
      iconColor: 'text-[#10b981]',
      bar: 'bg-[#10b981]',
      badge: 'bg-[#10b981]/10 text-[#10b981]',
      label: 'Áreas de atuação',
    },
    Horizontais: {
      icon: Rows3,
      iconBox: 'bg-[#1f77b4]/10',
      iconColor: 'text-[#1f77b4]',
      bar: 'bg-[#1f77b4]',
      badge: 'bg-[#1f77b4]/10 text-[#1f77b4]',
      label: 'Tecnologias',
    },
    Transversais: {
      icon: Waypoints,
      iconBox: 'bg-[#ff7f0e]/10',
      iconColor: 'text-[#ff7f0e]',
      bar: 'bg-[#ff7f0e]',
      badge: 'bg-[#ff7f0e]/10 text-[#ff7f0e]',
      label: 'Temas transversais',
    },
  };

  const style =
    styleByCategory[title] ??
    ({
      icon: BarChart3,
      iconBox: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      bar: 'bg-cyan-500',
      badge: 'bg-cyan-50 text-cyan-700',
      label: 'Categorias',
    } as const);

  const Icon = style.icon;
  const visibleItems = data.slice(0, 8);
  const hiddenItems = Math.max(data.length - visibleItems.length, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-slate-800">{title}</h3>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{style.label}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3.5">
        {visibleItems.map((item) => {
          const width = Math.max((item.count / maxCount) * 100, 4);

          return (
            <div key={item.label} className="group">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span
                  className="min-w-0 truncate text-[13px] font-medium text-slate-600"
                  title={item.label}
                >
                  {item.label}
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold tabular-nums ${style.badge}`}
                >
                  {item.count}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${style.bar} transition-[width] duration-500 ease-out`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hiddenItems > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400">
          + {hiddenItems} {hiddenItems === 1 ? 'categoria adicional' : 'categorias adicionais'}
        </div>
      )}
    </div>
  );
}

function ActivityChart({ data }: { data: DashboardDerivedData['activityData'] }) {
  const chartData = data.slice(0, 8);

  if (!chartData.length) {
    return <p className="py-12 text-center text-sm text-slate-400">Sem atividades classificadas.</p>;
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 35, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#475569"
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={false} />
          <Bar dataKey="count" name="Engajamentos" fill="#0891b2" radius={[0, 6, 6, 0]} maxBarSize={24}>
            <LabelList dataKey="count" position="right" className="fill-slate-700" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrganizationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DashboardOrganizationMetric }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="max-w-[280px] rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
      <p className="text-sm font-extrabold text-slate-900">{item.name}</p>
      <p className="mt-1 text-slate-600">
        <strong>{item.value}</strong> participante{item.value === 1 ? '' : 's'} · {item.orgType}
      </p>
      {item.members.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <p className="mb-1 font-semibold text-slate-600">Participantes</p>
          <div className="max-h-28 overflow-y-auto pr-1 text-slate-500">
            {item.members.map((member) => (
              <div key={member} className="py-0.5">
                • {member}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrganizationChart({ data }: { data: DashboardDerivedData['organizationData'] }) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-slate-400">Sem instituições informadas.</p>;
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 25, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#475569"
          />
          <Tooltip content={<OrganizationTooltip />} cursor={false} />
          <Bar dataKey="value" name="Participantes" fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={24}>
            <LabelList dataKey="value" position="right" className="fill-slate-700" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WorkloadChart({ data }: { data: DashboardDerivedData['workloadTimelineData'] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={false}
            formatter={(value) => [`${Number(value).toFixed(1)} h`, 'Horas previstas']}
          />
          <Bar dataKey="horas" name="Horas previstas" fill="#0f172a" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardOverview({ data }: { data: DashboardDerivedData }) {
  const { stats, engagementTimelineData, statusData, upcomingEngagements, insights } = data;

  return (
    <div className="space-y-8">
      <div className="avoid-break grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Engajamentos"
          value={stats.totalEngagements}
          icon={Target}
          tone="amber"
        />
        <KpiCard
          title="Participantes envolvidos"
          value={stats.totalUsers}
          icon={Users}
          tone="cyan"
        />
        <KpiCard
          title="Municípios representados"
          value={stats.attendedCities}
          icon={Globe2}
          tone="emerald"
        />
        <KpiCard
          title="Requerem atenção"
          value={stats.attentionCount}
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <SectionCard
        title="Engajamentos ao longo do tempo"
        icon={BarChart3}
        subtitle="Volume por período, separado pela situação de cada engajamento."
      >
        <EngagementTimeline data={engagementTimelineData} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Situação dos engajamentos" icon={Activity}>
          <StatusChart data={statusData} />
        </SectionCard>
        <SectionCard
          title="Próximos engajamentos"
          icon={CalendarClock}
          subtitle="Agenda dos próximos 30 dias; respeita busca e filtros temáticos."
        >
          <UpcomingList data={upcomingEngagements} />
        </SectionCard>
      </div>

      <SectionCard title="Destaques e pontos de atenção" icon={AlertTriangle}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {insights.map((insight, index) => (
            <InsightCard key={`${insight.title}-${index}`} insight={insight} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function DashboardDetails({ data }: { data: DashboardDerivedData }) {
  const { stats, municipalityChartData, pillarsData, activityData, organizationData, workloadTimelineData } = data;

  return (
    <div className="space-y-8">
      <SectionCard
        title="Engajamento dos municípios"
        icon={Globe2}
        subtitle="Compara participação, engajamentos e intensidade associada a cada município."
      >
        <div className="h-[420px] w-full">
          <MunicipalityChart data={municipalityChartData} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {pillarsData.map((pillar) => (
          <MiniPillarCard
            key={pillar.category}
            title={pillar.category}
            data={pillar.items}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Tipos de atividade" icon={Activity}>
          <ActivityChart data={activityData} />
        </SectionCard>
        <SectionCard
          title="Carga prevista no período"
          icon={Clock3}
          subtitle={`${stats.totalEstimatedHours.toLocaleString('pt-BR')} horas estimadas no recorte atual.`}
        >
          <WorkloadChart data={workloadTimelineData} />
        </SectionCard>
      </div>

      <SectionCard
        title="Instituições representadas"
        icon={Briefcase}
        subtitle="Principais instituições entre os participantes relacionados aos engajamentos filtrados."
      >
        <OrganizationChart data={organizationData} />
      </SectionCard>
    </div>
  );
}

export default function DashboardCharts({ data }: { data: DashboardDerivedData }) {
  return (
    <div className="space-y-8">
      <DashboardOverview data={data} />
      <DashboardDetails data={data} />
    </div>
  );
}