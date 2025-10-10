// src/components/chat/Messages/Message/TableWithoutSQL.tsx
import { IStep } from '@chainlit/react-client';

interface TableData {
  output: {
    headers: string[];
    rows: any[][];
  };
}

interface Props {
  message: IStep;
}

const isTableData = (output: any): output is TableData => {
  return (
    typeof output === 'object' &&
    output !== null &&
    Array.isArray(output.output.headers) &&
    Array.isArray(output.output.rows)
  );
};

export const TableWithoutSQL = ({ message }: Props) => {
  let tableData: TableData | undefined;

  // Безопасно парсим данные, если они пришли в виде строки
  try {
    tableData = typeof message === 'string' ? JSON.parse(message) : message;
  } catch (error) {
    console.error('Ошибка парсинга JSON для таблицы:', error);
    // В случае ошибки парсинга, показываем пользователю сообщение
    return (
      <div style={{ color: 'red' }}>
        Ошибка: не удалось обработать данные для таблицы.
      </div>
    );
  }

  // Проверяем, что после парсинга у нас получилась правильная структура
  if (!isTableData(tableData)) {
    // Если структура неверна, это помогает легко найти ошибку при отладке
    return (
      <div style={{ color: 'red' }}>
        Ошибка: неверный формат данных для таблицы.
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-full my-4">
      {/* 
            Обертка для таблицы, которая добавляет скроллинг
            - maxHeight: Ограничивает высоту, создавая вертикальный скролл.
            - overflow: 'auto': Включает скроллбары, когда контент не помещается.
        */}
      <div
        style={{
          maxHeight: '400px', // Высоту можно настроить по своему усмотрению
          overflow: 'auto'
        }}
      >
        {/* Все стили инкапсулированы внутри компонента */}
        <style>{`
            .data-table {
                border-collapse: separate; 
                border-spacing: 0; 
                width: 100%;
                font-size: 0.9em;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .data-table th, .data-table td {
                padding: 8px;
                text-align: left;
                white-space: nowrap;
                border-bottom: 1px solid #ddd;
                border-right: 1px solid #ddd;
            }
            .data-table th:last-child,
            .data-table td:last-child {
                border-right: none;
            }
            .data-table tr:last-child td {
                border-bottom: none;
            }
            .data-table th {
                background-color: #f2f2f2;
                font-weight: bold;
                position: sticky; /* "Приклеиваем" заголовок при вертикальной прокрутке */
                top: 0;
                z-index: 1;
            }
            /* Стили для темной темы */
            .dark .data-table {
                border-color: #555;
            }
            .dark .data-table th, .dark .data-table td {
                border-color: #555;
            }
            .dark .data-table th {
                background-color: #333;
            }
            `}</style>

        <table className="data-table">
          <thead>
            <tr>
              {tableData.output.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.output.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
