import { expect, it } from 'vitest';

import type { ITextElement } from '@chainlit/react-client';

import { prepareContent } from '../src/lib/message';

const source1: ITextElement = {
  name: 'source_1',
  type: 'text',
  display: 'side',
  forId: 't',
  url: 'x'
};
const source12: ITextElement = {
  name: 'source_12',
  type: 'text',
  display: 'side',
  forId: 't',
  url: 'x'
};
const elements = [source1, source12];

const prepare = (content: string, language?: string) =>
  prepareContent({ elements, content, id: 't', language }).preparedContent;

it('leaves a fenced code block untouched', () => {
  const content =
    'before source_1\n```\nsource_1 in code\n```\nafter source_12';
  expect(prepare(content)).toBe(
    'before [source_1](source_1)\n```\nsource_1 in code\n```\nafter [source_12](source_12)'
  );
});

it('leaves a ~~~ fenced code block untouched', () => {
  const content = '~~~\nsource_1 in code\n~~~\nsource_12 in prose';
  expect(prepare(content)).toBe(
    '~~~\nsource_1 in code\n~~~\n[source_12](source_12) in prose'
  );
});

it('leaves inline code untouched', () => {
  expect(prepare('see `source_1` here')).toBe('see `source_1` here');
});

it('links prose while skipping code in a mixed message', () => {
  const content = 'source_1 says:\n```\nsource_12\n```\nsource_1 again';
  expect(prepare(content)).toBe(
    '[source_1](source_1) says:\n```\nsource_12\n```\n[source_1](source_1) again'
  );
});

it('treats an unclosed fence as code through the end (streaming)', () => {
  const content = 'before source_1\n```\nstreaming source_12';
  expect(prepare(content)).toBe(
    'before [source_1](source_1)\n```\nstreaming source_12'
  );
});

it('does not link names when the content is wrapped by `language`', () => {
  const content = 'source_1';
  expect(prepare(content, 'python')).toBe('```python\nsource_1\n```');
});

it('still links names around a stray mid-line ``` (like main)', () => {
  // No matching close run on the same line, so this isn't a fence (fences
  // must start the line) or a closed inline code span: plain prose.
  const content = 'source_1 has a stray ``` mark, then source_12';
  expect(prepare(content)).toBe(
    '[source_1](source_1) has a stray ``` mark, then [source_12](source_12)'
  );
});

it('does not treat a backtick span crossing a newline as code (like main)', () => {
  const content = '`source_1\nsource_12`';
  expect(prepare(content)).toBe(
    '`[source_1](source_1)\n[source_12](source_12)`'
  );
});

it('leaves a fenced code block inside a blockquote untouched', () => {
  const content =
    '> before source_1\n> ```\n> source_1 in code\n> ```\n> after source_12';
  expect(prepare(content)).toBe(
    '> before [source_1](source_1)\n> ```\n> source_1 in code\n> ```\n> after [source_12](source_12)'
  );
});

it('still links names in blockquoted prose (like main)', () => {
  const content = '> source_1 says hi to source_12';
  expect(prepare(content)).toBe(
    '> [source_1](source_1) says hi to [source_12](source_12)'
  );
});

it('closes a blockquoted fence when the quote depth changes', () => {
  const content =
    '> > intro source_1\n> > ```\n> > code line\n> ```\nprose source_12';
  expect(prepare(content)).toBe(
    '> > intro [source_1](source_1)\n> > ```\n> > code line\n> ```\nprose [source_12](source_12)'
  );
});

it('closes a blockquoted fence on a line without the quote prefix', () => {
  const content = '> a\n> ```\nsource_1 no-prefix\n> ```\nsource_12';
  expect(prepare(content)).toBe(
    '> a\n> ```\n[source_1](source_1) no-prefix\n> ```\n[source_12](source_12)'
  );
});

it('keeps a bare `>` line inside a blockquoted fence as code', () => {
  const content = '> ```\n>\n> source_1\n> ```';
  expect(prepare(content)).toBe(content);
});

it('treats an even backslash run before a backtick as unescaped (code)', () => {
  const content = 'see \\\\`source_1\\\\` here';
  expect(prepare(content)).toBe(content);
});

it('treats an odd backslash run before a backtick as escaped (not code)', () => {
  const content = 'see \\`source_1\\` here';
  expect(prepare(content)).toBe('see \\`[source_1](source_1)\\` here');
});
