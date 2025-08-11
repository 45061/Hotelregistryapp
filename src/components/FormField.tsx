
import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  value?: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  options?: string[];
  readOnly?: boolean;
  checked?: boolean;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, value, onChange, type = 'text', required = false, options, readOnly = false, checked, placeholder }) => {
  const isCheckbox = type === 'checkbox';
  const isSelect = type === 'select';

  const inputClasses = "w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-verde-principal focus:border-verde-principal";
  const checkboxClasses = "mt-1 rounded focus:ring-verde-principal text-verde-principal";

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 capitalize">
        {label}
      </label>
      {isSelect ? (
        <select
          id={name}
          name={name}
          value={value as string}
          onChange={onChange}
          required={required}
          className={inputClasses}
          disabled={readOnly}
        >
          <option value="">Select an option</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          checked={isCheckbox ? (checked as boolean) : undefined}
          value={isCheckbox ? undefined : (value as string | number)}
          onChange={onChange}
          required={required}
          readOnly={readOnly}
          placeholder={placeholder}
          className={isCheckbox ? checkboxClasses : inputClasses}
        />
      )}
    </div>
  );
};

export default FormField;
