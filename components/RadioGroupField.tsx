import React from 'react';

interface RadioGroupFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  tooltipText?: string;
}

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  tooltipText,
}) => {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-3">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {tooltipText && (
          <div className="tooltip-container cursor-help group">
            <div className="bg-slate-100 p-1 rounded-full hover:bg-indigo-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="tooltip-text glass-panel text-slate-800 shadow-lg border-slate-200">{tooltipText}</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <label className={`flex-1 relative border-2 rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all duration-200 ${value === 'sim' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
          <input
            type="radio"
            name={id}
            value="sim"
            checked={value === 'sim'}
            onChange={onChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            required={required}
          />
          <span className={`ml-2.5 text-sm font-semibold ${value === 'sim' ? 'text-indigo-700' : 'text-slate-600'}`}>Sim</span>
          {value === 'sim' && (
            <span className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </label>
        <label className={`flex-1 relative border-2 rounded-xl px-4 py-3 flex items-center cursor-pointer transition-all duration-200 ${value === 'nao' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/30'}`}>
          <input
            type="radio"
            name={id}
            value="nao"
            checked={value === 'nao'}
            onChange={onChange}
            className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
            required={required}
          />
          <span className={`ml-2.5 text-sm font-semibold ${value === 'nao' ? 'text-rose-700' : 'text-slate-600'}`}>Não</span>
          {value === 'nao' && (
            <span className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </label>
      </div>
    </div>
  );
};

export default RadioGroupField;