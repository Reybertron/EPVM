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
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {tooltipText && (
          <div className="tooltip-container cursor-help">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="tooltip-text">{tooltipText}</span>
          </div>
        )}
      </div>
      <div className="flex space-x-6">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name={id}
            value="sim"
            checked={value === 'sim'}
            onChange={onChange}
            className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
            required={required}
          />
          <span className="ml-2 text-gray-700">Sim</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name={id}
            value="nao"
            checked={value === 'nao'}
            onChange={onChange}
            className="form-radio h-4 w-4 text-pink-600 transition duration-150 ease-in-out"
            required={required}
          />
          <span className="ml-2 text-gray-700">Não</span>
        </label>
      </div>
    </div>
  );
};

export default RadioGroupField;