import React from 'react';

import { Input } from '@/components/ui/input';

export interface NotificationCountProps {
  count: number;
  inputProps?: {
    id: string;
    max?: number;
    min?: number;
    step?: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

const NotificationCount = ({ count, inputProps }: NotificationCountProps) => {
  if (!count) return null;

  const renderBox = () => (
    <div className="flex items-center rounded-md bg-muted px-2 py-1">
      <span className="text-xs font-semibold text-muted-foreground">
        {count}
      </span>
    </div>
  );

  const renderInput = () => {
    const getInputWidth = (hasArrow?: boolean) => {
      const countString = count.toString();
      let contentWidth = countString.length * 8 + (hasArrow ? 22 : 0);
      if (countString.includes('.') || countString.includes(',')) {
        contentWidth -= 6;
      }
      return contentWidth;
    };

    return inputProps ? (
      <Input
        id={inputProps.id}
        type="number"
        max={inputProps.max}
        min={inputProps.min}
        step={inputProps.step || 1}
        value={count}
        onChange={inputProps.onChange}
        className="rounded-md bg-muted text-xs font-semibold text-muted-foreground"
        style={{
          width: `${getInputWidth()}px`,
          padding: '0.5rem 1rem',
          border: 'none'
        }}
      />
    ) : null;
  };

  return !inputProps ? renderBox() : renderInput();
};

export { NotificationCount };
