import { useColors } from 'helpers/color';
import { useEffect, useState } from 'react';

import { IPrompt } from 'state/chat';

interface Props {
  decoratedText: string;
  prompt: IPrompt;
}

export default function Variable({
  children,
  decoratedText,
  prompt
}: React.PropsWithChildren<Props>) {
  const colors = useColors(true);
  const [styles, setStyles] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (prompt.inputs && decoratedText) {
      const index = Object.entries(prompt.inputs).findIndex(
        ([name, content]) =>
          `{${name}}` == decoratedText || content == decoratedText
      );
      if (index > -1) {
        const colorIndex = index % (colors.length - 1);
        setStyles({
          backgroundColor: colors[colorIndex],
          cursor: 'pointer'
        });
      }
    }
  }, [decoratedText, prompt]);

  function handleClick() {
    alert('click!');
  }

  return (
    <span style={styles} onMouseDown={handleClick}>
      {children}
    </span>
  );
}
