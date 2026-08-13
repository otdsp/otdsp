import React from 'react'

interface FilterSelectFieldProps {
  label: string
  icon: React.ElementType
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

export function FilterSelectField({
  label,
  icon: Icon,
  value,
  onChange,
  options,
}: FilterSelectFieldProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-1">
      <label className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative flex h-full min-h-[42px] items-center">
        <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-full w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none transition-all cursor-pointer hover:bg-slate-100/50 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 text-[10px] text-slate-400">▼</div>
      </div>
    </div>
  )
}