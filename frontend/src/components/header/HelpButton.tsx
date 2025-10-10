// src/components/HelpButton.tsx
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Справочная информация</DialogTitle>
        </DialogHeader>

        {/* Контейнер с текстом и скроллом */}
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="prose prose-sm dark:prose-invert">
            Режим Чат-бот:<br></br>- задавайте вопросы на любые темы.<br></br>-
            узнавайте корпоративную информацию.<br></br>- работайте с поиском по
            корпоративному документообороту.<br></br>- загружайте документы и
            находите в них информацию.<br></br>- ведите диалог в удобном
            формате.<br></br>
            <br></br>
            Возможности:<br></br>- используйте кнопку "Новый чат" для начала
            новой беседы.<br></br>- нажмите на значок корзины, чтобы удалить
            текущий чат.<br></br>- воспользуйтесь скрепкой, чтобы прикрепить
            файл.<br></br>
            <br></br>
            Рекомендации:<br></br>- каждую новую тему лучше начинать в новом
            чате.<br></br>- воспринимайте модель как ассистента — задавайте
            вопросы так, как если бы вы обращались к человеку.<br></br>-
            старайтесь конкретнее описывать желаемый результат и приводить
            примеры.
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function HelpButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            aria-label="Показать справку"
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <HelpCircle className="!size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Справка</p>
        </TooltipContent>
      </Tooltip>
      <HelpDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </TooltipProvider>
  );
}
