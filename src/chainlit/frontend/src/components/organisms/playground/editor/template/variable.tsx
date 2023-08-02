import { useColors } from 'helpers/color';
import React, { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';

import { IPrompt } from 'state/chat';
import { playgroundState } from 'state/playground';

interface Props {
  decoratedText: string;
  prompt: IPrompt;
}

export default function Variable({
  children,
  decoratedText,
  prompt
}: React.PropsWithChildren<Props>) {
  const setPrompt = useSetRecoilState(playgroundState);

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

  const setVariableName = () => {
    setPrompt((old) => ({
      ...old,
      variableName: decoratedText.replace('{', '').replace('}', '')
    }));
  };

  return (
    <span style={styles} onMouseDown={setVariableName}>
      {children}
    </span>
  );
}
