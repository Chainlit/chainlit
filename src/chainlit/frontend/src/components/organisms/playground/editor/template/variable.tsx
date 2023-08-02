import { useColors } from 'helpers/color';
import { buildVariablePlaceholder } from 'helpers/format';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { Tooltip } from '@mui/material';

import { playgroundState } from 'state/playground';

interface Props {
  decoratedText: string;
}

export default function Variable({
  children,
  decoratedText
}: React.PropsWithChildren<Props>) {
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const colors = useColors(true);
  const [variableIndex, setVariableIndex] = useState<number | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  const prompt = playground?.prompt;

  if (!prompt) {
    return null;
  }

  useEffect(() => {
    if (prompt.inputs && decoratedText) {
      const index = Object.keys(prompt.inputs).findIndex(
        (name) =>
          buildVariablePlaceholder(name, prompt.template_format) ===
          decoratedText
      );
      if (index > -1) {
        setVariableIndex(index);
        const colorIndex = index % (colors.length - 1);
        setStyles({
          backgroundColor: colors[colorIndex],
          cursor: 'pointer'
        });
      }
    }
  }, [decoratedText, prompt]);

  const setVariableName = () => {
    setPlayground((old) => ({
      ...old,
      variableName:
        variableIndex !== undefined
          ? Object.keys(prompt.inputs || {})[variableIndex]
          : undefined
    }));
  };

  return (
    <Tooltip
      title={
        variableIndex !== undefined
          ? Object.values(prompt.inputs || {})[variableIndex]
          : undefined
      }
    >
      <span style={styles} onMouseDown={setVariableName}>
        {children}
      </span>
    </Tooltip>
  );
}
