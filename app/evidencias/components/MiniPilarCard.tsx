import React from 'react';

interface MiniPilarCardProps {
  title: string;
  data: { label: string; count: number }[];
}

export function MiniPilarCard({ title, data }: MiniPilarCardProps) {
  const maxCount = Math.max(...data.map(item => item.count), 1);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6 tracking-tight border-b border-slate-100 pb-3">{title}</h3>
      <div className="space-y-4 flex-1">
        {data.map((item, i) => {
          const widthPercentage = (item.count / maxCount) * 100;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className="text-slate-900 font-bold font-mono">{item.count} {item.count === 1 ? 'eng' : 'engs'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-cyan-600 h-2 rounded-full transition-all duration-500" style={{ width: `${widthPercentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}