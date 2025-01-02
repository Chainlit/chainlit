import type { ICustomElement } from '@chainlit/react-client';

import CustomElement from '@/components/Elements/CustomElement';

interface Props {
  items: ICustomElement[];
}

const InlinedCustomElementList = ({ items }: Props) => (
  <div className="flex flex-col gap-2">
    {items.map((customElement) => {
      return <CustomElement key={customElement.id} element={customElement} />;
    })}
  </div>
);

export { InlinedCustomElementList };
