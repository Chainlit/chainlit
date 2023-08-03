import cloneDeep from 'lodash/cloneDeep';

import { IPrompt } from 'state/chat';

export function buildTemplateRegexp(inputs = {}, format: string) {
  const variables = Object.keys(inputs).sort((a, b) => b.length - a.length);
  switch (format) {
    case 'f-string': {
      // Create a regex pattern from the variables array
      const regexPattern = variables.map((v) => `\\b${v}\\b`).join('|');
      const regex = new RegExp(`(?<!\\{)\\{(${regexPattern})\\}(?!\\})`, 'g');
      return regex;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

export function buildVariablePlaceholder(variable: string, format: string) {
  switch (format) {
    case 'f-string': {
      return `{${variable}}`;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

export function buildVariableRegexp(variable: string, format: string) {
  switch (format) {
    case 'f-string': {
      const regex = new RegExp(
        `(?<!\\{)${buildVariablePlaceholder(variable, format)}(?!\\})`,
        'g'
      );

      return regex;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

function formatPrompt(
  template: string,
  inputs: Record<string, any>,
  format: string
) {
  const regexp = buildTemplateRegexp(inputs, format);

  return template.replace(regexp, (match) => {
    const variableIndex = Object.keys(inputs).findIndex(
      (v) => buildVariablePlaceholder(v, format) === match
    );
    return Object.values(inputs || {})[variableIndex];
  });
}

export function preparePrompt(prompt?: IPrompt): IPrompt {
  if (!prompt) {
    throw new Error('No prompt provided');
  }
  prompt = cloneDeep(prompt);

  if (prompt.messages) {
    prompt.messages.forEach((m) => {
      if (m.template && prompt?.inputs) {
        m.formatted = formatPrompt(
          m.template,
          prompt.inputs,
          prompt.template_format
        );
      } else if (!m.formatted) {
        throw new Error('Cannot format message prompt');
      }
    });
  } else if (prompt.template && prompt.inputs) {
    prompt.formatted = formatPrompt(
      prompt.template,
      prompt.inputs,
      prompt.template_format
    );
  } else if (!prompt.formatted) {
    throw new Error('Cannot format prompt');
  }

  return prompt;
}
