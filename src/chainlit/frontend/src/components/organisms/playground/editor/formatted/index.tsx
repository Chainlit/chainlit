import { useEffect, useState } from 'react';

import { IPrompt } from 'state/chat';

import Editor, { IHighlight } from './formattedPromptEditor';

interface Props {
  prompt: IPrompt;
}

export default function FormattedPrompt({ prompt }: Props) {
  const [highlights, setHighlights] = useState<IHighlight[]>([]);

  useEffect(() => {
    if (!prompt.template || !prompt.inputs) {
      setHighlights([]);
      return;
    }
    const variables = Object.keys(prompt.inputs);
    const _hightlights: IHighlight[] = [];

    for (let i = 0; i < variables.length; i++) {
      const variableName = variables[i];

      const variableContent = prompt.inputs[variableName];

      _hightlights.push({
        name: variableName,
        styleIndex: i,
        content: variableContent
      });
    }
    setHighlights(_hightlights);
  }, [prompt]);

  if (!prompt.template) {
    return null;
  }

  return (
    <Editor
      readOnly
      template={prompt.template}
      templateFormat={prompt.template_format}
      highlights={highlights}
    />
  );
}
