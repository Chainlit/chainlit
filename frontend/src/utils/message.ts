import type { IMessageElement } from 'client-types/';

const isForIdMatch = (id: string | number | undefined, forId: string) => {
  if (!forId || !id) {
    return false;
  }

  return forId === id.toString();
};

const escapeRegExp = (string: string) => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const prepareContent = ({
  elements,
  content,
  id,
  language
}: {
  elements: IMessageElement[];
  content?: string;
  id: string;
  language?: string;
}) => {
  const elementNames = elements.map((e) => escapeRegExp(e.name));

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  let preparedContent = content ? content.trim() : '';
  const inlinedElements = elements.filter(
    (e) => isForIdMatch(id, e?.forId) && e.display === 'inline'
  );
  const refElements: IMessageElement[] = [];

  if (elementRegexp) {
    preparedContent = preparedContent.replaceAll(elementRegexp, (match) => {
      const element = elements.find((e) => {
        const nameMatch = e.name === match;
        const scopeMatch = isForIdMatch(id, e?.forId);
        return nameMatch && scopeMatch;
      });
      const foundElement = !!element;

      const inlined = element?.display === 'inline';
      if (!foundElement) {
        // Element reference does not exist, return plain text
        return match;
      } else if (inlined) {
        // If element is inlined, add it to the list and return plain text
        if (inlinedElements.indexOf(element) === -1) {
          inlinedElements.push(element);
        }
        return match;
      } else {
        // Element is a reference, add it to the list and return link
        refElements.push(element);
        // spaces break markdown links. The address in the link is not used anyway
        return `[${match}](${match.replaceAll(' ', '_')})`;
      }
    });
  }

  if (language && preparedContent) {
    const prefix = `\`\`\`${language}`;
    const suffix = '```';
    if (!preparedContent.startsWith('```')) {
      preparedContent = `${prefix}\n${preparedContent}\n${suffix}`;
    }
  }
  return {
    preparedContent,
    inlinedElements,
    refElements
  };
};
