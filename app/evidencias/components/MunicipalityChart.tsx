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

type ParticipantData = {
  email: string;
  name: string;
  role: string;
  municipality: string;
};

type MunicipalityRow = {
  municipality: string;
  count: number;
  horizontalCount: number;
  verticalCount: number;
  transversalCount: number;
  participants: ParticipantData[];
};

type TooltipProps = {
  active?: boolean;
  payload?: any;
  label?: string;
};

function MunicipalityTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as MunicipalityRow;
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-lg text-slate-900" style={{ minWidth: 260 }}>
      <p className="text-sm font-semibold mb-2">{data.municipality}</p>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-slate-600">
        <div className="rounded-xl bg-slate-50 p-2 text-center">
          <p className="font-semibold text-slate-800">Horizontal</p>
          <p>{data.horizontalCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 text-center">
          <p className="font-semibold text-slate-800">Vertical</p>
          <p>{data.verticalCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 text-center">
          <p className="font-semibold text-slate-800">Transversal</p>
          <p>{data.transversalCount}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">Participantes únicos: <strong>{data.count}</strong></p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {data.participants.map((participant) => (
          <div key={participant.email} className="rounded-xl bg-slate-50 p-2 border border-slate-100">
            <p className="text-sm font-semibold text-slate-800">{participant.name}</p>
            <p className="text-xs text-slate-500">{participant.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MunicipalityChart({ data }: { data: MunicipalityRow[] }) {
  const chartData = useMemo(() => data.slice(0, 12), [data]);

  return (
    <div style={{ width: '100%', height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="municipality"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<MunicipalityTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, color: '#475569' }} />
          <Bar dataKey="horizontalCount" stackId="a" name="Horizontal" fill="#1f77b4" />
          <Bar dataKey="verticalCount" stackId="a" name="Vertical" fill="#2ca02c" />
          <Bar dataKey="transversalCount" stackId="a" name="Transversal" fill="#ff7f0e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
