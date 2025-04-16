import {
  importMdastTreeToLexical,
  MarkdownParseOptions,
  jsxComponentDescriptors$,
  importVisitors$,
  mdastExtensions$,
  syntaxExtensions$,
  directiveDescriptors$,
  codeBlockEditorDescriptors$,
  MarkdownParseError,
  markdownProcessingError$,
  markdown$,
} from "@mdxeditor/editor";
import * as Mdast from 'mdast';
import {
  fromMarkdown
} from 'mdast-util-from-markdown';
import {
  Realm,
} from "@mdxeditor/gurx";

import {
  ImportPoint
} from "types";

export function evoyaImportMarkdownToLexical({
  root,
  markdown,
  visitors,
  syntaxExtensions,
  mdastExtensions,
  ...descriptors
}: MarkdownParseOptions): void {
  let mdastRoot: Mdast.Root
  try {
    console.log('markdown', markdown);
    mdastRoot = fromMarkdown(markdown, {
      extensions: syntaxExtensions,
      mdastExtensions
    })
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new MarkdownParseError(`Error parsing markdown: ${e.message}`, e)
    } else {
      throw new MarkdownParseError(`Error parsing markdown: ${e}`, e)
    }
  }

  importMdastTreeToLexical({ root, mdastRoot, visitors, ...descriptors })
}

export function tryImportingMarkdown(r: Realm, node: ImportPoint, markdownValue: string) {
  try {
    ////////////////////////
    // Import initial value
    ////////////////////////
    evoyaImportMarkdownToLexical({
      root: node,
      visitors: r.getValue(importVisitors$),
      mdastExtensions: r.getValue(mdastExtensions$),
      markdown: markdownValue,
      syntaxExtensions: r.getValue(syntaxExtensions$),
      jsxComponentDescriptors: r.getValue(jsxComponentDescriptors$),
      directiveDescriptors: r.getValue(directiveDescriptors$),
      codeBlockEditorDescriptors: r.getValue(codeBlockEditorDescriptors$)
    })
    // r.pub(markdownProcessingError$, null)
  } catch (e) {
    console.error(e);
    // if (e instanceof MarkdownParseError || e instanceof UnrecognizedMarkdownConstructError) {
    //   r.pubIn({
    //     [markdown$]: markdownValue,
    //     [markdownProcessingError$]: {
    //       error: e.message,
    //       source: markdownValue
    //     }
    //   })
    // } else {
    //   throw e
    // }
  }
}