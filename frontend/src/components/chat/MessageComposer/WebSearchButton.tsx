// src/components/molecules/chat/input/WebSearchButton.tsx
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

// Утилита для условных классов
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Определяем props для нашего компонента
interface WebSearchButtonProps {
  disabled?: boolean;
  value: boolean; // Текущее состояние (включено/выключено)
  onChange: (enabled: boolean) => void; // Функция для изменения состояния
}

export const WebSearchButton = ({
  disabled = false,
  value,
  onChange
}: WebSearchButtonProps) => {
  // Обработчик клика, который инвертирует текущее значение
  const handleClick = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="web-search-button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleClick}
            // Динамически добавляем классы для подсветки, когда кнопка активна
            className={cn(
              'hover:bg-muted',
              value && 'bg-accent text-accent-foreground' // Стили для активного состояния
            )}
          >
            {/* Иконка глобуса */}
            <Globe className="!size-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {/* Текст всплывающей подсказки */}
          <p>Web Search</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WebSearchButton;
