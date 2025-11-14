import { getDateFnsLocale } from '@/i18n/dateLocale';
import { cn } from '@/lib/utils';
import { IInput } from '@/types';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useTranslation } from 'components/i18n/Translator';

import { InputStateHandler } from './InputStateHandler';

// ============================================================================
// Utility Functions
// ============================================================================

const parseDate = (dateStr: string | undefined | null): Date | undefined => {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr);
  } catch {
    return undefined;
  }
};

const formatDateValue = (date: Date | undefined): string | undefined => {
  if (!date) return undefined;
  return date.toISOString();
};

const formatRangeValue = (
  range: DateRange | undefined
): [string, string] | undefined => {
  if (!range?.from) return undefined;
  return [
    formatDateValue(range.from)!,
    formatDateValue(range.to || range.from)!
  ];
};

const getDisabledMatcher = (
  disabled: boolean | undefined,
  minDate: Date | undefined,
  maxDate: Date | undefined
) => {
  if (disabled) return true;

  const matchers = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });

  return matchers.length > 0 ? matchers : undefined;
};

// ============================================================================
// Base Component
// ============================================================================

interface DatePickerBaseProps extends IInput {
  isEmpty: boolean;
  buttonText: ReactNode;
  calendarContent: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DatePickerBase = ({
  id,
  label,
  description,
  tooltip,
  hasError,
  disabled,
  isEmpty,
  buttonText,
  calendarContent,
  open,
  onOpenChange,
  className
}: DatePickerBaseProps): JSX.Element => {
  return (
    <InputStateHandler
      id={id}
      label={label}
      description={description}
      tooltip={tooltip}
      hasError={hasError}
    >
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            data-empty={isEmpty}
            className={cn(
              'w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground px-3 py-2',
              className
            )}
          >
            <div className="flex gap-3">
              <CalendarIcon className="!size-5" />
              {buttonText}
            </div>

            <ChevronDownIcon className="!size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {calendarContent}
        </PopoverContent>
      </Popover>
    </InputStateHandler>
  );
};

// ============================================================================
// Shared Props
// ============================================================================

interface DatePickerSharedProps {
  min_date?: string | null;
  max_date?: string | null;
  format?: string | null;
  placeholder?: string | null;
  setField?: (field: string, value: any, shouldValidate?: boolean) => void;
}

// ============================================================================
// Single Date Picker
// ============================================================================

export interface DatePickerSingleProps extends IInput, DatePickerSharedProps {
  value?: string;
}

const DatePickerSingle = ({
  id,
  value,
  min_date,
  max_date,
  format: dateFormat,
  placeholder,
  setField,
  ...baseProps
}: DatePickerSingleProps): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const date = parseDate(value);
  const minDate = parseDate(min_date);
  const maxDate = parseDate(max_date);
  const dateFnsLocale = getDateFnsLocale(i18n.language);

  const defaultPlaceholder =
    placeholder ?? t('components.DatePickerInput.placeholder.single');

  const handleDateSelect = (newDate: Date | undefined) => {
    const formattedDate = formatDateValue(newDate);
    setField?.(id, formattedDate);
    setOpen(false);
  };

  const buttonText = date ? (
    format(date, dateFormat || 'PPP', { locale: dateFnsLocale })
  ) : (
    <span>{defaultPlaceholder}</span>
  );

  const calendarContent = (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      disabled={getDisabledMatcher(baseProps.disabled, minDate, maxDate)}
      locale={dateFnsLocale}
      showOutsideDays={false}
      autoFocus
    />
  );

  return (
    <DatePickerBase
      {...baseProps}
      id={id}
      isEmpty={!date}
      buttonText={buttonText}
      calendarContent={calendarContent}
      open={open}
      onOpenChange={setOpen}
    />
  );
};

// ============================================================================
// Range Date Picker
// ============================================================================

export interface DatePickerRangeProps extends IInput, DatePickerSharedProps {
  value?: [string, string];
}

const DatePickerRange = ({
  id,
  value,
  min_date,
  max_date,
  format: dateFormatInput,
  placeholder,
  setField,
  ...baseProps
}: DatePickerRangeProps): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const dateRange: DateRange | undefined =
    value && Array.isArray(value)
      ? {
          from: parseDate(value[0]),
          to: parseDate(value[1])
        }
      : undefined;

  // Temporary range state for selections before confirmation
  const [tempRange, setTempRange] = useState<DateRange | undefined>(dateRange);

  const minDate = parseDate(min_date);
  const maxDate = parseDate(max_date);
  const dateFnsLocale = getDateFnsLocale(i18n.language);

  const dateFormat = dateFormatInput || 'PPP';
  const defaultPlaceholder =
    placeholder ?? t('components.DatePickerInput.placeholder.range');

  // Update temp range when selecting dates (don't commit yet)
  const handleRangeDateSelect = (newRange: DateRange | undefined) => {
    setTempRange(newRange);
  };

  // Confirm button: commit the temp range and close popover
  const handleConfirm = () => {
    const formattedRange = formatRangeValue(tempRange);
    setField?.(id, formattedRange);
    setOpen(false);
  };

  // Reset button: clear the temp range
  const handleReset = () => {
    setTempRange(undefined);
  };

  // Update temp range when popover opens to sync with current value
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    setTempRange(dateRange);
  };

  const buttonText = tempRange?.from ? (
    tempRange.to ? (
      <>
        {format(tempRange.from, dateFormat, { locale: dateFnsLocale })} -{' '}
        {format(tempRange.to, dateFormat, { locale: dateFnsLocale })}
      </>
    ) : (
      format(tempRange.from, dateFormat, { locale: dateFnsLocale })
    )
  ) : (
    <span>{defaultPlaceholder}</span>
  );

  const calendarContent = (
    <div className="flex flex-col">
      <Calendar
        mode="range"
        defaultMonth={tempRange?.from || dateRange?.from}
        selected={tempRange}
        onSelect={handleRangeDateSelect}
        numberOfMonths={2}
        disabled={getDisabledMatcher(baseProps.disabled, minDate, maxDate)}
        locale={dateFnsLocale}
        autoFocus
        showOutsideDays={false}
      />
      <div className="flex items-center justify-end gap-2 border-t p-3">
        <Button variant="outline" onClick={handleReset} size="sm">
          {t('common.actions.reset')}
        </Button>
        <Button onClick={handleConfirm} size="sm">
          {t('common.actions.confirm')}
        </Button>
      </div>
    </div>
  );

  return (
    <DatePickerBase
      {...baseProps}
      id={id}
      isEmpty={!dateRange?.from}
      buttonText={buttonText}
      calendarContent={calendarContent}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
};

// ============================================================================
// Main Component (Router)
// ============================================================================

export interface DatePickerInputProps extends IInput, DatePickerSharedProps {
  mode: 'single' | 'range';
  value?: string | [string, string];
}

const DatePickerInput = (props: DatePickerInputProps): JSX.Element => {
  if (props.mode === 'single') {
    return (
      <DatePickerSingle
        {...props}
        value={typeof props.value === 'string' ? props.value : undefined}
      />
    );
  }

  return (
    <DatePickerRange
      {...props}
      value={Array.isArray(props.value) ? props.value : undefined}
    />
  );
};

export { DatePickerInput, DatePickerRange, DatePickerSingle };
