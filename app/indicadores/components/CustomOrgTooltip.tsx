import React from 'react';

export const CustomOrgTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 z-50">
        <p className="font-extrabold text-slate-900 text-sm tracking-tight">{data.name}</p>
        <div className="flex items-center gap-4 text-slate-600">
          <span><strong className="text-slate-800 font-semibold">Membros:</strong> {data.value}</span>
        </div>
        <div className="pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">
            {data.name === 'Outras' ? 'Segmentos Predominantes: ' : 'Segmento (Mais frequente): '}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium font-sans">
            {data.orgType}
          </span>
        </div>
      </div>
    );
  }
  return null;
};