'use client';

import React, { useState } from 'react';
import { MAKE_SUGGESTIONS, FORM_INPUT_CLASS } from '@/lib/inventoryForm';

interface MakeComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * A single, self-contained combobox for the vehicle "Make" field.
 * Replaces the previous hand-rolled dropdown + redundant <datalist> pairing
 * that was duplicated across the Add and Edit forms.
 */
export const MakeCombobox: React.FC<MakeComboboxProps> = ({
  id = 'make',
  value,
  onChange,
  required,
  placeholder = 'Enter make',
  className,
}) => {
  const [open, setOpen] = useState(false);

  const suggestions = MAKE_SUGGESTIONS.filter((s) =>
    !value ? true : s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        id={id}
        name={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        required={required}
        autoComplete="off"
        className={className ?? FORM_INPUT_CLASS}
        placeholder={placeholder}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.map((opt) => (
            <li
              key={opt}
              className="cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
              // onMouseDown fires before input blur, so the value is set reliably
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MakeCombobox;
