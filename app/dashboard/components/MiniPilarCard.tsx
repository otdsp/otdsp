import React from 'react';
import { buildMiniPillarBars } from '../utils/presentation';
import type { PillarMetric } from '../types';

interface MiniPilarCardProps {
  title: string;
  data: PillarMetric[];
}

export function MiniPilarCard({ title, data }: MiniPilarCardProps) {
  const bars = buildMiniPillarBars(data);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6 tracking-tight border-b border-slate-100 pb-3">{title}</h3>
      <div className="space-y-4 flex-1">
        {bars.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">{item.label}</span>
              <span className="text-slate-900 font-bold font-mono">{item.count} {item.count === 1 ? 'engajamento' : 'engajamentos'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-cyan-600 h-2 rounded-full transition-all duration-500" style={{ width: `${item.widthPercentage}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}