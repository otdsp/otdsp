"use client";

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid
} from 'recharts';
import type { DurationChartSeries } from '../types';
import { buildDurationChartRows, getActiveDurationDimensions } from '../utils/presentation';

type CustomTooltipProps = {
  active?: boolean;
  payload?: any;
  label?: string;
  seriesColors: Record<string, string>;
};

function DurationCustomTooltip({ active, payload, label, seriesColors }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const activeItems = payload.filter((item: any) => item.value > 0);
  if (activeItems.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-3.5 shadow-xl text-slate-900 backdrop-blur-md bg-white/95 min-w-[200px]">
      <p className="text-sm font-bold text-slate-800 mb-2.5 border-b border-slate-100 pb-1.5">{label}</p>
      <div className="space-y-2">
        {activeItems.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block" 
                style={{ backgroundColor: seriesColors[item.dataKey] || item.color }}
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

export default function DurationChart({ series }: { series: DurationChartSeries[] }) {
  const seriesColors = useMemo(() => {
    const mapping: Record<string, string> = {};
    series.forEach(s => { mapping[s.dimension] = s.color; });
    return mapping;
  }, [series]);

  const merged = useMemo(() => buildDurationChartRows(series), [series]);

  const activeDimensions = useMemo(() => new Set(getActiveDurationDimensions(series, merged)), [merged, series]);

  // Componente de Legenda Customizada: o Recharts injeta as propriedades nativas aqui automaticamente
  // Aceitamos 'any' no parâmetro para contornar problemas de exportação de interfaces internas do Recharts
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    // Filtramos o payload interno do próprio Recharts contra o nosso set de dimensões ativas
    const filteredPayload = payload.filter((entry: any) => activeDimensions.has(entry.value));

    return (
      <div className="flex justify-end items-center gap-4 text-xs font-medium text-slate-500 mb-6 h-10">
        {filteredPayload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={merged} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          
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
            content={<DurationCustomTooltip seriesColors={seriesColors} />} 
            cursor={{ fill: '#f8fafc', opacity: 0.6 }} 
          />
          
          <Legend content={renderCustomLegend} verticalAlign="top" align="right" />
          
          {series.map(s => (
            <Bar 
              key={s.dimension} 
              dataKey={s.dimension} 
              name={s.dimension}
              fill={s.color} 
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