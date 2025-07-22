import type { ITextElement } from '@chainlit/react-client';

import { SmartTextElement } from '@/components/Elements/SmartTextElement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  items: ITextElement[];
}

const InlinedTextList = ({ items }: Props) => (
  <div className="flex flex-col gap-2">
    {items.map((el) => {
      return (
        <Card key={el.id}>
          <CardHeader>
            <CardTitle>{el.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <SmartTextElement element={el} />
          </CardContent>
        </Card>
      );
    })}
  </div>
);

export { InlinedTextList };
