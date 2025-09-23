// src/components/chat/Messages/Message/TSQLMessage.tsx
import { IStep } from '@chainlit/react-client';

interface Props {
  message: IStep;
}

// Проверяем, что данные для таблицы корректны
const isTableData = (
  output: any
): output is { headers: string[]; rows: any[][] } => {
  return (
    typeof output === 'object' &&
    output !== null &&
    Array.isArray(output.headers) &&
    Array.isArray(output.rows)
  );
};

export const TSQLMessage = ({ message }: Props) => {
  const { output, sql } = message;

  if (!isTableData(output)) {
    // Если структура данных неверна, показываем ошибку, чтобы было легче отлаживать
    return (
      <div style={{ color: 'red' }}>
        Ошибка: неверный формат данных для таблицы.
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-full my-4">
      {/* 
        НОВАЯ ОБЕРТКА ДЛЯ ТАБЛИЦЫ!
        - maxHeight: Ограничивает высоту, создавая вертикальный скролл.
        - overflow: 'auto' (или overflowX/overflowY): Включает скроллбары, когда контент не помещается.
      */}
      <div
        style={{
          maxHeight: '400px', // Ограничиваем высоту (можно выбрать любое значение)
          overflow: 'auto' // Добавляем скроллбары и по вертикали, и по горизонтали
        }}
      >
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
          .dark .data-table th {
            background-color: #333;
          }
          .dark .data-table th, .dark .data-table td {
            border-color: #555;
          }
          .sql-details {
            margin-top: 1rem; /* Добавим отступ сверху */
          }
          .sql-details summary {
            cursor: pointer;
            outline: none;
            color: #666;
          }
          .dark .sql-details summary {
            color: #aaa;
          }
          .dark .data-table {
            border-color: #555;
          }
          .dark .data-table th, .dark .data-table td {
            border-color: #555;
          }
          .dark .data-table th {
            background-color: #333;
          }
          .sql-details pre {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;
          }
          .dark .sql-details pre {
            background-color: #2d2d2d;
          }
        `}</style>

        <table className="data-table">
          <thead>
            <tr>
              {output.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {output.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>{' '}
      {/* Конец новой обертки */}
      {sql && (
        <details className="sql-details">
          <summary>Показать SQL-запрос</summary>
          <pre>
            <code>{sql}</code>
          </pre>
        </details>
      )}
    </div>
  );
};
