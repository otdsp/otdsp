import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 min-[520px]:grid-cols-2">
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Data Inicial</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-4 w-4 text-cyan-600" />
          </div>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:bg-slate-100 transition-colors cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Data Final</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-4 w-4 text-cyan-600" />
          </div>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:bg-slate-100 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
