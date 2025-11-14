import React from 'react';

interface InputFieldProps {
  id: string;
  label: string;
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
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
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
        className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
