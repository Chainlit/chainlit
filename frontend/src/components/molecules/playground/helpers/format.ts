// Helper function to match the placeholders for a given variable in the template
export function buildTemplatePlaceholderRegexp(
  variable: string,
  format: string
) {
  switch (format) {
    case 'f-string': {
      return new RegExp(`\\{+(${variable}+)\\}+`, 'g');
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

// Helper function to match the placeholders for a all variables in the template
export function buildTemplatePlaceholdersRegexp(
  inputs: object,
  format: string
) {
  const variables = Object.keys(inputs).sort((a, b) => b.length - a.length);
  if (!variables.length) {
    return undefined;
  }
  switch (format) {
    case 'f-string': {
      // Create a regex pattern from the variables array
      const regexPattern = variables.map((v) => `${v}`).join('|');
      return buildTemplatePlaceholderRegexp(regexPattern, format);
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

// Helper function to escape the template
export function escape(str: string, format: string) {
  switch (format) {
    case 'f-string': {
      str = str.replaceAll('{{', '{');
      str = str.replaceAll('}}', '}');
      return str;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

// Helper function to match all substrings to escape and or replace
export function buildEscapeReplaceRegexp(format: string) {
  switch (format) {
    case 'f-string': {
      // Match wrapped by {} or opening or closing braces
      return /\{+([^{}]+)\}+|{{|}}/g;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

// Helper function to build the template placeholder of a variable
export function buildVariablePlaceholder(variable: string, format: string) {
  switch (format) {
    case 'f-string': {
      return `{${variable}}`;
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}

export function validateVariablePlaceholder(
  variableName: string,
  match: string,
  format: string
) {
  switch (format) {
    case 'f-string': {
      // leading curly braces
      const prefixBracesCount = match.split(variableName)[0].length;
      // tailing curly braces
      const suffixBracesCount = match.split(variableName)[1].length;
      const isOdd = prefixBracesCount % 2;
      const ok = isOdd && prefixBracesCount === suffixBracesCount;
      const placeholder = buildVariablePlaceholder(variableName, format);
      const localStartIndex = match.indexOf(placeholder);
      const localEndIndex = localStartIndex + placeholder.length;
      return {
        ok,
        localStartIndex,
        localEndIndex
      };
    }
    default:
      throw new Error(`Unsupported template format ${format}`);
  }
}
