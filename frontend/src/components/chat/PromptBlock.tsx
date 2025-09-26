// src/components/chat/PromptBlock.tsx

interface PromptBlockProps {
  header: string;
  questions: string[];
  onPromptClick: (prompt: string) => void;
}

function PromptBlock({ header, questions, onPromptClick }: PromptBlockProps) {
  return (
    <div className="prompt-block w-full px-4 mb-4">
      <h4 className="font-medium mb-3">{header}</h4>
      <div className="prompt-buttons flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            className="transition-colors ring-offset-background text-muted-foreground font-medium text-sm rounded-md whitespace-nowrap gap-2 bg-accent hover:bg-accent-hover py-1 px-2"
            onClick={() => onPromptClick(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PromptBlock;
