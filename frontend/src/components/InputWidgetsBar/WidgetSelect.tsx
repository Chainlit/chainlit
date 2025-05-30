import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Adjust import if necessary
import { useChatSession } from '@chainlit/react-client';
import { IInputWidget, IInputItem } from 'types/Input';

interface WidgetSelectProps extends IInputWidget {
  // type: 'select' is implied by usage
  items: IInputItem[]; // Ensure items is always provided for select
}

const WidgetSelect = (widget: WidgetSelectProps) => {
  const { session } = useChatSession();
  // Ensure initial value is one of the item values, or default to first if not specified/invalid
  const getValidInitial = () => {
    if (widget.initial && widget.items.find(item => item.value === widget.initial)) {
      return widget.initial;
    }
    return widget.items.length > 0 ? widget.items[0].value : '';
  }
  
  const [value, setValue] = useState<string>(getValidInitial());

  useEffect(() => {
     setValue(getValidInitial());
  }, [widget.initial, widget.items]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (session?.socket) {
      console.log(`Emitting input_widget_change for ${widget.id}: ${newValue}`);
      session.socket.emit('input_widget_change', { id: widget.id, value: newValue });
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      name={widget.id}
    >
      <SelectTrigger 
        id={widget.id} 
        className="h-7 min-w-[80px] max-w-[120px] text-xs px-2 py-0 border-gray-300 dark:border-gray-600" 
        aria-label={widget.label}
      >
        <SelectValue placeholder={widget.label || "Select..."} />
      </SelectTrigger>
      <SelectContent className="min-w-[80px]">
        {(widget.items || []).map((item) => (
          <SelectItem key={item.value} value={item.value} className="text-xs py-1 pl-6 pr-2 relative">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default WidgetSelect;
