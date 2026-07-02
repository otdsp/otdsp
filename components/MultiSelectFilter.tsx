import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  values: string[];
  options: string[];
  onEnabledChange: (enabled: boolean) => void;
  onValuesChange: (values: string[]) => void;
}

export function MultiSelectFilter({
  label,
  icon: Icon,
  enabled,
  values,
  options,
  onEnabledChange,
  onValuesChange,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleEnabled = (nextEnabled: boolean) => {
    onEnabledChange(nextEnabled);
  };

  const handleItemToggle = (option: string) => {
    const nextValues = values.includes(option)
      ? values.filter((value) => value !== option)
      : [...values, option];

    onValuesChange(nextValues);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => handleToggleEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
          </label>

          <button
            type="button"
            onClick={() => enabled && setIsOpen((prev) => !prev)}
            className={`flex items-center gap-2 text-left text-sm font-semibold text-slate-700 ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className="h-4 w-4 text-cyan-600" />
            <span>{label}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && enabled && (
        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
          <div className="max-h-48 space-y-2 overflow-auto pr-1">
            {options.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                Nenhum item disponível.
              </p>
            ) : (
              options.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.includes(option)}
                    onChange={() => handleItemToggle(option)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>{option}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
