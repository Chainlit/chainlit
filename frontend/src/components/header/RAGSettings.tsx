import { useRAG } from '@/contexts/RAGContext';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  className?: string;
}

export function RAGSettings({ className }: Props) {
  const { ragIndex, setRagIndex } = useRAG();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor="rag-input" className="text-sm text-muted-foreground">
        RAG INDEX:
      </Label>
      <Input
        id="rag-input"
        type="text"
        value={ragIndex}
        onChange={(e) => setRagIndex(e.target.value)}
        placeholder="Enter RAG INDEX"
        className="w-[200px]"
      />
    </div>
  );
}
