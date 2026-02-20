import React from 'react';

interface InputFieldProps {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'date' | 'tel';
  required?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  onBlur,
  placeholder,
  disabled = false,
  error = null,
}) => {
  const hasError = !!error;

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`glass-input w-full px-4 py-3 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all duration-200 ${
          hasError
            ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
        }`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-sm text-rose-500 ml-1 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;