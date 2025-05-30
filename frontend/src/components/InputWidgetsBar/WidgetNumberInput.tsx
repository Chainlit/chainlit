import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useChatSession } from '@chainlit/react-client';
import { IInputWidget } from 'types/Input';

interface WidgetNumberInputProps extends IInputWidget {
  // type: 'numberinput' is implied
  placeholder?: string;
}

const WidgetNumberInput = (widget: WidgetNumberInputProps) => {
  const { session } = useChatSession();
  const [value, setValue] = useState<string>((widget.initial !== undefined ? widget.initial : '').toString());

  useEffect(() => {
    setValue((widget.initial !== undefined ? widget.initial : '').toString());
  }, [widget.initial]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };
  
  const handleBlur = () => {
    if (session?.socket) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        console.log(`Emitting input_widget_change for ${widget.id}: ${numValue}`);
        session.socket.emit('input_widget_change', { id: widget.id, value: numValue });
      } else {
        // Handle invalid number input, maybe revert or show error? For now, just log.
        console.warn(`Invalid number input for ${widget.id}: ${value}. Not emitting.`);
        // Optionally revert to initial or last valid value
        // setValue((widget.initial !== undefined ? widget.initial : '').toString());
      }
    }
  };

  return (
    <Input
      id={widget.id}
      name={widget.id}
      type="number"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur} // Emit on blur
      placeholder={widget.placeholder || widget.label}
      className="text-xs h-7 px-2 py-0 min-w-[60px] max-w-[100px]"
      aria-label={widget.label}
    />
  );
};

export default WidgetNumberInput;
