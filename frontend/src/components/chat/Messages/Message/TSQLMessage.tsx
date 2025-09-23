// src/components/chat/Messages/Message/TSQLMessage.tsx
import { IStep } from '@chainlit/react-client';

interface Props {
  message: IStep;
}

// Это ваш кастомный компонент. Дизайн и логика полностью ваши.
export const TSQLMessage = ({ message }: Props) => {
  return (
    <div
      style={{
        padding: '1rem',
        margin: '0.5rem 0',
        backgroundColor: '#FFFBEB', // Желтоватый фон
        borderLeft: '4px solid #FBBF24', // Акцентная полоска слева
        borderRadius: '4px',
        color: '#92400E' // Темный текст для контраста
      }}
    >
      <strong>📢 Объявление:</strong> {message.output}
    </div>
  );
};
