import type { IMessageElement } from 'client-types/';

const toSafeLinkTarget = (name: string) =>
  encodeURIComponent(name.replace(/\s+/g, '_'))
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29'); // Encode parentheses to avoid issues in URLs

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

// One blockquote marker: up to 3 leading spaces, `>`, optional single space/tab.
const QUOTE_MARKER_RE = /^ {0,3}>[ \t]?/;

// Strips up to `max` leading blockquote markers, returning how many were found
// (capped at `max`) and the text left after them.
const stripQuoteMarkers = (line: string, max: number) => {
  let depth = 0;
  let rest = line;
  while (depth < max) {
    const m = QUOTE_MARKER_RE.exec(rest);
    if (!m) break;
    depth++;
    rest = rest.slice(m[0].length);
  }
  return { depth, rest };
};

// Line-start ``` / ~~~ fences (after any blockquote markers); unclosed fences run to the end.
const FENCE_START_RE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const splitFenceAwareLines = (text: string) => {
  let fenceChar = '';
  let fenceDepth = 0;
  let closeRe: RegExp | null = null;
  const parts = text.split(/(\r\n|\n)/);
  const out: { line: string; sep: string; code: boolean }[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i];
    // A shallower quote depth than the fence's opening ends its container.
    if (fenceChar && stripQuoteMarkers(line, fenceDepth).depth < fenceDepth) {
      fenceChar = '';
      closeRe = null;
    }
    let code = false;
    if (fenceChar) {
      code = true;
      if (closeRe!.test(stripQuoteMarkers(line, fenceDepth).rest)) {
        fenceChar = '';
        closeRe = null;
      }
    } else {
      const { depth, rest } = stripQuoteMarkers(line, Infinity);
      const m = FENCE_START_RE.exec(rest);
      if (m && !(m[2][0] === '`' && m[3].includes('`'))) {
        fenceDepth = depth;
        fenceChar = m[2][0];
        closeRe = new RegExp(`^ {0,3}\\${fenceChar}{${m[2].length},} *$`);
        code = true;
      }
    }
    out.push({ line, sep: parts[i + 1] || '', code });
  }
  return out;
};

// A backtick is escaped only behind an odd number of backslashes.
const precededByOddBackslashes = (line: string, i: number) => {
  let n = 0;
  while (i - n - 1 >= 0 && line[i - n - 1] === '\\') n++;
  return n % 2 === 1;
};

// Hand-rolled scan instead of lookbehind regex: unsupported on Safari < 16.4.
const splitInlineCode = (line: string) => {
  const segments: { text: string; code: boolean }[] = [];
  let start = 0;
  let i = 0;
  while (i < line.length) {
    if (line[i] === '`' && !precededByOddBackslashes(line, i)) {
      let j = i;
      while (line[j] === '`') j++;
      const openLen = j - i;
      let k = j;
      let close = -1;
      while (k < line.length) {
        if (line[k] !== '`') {
          k++;
          continue;
        }
        let m = k;
        while (line[m] === '`') m++;
        if (m - k === openLen) {
          close = m;
          break;
        }
        k = m;
      }
      if (close !== -1) {
        if (start < i)
          segments.push({ text: line.slice(start, i), code: false });
        segments.push({ text: line.slice(i, close), code: true });
        i = start = close;
        continue;
      }
      i = j;
      continue;
    }
    i++;
  }
  if (start < line.length)
    segments.push({ text: line.slice(start), code: false });
  return segments;
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

  const linkNames = (text: string) =>
    text.replaceAll(elementRegexp!, (match) => {
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
        // Build a Markdown-safe link: escape text, and encode () in the slug
        // The address in the link is not used anyway
        return `[${match}](${toSafeLinkTarget(match)})`;
      }
    });

  // A `language` wrap below turns the whole content into a code block, so skip linking then.
  if (elementRegexp && preparedContent && !language) {
    preparedContent = splitFenceAwareLines(preparedContent)
      .map(({ line, sep, code }) => {
        const linked = code
          ? line
          : splitInlineCode(line)
              .map((s) => (s.code ? s.text : linkNames(s.text)))
              .join('');
        return linked + sep;
      })
      .join('');
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
