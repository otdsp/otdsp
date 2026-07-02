"use client";

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from 'recharts';

import type { MunicipalityChartRow } from '../types';

type TooltipProps = {
  active?: boolean;
  payload?: any;
  label?: string;
};

function MunicipalityTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as MunicipalityChartRow;
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-xl text-slate-900 backdrop-blur-md bg-white/95" style={{ width: 280 }}>
      <p className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{data.municipality}</p>
      
      {/* Mini KPIs Internos */}
      <div className="grid grid-cols-3 gap-1.5 mb-3 text-[11px]">
        <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2 text-center">
          <p className="font-medium text-sky-700">Horizontal</p>
          <p className="font-bold text-sky-900 text-sm mt-0.5">{data.horizontalCount}</p>
        </div>
        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2 text-center">
          <p className="font-medium text-emerald-700">Vertical</p>
          <p className="font-bold text-emerald-900 text-sm mt-0.5">{data.verticalCount}</p>
        </div>
        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-2 text-center">
          <p className="font-medium text-amber-700">Transv.</p>
          <p className="font-bold text-amber-900 text-sm mt-0.5">{data.transversalCount}</p>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mb-2 font-medium">
        Participantes únicos: <span className="text-slate-800 font-bold">{data.count}</span>
      </p>
      
      {/* Lista de Participantes */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {data.participants.map((participant) => (
          <div key={participant.email} className="rounded-lg bg-slate-50 p-2 border border-slate-100/80 transition-colors hover:bg-slate-100/50">
            <p className="text-xs font-semibold text-slate-700 truncate">{participant.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{participant.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MunicipalityChart({ data }: { data: MunicipalityChartRow[] }) {
  const chartData = useMemo(() => data.slice(0, 12), [data]);

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 40 }}>
          {/* Grid apenas horizontal e bem sutil */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          
          <XAxis
            dataKey="municipality"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
            height={50}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          
          <Tooltip content={<MunicipalityTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.6 }} />
          
          <Legend 
            verticalAlign="top" 
            align="right"
            height={24}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#64748b', fontWeight: 500, paddingTop: 2 }} 
          />
          
          {/* Barras Empilhadas com paleta de cores moderna */}
          <Bar dataKey="horizontalCount" stackId="a" name="Horizontal" fill="#0ea5e9" barSize={24} />
          <Bar dataKey="verticalCount" stackId="a" name="Vertical" fill="#10b981" barSize={24} />
          <Bar dataKey="transversalCount" stackId="a" name="Transversal" fill="#e9910e" barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}