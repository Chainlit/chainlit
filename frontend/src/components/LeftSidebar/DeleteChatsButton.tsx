import { Trash } from 'lucide-react';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ChainlitContext } from '@chainlit/react-client';
import { useChatInteract } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// 1. Презентационный компонент для диалога
interface DeleteChatDialogProps {
  open: boolean;
  isDeleting: boolean; // Состояние загрузки для блокировки кнопки
  handleClose: () => void;
  handleConfirm: () => void;
}

const DeleteChatDialog = ({
  open,
  isDeleting,
  handleClose,
  handleConfirm
}: DeleteChatDialogProps) => {
  return (
    // onOpenChange={handleClose} позволяет закрывать окно по Esc или клику вне его
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* TODO: Заменить текст на ключи для перевода <Translator /> */}
          <DialogTitle>Удалить все чаты?</DialogTitle>
          <DialogDescription>
            Это действие необратимо. Все чаты будут утеряны навсегда.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Отменить
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting} // Блокируем кнопку во время запроса
            id="confirm-delete"
          >
            {isDeleting ? 'Удаление...' : 'Подтвердить и удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 2. Основной "умный" компонент
export function DeleteChatButton() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const apiClient = useContext(ChainlitContext); // Получаем API клиент
  const { clear } = useChatInteract();

  const handleClose = () => {
    // Не даем закрыть окно во время процесса удаления
    if (isDeleting) return;
    setOpen(false);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      await apiClient.deleteChats();

      toast.success('Чат успешно удален.');
      navigate('/');
      clear();
      setOpen(false);
    } catch {
      toast.error('Произошла ошибка при удалении чата.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              id="delete-chat-button"
              className="text-muted-foreground hover:text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Trash className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Удалить чаты</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DeleteChatDialog
        open={open}
        isDeleting={isDeleting}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </div>
  );
}
