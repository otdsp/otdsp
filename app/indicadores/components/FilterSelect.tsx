import React from 'react';

interface FilterSelectProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

export function FilterSelect({ icon: Icon, label, value, onChange, children }: FilterSelectProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-cyan-600" />
        </div>
        <select 
          value={value} onChange={onChange}
          className="block w-full pl-9 pr-8 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {children}
        </select>
      </div>
    </div>
  );
}