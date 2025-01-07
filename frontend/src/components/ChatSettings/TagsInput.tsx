import { X } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { IInput } from 'types/Input';

import { InputStateHandler } from './InputStateHandler';

export type TagsInputProps = {
  placeholder?: string;
  value?: string[];
  setField?(field: string, value: string[], shouldValidate?: boolean): void;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>;

export const TagsInput = ({
  description,
  hasError,
  id,
  label,
  tooltip,
  value = [],
  setField,
  placeholder,
  ...rest
}: TagsInputProps): JSX.Element => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        const newTags = [...value, inputValue.trim()];
        setField?.(id, newTags, false);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = value.filter((tag) => tag !== tagToRemove);
    setField?.(id, newTags, false);
  };

  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <Input
          {...rest}
          id={id}
          name={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mt-1"
        />
      </div>
    </InputStateHandler>
  );
};
