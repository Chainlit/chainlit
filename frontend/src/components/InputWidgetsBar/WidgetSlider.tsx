import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider'; // Adjust import if necessary
import { useChatSession } from '@chainlit/react-client';
import { IInputWidget } from 'types/Input'; // Assuming IInputWidget is in types/Input.ts

interface WidgetSliderProps extends IInputWidget {
  // type: 'slider' is implied by usage
}

const WidgetSlider = (widget: WidgetSliderProps) => {
  const { session } = useChatSession();
  const [value, setValue] = useState(widget.initial !== undefined ? widget.initial : widget.min || 0);

  useEffect(() => {
    // Update internal state if initial value changes from props (e.g. backend reset)
    setValue(widget.initial !== undefined ? widget.initial : widget.min || 0);
  }, [widget.initial, widget.min]);

  const handleValueChange = (newValue: number[]) => {
    const singleValue = newValue[0];
    setValue(singleValue);
    // No need to check min/max here as the Slider component should enforce it.
  };

  const handleValueCommit = (committedValue: number[]) => {
    const singleValue = committedValue[0];
    if (session?.socket) {
      console.log(`Emitting input_widget_change for ${widget.id}: ${singleValue}`);
      session.socket.emit('input_widget_change', { id: widget.id, value: singleValue });
    }
  };

  return (
    <div className="flex items-center gap-1 min-w-[80px] max-w-[120px]">
      <Slider
        id={widget.id}
        name={widget.id}
        min={widget.min}
        max={widget.max}
        step={widget.step}
        value={[value]}
        onValueChange={handleValueChange} // Updates UI instantly
        onValueCommit={handleValueCommit} // Sends to backend on release
        className="flex-1"
        aria-label={widget.label}
      />
      <span className="text-xs font-mono w-6 text-right text-muted-foreground">{value}</span>
    </div>
  );
};

export default WidgetSlider;
