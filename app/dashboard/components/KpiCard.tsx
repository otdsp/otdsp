import React from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}

export function KpiCard({ title, value, icon: Icon, bgColor, iconColor }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all duration-300">
      <div className="space-y-2">
        <h3 className="text-slate-500 font-semibold tracking-wide text-xs uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${bgColor} ${iconColor} transition-transform group-hover:scale-110 duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}