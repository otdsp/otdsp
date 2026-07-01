import React from 'react';

type OrgTooltipData = {
  name?: string;
  value?: number;
  orgType?: string;
  members?: string[];
};

export const CustomOrgTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: OrgTooltipData }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const members = Array.isArray(data?.members) ? data.members : [];

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 z-50 min-w-[220px]">
        <p className="font-extrabold text-slate-900 text-sm tracking-tight">{data?.name}</p>
        <div className="flex items-center gap-4 text-slate-600">
          <span><strong className="text-slate-800 font-semibold">Membros:</strong> {data?.value ?? 0}</span>
        </div>
        <div className="pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">
            {data?.name === 'Outras' ? 'Segmentos Predominantes: ' : 'Segmento: '}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium font-sans">
            {data?.orgType || 'Não informado'}
          </span>
        </div>
        <div className="pt-1 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-700 mb-1">Participantes</p>
          {members.length > 0 ? (
            <ul className="max-h-28 space-y-1 overflow-y-auto pr-1">
              {members.map((member, index) => (
                <li key={`${member}-${index}`} className="text-[11px] text-slate-600 truncate">
                  • {member}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-slate-500">Nenhum participante identificado.</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};