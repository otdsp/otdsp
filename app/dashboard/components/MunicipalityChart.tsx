'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { MunicipalityChartRow } from '../types';

const SERIES_COLORS = {
  Vertical: '#10b981',
  Horizontal: '#1f77b4',
  Transversal: '#ff7f0e',
};


function formatHours(value?: number) {
  const hours = Number(value ?? 0);

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(hours);
}

function getParticipantKey(
  participant: MunicipalityChartRow['participants'][number],
  index: number
) {
  if (participant.email?.trim()) {
    return participant.email.trim().toLowerCase();
  }

  return `${participant.name}-${participant.role}-${index}`;
}

function MunicipalityHoverCard({ data }: { data: MunicipalityChartRow }) {

  const uniqueParticipants = Array.from(
    new Map(
      (data.participants ?? []).map((participant, index) => [
        getParticipantKey(participant, index),
        participant,
      ])
    ).values()
  );

  const dimensionItems = [
    {
      key: 'Vertical',
      label: 'Vertical',
      value: Number(data.verticalHours ?? 0),
      color: SERIES_COLORS.Vertical,
    },
    {
      key: 'Horizontal',
      label: 'Horizontal',
      value: Number(data.horizontalHours ?? 0),
      color: SERIES_COLORS.Horizontal,
    },
    {
      key: 'Transversal',
      label: 'Transversal',
      value: Number(data.transversalHours ?? 0),
      color: SERIES_COLORS.Transversal,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="w-[255px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900">
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {data.municipality}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {data.engagementCount ?? 0}{' '}
              {(data.engagementCount ?? 0) === 1 ? 'engajamento' : 'engajamentos'}
              {' · '}
              {uniqueParticipants.length}{' '}
              {uniqueParticipants.length === 1 ? 'participante' : 'participantes'}
            </p>
          </div>

          <p className="shrink-0 text-sm font-bold text-slate-900">
            {formatHours(data.totalHours)}h
          </p>
        </div>

        {dimensionItems.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
            {dimensionItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 text-[11px]"
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="font-semibold text-slate-700">
                  {formatHours(item.value)}h
                </span>
              </div>
            ))}
          </div>
        )}

        {uniqueParticipants.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Participantes
            </p>
            <div className="max-h-[112px] space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {uniqueParticipants.map((participant, index) => (
                <div key={getParticipantKey(participant, index)}>
                  <p className="truncate text-[11px] font-medium text-slate-700">
                    {participant.name}
                  </p>
                  {participant.role && (
                    <p className="truncate text-[10px] text-slate-400">
                      {participant.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MunicipalityChart({
  data,
}: {
  data: MunicipalityChartRow[];
}) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort(
          (a, b) =>
            Number(b.totalHours ?? 0) - Number(a.totalHours ?? 0)
        )
        .slice(0, 12),
    [data]
  );

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [hoverCard, setHoverCard] = useState<{
    data: MunicipalityChartRow;
    left: number;
    top: number;
  } | null>(null);

  const handleBarMouseEnter = (entry: any) => {
    const row = (entry?.payload ?? entry) as MunicipalityChartRow | undefined;
    if (!row?.municipality) return;

    const containerWidth = chartContainerRef.current?.clientWidth ?? 0;
    const containerHeight = chartContainerRef.current?.clientHeight ?? 360;

    const barX = Number(entry?.x ?? 0);
    const barY = Number(entry?.y ?? 0);
    const barWidth = Number(entry?.width ?? 0);
    const barHeight = Number(entry?.height ?? 0);

    const cardWidth = 255;
    const estimatedCardHeight = 235;
    const gap = 30;

    const barCenterX = barX + barWidth / 2;
    const barCenterY = barY + Math.max(barHeight, 1) / 2;

    const hasRoomOnRight =
      containerWidth === 0 || barCenterX + gap + cardWidth <= containerWidth - 8;

    const left = hasRoomOnRight
      ? barCenterX + gap
      : Math.max(8, barCenterX - gap - cardWidth);

    const desiredTop = barCenterY - estimatedCardHeight / 2;
    const top = Math.max(8, Math.min(desiredTop, containerHeight - estimatedCardHeight - 8));

    setHoverCard({ data: row, left, top });
  };

  const activeDimensions = useMemo(() => {
    const active = new Set<string>();

    if (chartData.some((item) => Number(item.horizontalHours ?? 0) > 0)) {
      active.add('Horizontal');
    }

    if (chartData.some((item) => Number(item.verticalHours ?? 0) > 0)) {
      active.add('Vertical');
    }

    if (chartData.some((item) => Number(item.transversalHours ?? 0) > 0)) {
      active.add('Transversal');
    }

    return active;
  }, [chartData]);

  const renderCustomLegend = ({ payload }: any) => {
    if (!payload) return null;

    const filteredPayload = payload.filter((entry: any) =>
      activeDimensions.has(entry.value)
    );

    return (
      <div className="mb-5 flex h-8 items-center justify-end gap-4 text-xs font-medium text-slate-500">
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

  if (!chartData.length) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center text-sm text-slate-400">
        Nenhum município disponível para os filtros atuais.
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="relative h-[360px] w-full overflow-visible"
      onMouseLeave={() => setHoverCard(null)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          barGap={4}
          barCategoryGap="24%"
          margin={{ top: 10, right: 10, left: -25, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="municipality"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
            tickMargin={8}
          />

          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals
            tickFormatter={(value) => `${formatHours(Number(value))}h`}
          />

          <Legend
            content={renderCustomLegend}
            verticalAlign="top"
            align="right"
          />

          {activeDimensions.has('Horizontal') && (
            <Bar
              dataKey="horizontalHours"
              name="Horizontal"
              fill={SERIES_COLORS.Horizontal}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onMouseEnter={handleBarMouseEnter}
              isAnimationActive
              animationBegin={0}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}

          {activeDimensions.has('Vertical') && (
            <Bar
              dataKey="verticalHours"
              name="Vertical"
              fill={SERIES_COLORS.Vertical}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onMouseEnter={handleBarMouseEnter}
              isAnimationActive
              animationBegin={80}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}

          {activeDimensions.has('Transversal') && (
            <Bar
              dataKey="transversalHours"
              name="Transversal"
              fill={SERIES_COLORS.Transversal}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onMouseEnter={handleBarMouseEnter}
              isAnimationActive
              animationBegin={160}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {hoverCard && (
        <div
          className="absolute z-50"
          style={{
            left: hoverCard.left,
            top: hoverCard.top,
          }}
        >
          <MunicipalityHoverCard data={hoverCard.data} />
        </div>
      )}
    </div>
  );
}