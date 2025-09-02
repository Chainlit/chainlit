import { IInput } from '@/types';
import { Command as CommandPrimitive } from 'cmdk';
import { X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';

import { InputStateHandler } from './InputStateHandler';

interface SelectItemType {
  label: string;
  icon?: React.ReactNode;
  notificationCount?: number;
  value: string | number;
}

interface MultiSelectInputProps extends IInput {
  items?: SelectItemType[];
  value?: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  setField?: (
    field: string,
    value: (string | number)[],
    shouldValidate?: boolean
  ) => void;
  placeholder?: string;
}

const MultiSelectInput = ({
  id,
  hasError,
  description,
  label,
  tooltip,
  disabled = false,
  items = [],
  value = [],
  onChange,
  setField,
  placeholder
}: MultiSelectInputProps) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (selectedValue: string | number) => {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue];
    onChange(newValue);
    setField?.(id, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (input.value === '' && value.length > 0) {
          const newValue = [...value];
          newValue.pop();
          onChange(newValue);
          setField?.(id, newValue);
        }
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    }
  };

  const selectables = items.filter((item) => !value.includes(item.value));

  return (
    <InputStateHandler
      id={id}
      hasError={hasError}
      description={description}
      label={label}
      tooltip={tooltip}
    >
      <Command
        onKeyDown={handleKeyDown}
        className="overflow-visible bg-transparent"
      >
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {value.map((v) => {
              const item = items.find((item) => item.value === v);
              return (
                <Badge key={v} variant="secondary">
                  {item?.label}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSelect(v);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleSelect(v)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={
                value.length > 0
                  ? ''
                  : placeholder ||
                    t('components.MultiSelectInput.placeholder', 'Select...')
              }
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={disabled}
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandList>
                <CommandGroup>
                  {selectables.map((item) => (
                    <CommandItem
                      key={item.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        handleSelect(item.value);
                        setInputValue('');
                      }}
                      className={'cursor-pointer'}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </div>
          ) : null}
        </div>
      </Command>
    </InputStateHandler>
  );
};

export { MultiSelectInput };
export type { SelectItemType, MultiSelectInputProps };
