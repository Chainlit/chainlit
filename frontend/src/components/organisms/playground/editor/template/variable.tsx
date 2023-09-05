import { useColors } from 'helpers/color';
import { buildVariablePlaceholder } from 'helpers/format';
import React, { useEffect, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { Tooltip } from '@mui/material';

import { playgroundState, variableState } from 'state/playground';

interface Props {
  decoratedText: string;
}

function truncate(str: string, n = 200) {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

export default function Variable({
  children,
  decoratedText
}: React.PropsWithChildren<Props>) {
  const setVariableName = useSetRecoilState(variableState);
  const playground = useRecoilValue(playgroundState);
  const colors = useColors(true);
  const [variableIndex, setVariableIndex] = useState<number | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  const prompt = playground?.prompt;

  useEffect(() => {
    if (prompt?.inputs && decoratedText) {
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
          borderRadius: '2px',
          cursor: 'pointer'
        });
      }
    }
  }, [colors, decoratedText, prompt]);

  if (!prompt) {
    return null;
  }

  const [varName, varValue] =
    variableIndex !== undefined
      ? Object.entries(prompt.inputs || {})[variableIndex]
      : [];

  return (
    <Tooltip title={varValue ? truncate(varValue) : undefined}>
      <span
        className={varName ? `input-${varName}` : undefined}
        style={styles}
        onMouseDown={() => setVariableName(varName)}
      >
        {children}
      </span>
    </Tooltip>
  );
}
