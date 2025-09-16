// frontend/src/components/header/ModeSelector.tsx
// ChevronDown - иконка стрелочки вниз, чтобы показать, что это выпадающий список
import { ChevronDown } from 'lucide-react';
// 2. Импортируем наш новый атом
import { memo } from 'react';
import { useRecoilState } from 'recoil';

// Импортируем useState для хранения состояния
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// 1. Импортируем useRecoilState
import { chatModeState } from '@/state/chat';

const ModeSelector = memo(() => {
  // 1. Используем React.useState для хранения и обновления выбранного режима.
  //    По умолчанию ставим 'Pioneer', как и требовалось.
  const [selectedMode, setSelectedMode] = useRecoilState(chatModeState);

  const modes = ['Pioneer', 'ChatGPT', 'HR', 'FD'];

  // 2. Эта функция теперь будет обновлять состояние
  const handleSelect = (mode: string) => {
    setSelectedMode(mode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* 3. Кнопка теперь отображает текст из состояния (selectedMode) */}
        {/*    Она больше не является просто иконкой */}
        <Button variant="outline" className="flex items-center gap-2">
          {selectedMode}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {/* 4. Генерируем пункты меню из массива 'modes' */}
        {modes.map((mode) => (
          <DropdownMenuItem key={mode} onClick={() => handleSelect(mode)}>
            {mode}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default ModeSelector;
