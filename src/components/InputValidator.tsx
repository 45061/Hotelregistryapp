import React from 'react';

interface InputValidatorProps {
  name: string;
  id: string;
  value: any;
  type: string;
  className: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errorMessage?: string;
  required?: boolean;
}

const InputValidator: React.FC<InputValidatorProps> = ({ errorMessage, ...props }) => {
  return <input {...props} />;
};

export default InputValidator;