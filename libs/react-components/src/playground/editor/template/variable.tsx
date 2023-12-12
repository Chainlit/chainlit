import { PlaygroundContext } from 'contexts/PlaygroundContext';
import React, { useContext, useEffect, useState } from 'react';
import { buildVariablePlaceholder } from 'src/playground/helpers/format';

import Tooltip from '@mui/material/Tooltip';

import { useColors } from 'hooks/useColors';

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
  const { setVariableName, playground } = useContext(PlaygroundContext);
  const colors = useColors(true);
  const [variableIndex, setVariableIndex] = useState<number | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  const generation = playground?.generation;

  useEffect(() => {
    if (generation?.inputs && decoratedText) {
      const index = Object.keys(generation.inputs).findIndex(
        (name) => buildVariablePlaceholder(name, 'f-string') === decoratedText
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
  }, [colors, decoratedText, generation]);

  if (!generation) {
    return null;
  }

  const [varName, varValue] =
    variableIndex !== undefined
      ? Object.entries(generation.inputs || {})[variableIndex]
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
