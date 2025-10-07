// frontend/src/components/header/ModeSelector.tsx
// ChevronDown - иконка стрелочки вниз, чтобы показать, что это выпадающий список
import { setHasAgreed } from '@/redux/slices/chatGptAgreementSlice';
import { RootState } from '@/redux/store';
import { ChevronDown } from 'lucide-react';
// 2. Импортируем наш новый атом
import { memo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRecoilState } from 'recoil';

import { ChatGptAgreementDialog } from '@/components/ChatGptAgreementDialog';
// Импортируем useState для хранения состояния
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { chatModeState } from '@/state/chat';

const ModeSelector = memo(() => {
  const [selectedMode, setSelectedMode] = useRecoilState(chatModeState);

  // 3. Получаем состояние и dispatch из Redux
  const dispatch = useDispatch();
  const hasAgreedToGptTerms = useSelector(
    (state: RootState) => state.chatGptAgreement.hasAgreed
  );

  const [isAgreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const modes = ['Pioneer', 'ChatGPT', 'HR', 'FD'];

  const handleSelect = (mode: string) => {
    // Если пользователь выбрал ChatGPT и еще не соглашался с условиями
    if (mode === 'ChatGPT' && !hasAgreedToGptTerms) {
      setAgreementDialogOpen(true); // Открываем диалоговое окно
    } else {
      setSelectedMode(mode); // Иначе просто меняем режим
    }
  };

  const handleConfirmAgreement = () => {
    dispatch(setHasAgreed()); // Отправляем экшен, что пользователь согласился
    setSelectedMode('ChatGPT'); // Устанавливаем режим ChatGPT
    setAgreementDialogOpen(false); // Закрываем диалоговое окно
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            {selectedMode}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          {modes.map((mode) => (
            <DropdownMenuItem key={mode} onClick={() => handleSelect(mode)}>
              {mode}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 7. Добавляем наш компонент диалогового окна в рендер */}
      <ChatGptAgreementDialog
        open={isAgreementDialogOpen}
        onOpenChange={setAgreementDialogOpen}
        onConfirm={handleConfirmAgreement}
      />
    </>
  );
});

export default ModeSelector;
