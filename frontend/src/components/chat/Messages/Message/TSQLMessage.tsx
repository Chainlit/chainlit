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
      {/* Стили для таблицы можно вынести в CSS, но для примера оставим здесь */}
      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.9em;
        }
        .data-table th, .data-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .data-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .dark .data-table th {
          background-color: #333;
        }
        .dark .data-table th, .dark .data-table td {
          border-color: #555;
        }
        .sql-details summary {
          cursor: pointer;
          outline: none;
          color: #666;
        }
        .dark .sql-details summary {
          color: #aaa;
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

      {/* Полноценная таблица */}
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

      {/* Раскрывающийся блок с SQL, который появляется только если sql передан */}
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
