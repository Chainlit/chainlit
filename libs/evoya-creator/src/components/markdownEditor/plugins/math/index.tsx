import {
  realmPlugin,
  addLexicalNode$,
  addActivePlugin$,
  addImportVisitor$,
  addExportVisitor$,
  LexicalExportVisitor,
  addMdastExtension$,
  addToMarkdownExtension$,
  addSyntaxExtension$,
  MdastImportVisitor,
} from "@mdxeditor/editor";

import {
  DecoratorNode,
  NodeKey,
  DOMExportOutput,
  Spread,
  SerializedLexicalNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
} from "lexical";

import {
  mathFromMarkdown,
  mathToMarkdown,
  InlineMath,
  Math
} from 'mdast-util-math';

import {
  math
} from 'micromark-extension-math';

import {
  renderToString
} from "katex";

export const MdastMathVisitor: MdastImportVisitor<Math> = {
  testNode: 'math',
  visitNode({ mdastNode, actions }) {
    console.log(mdastNode);
    actions.addAndStepInto(
      $createMathNode({mathString: mdastNode.value})
    );
  }
}

export const LexicalMathVisitor: LexicalExportVisitor<MathNode, Math> = {
  testLexicalNode: $isMathNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    actions.appendToParent(mdastParent, {
      type: 'math',
      value: lexicalNode.__mathString,
    });
  }
}

export const MdastInlineMathVisitor: MdastImportVisitor<InlineMath> = {
  testNode: 'inlineMath',
  visitNode({ mdastNode, actions }) {
    console.log(mdastNode);
    actions.addAndStepInto(
      $createInlineMathNode({mathString: mdastNode.value})
    );
  }
}

export const LexicalInlineMathVisitor: LexicalExportVisitor<InlineMathNode, InlineMath> = {
  testLexicalNode: $isInlineMathNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    actions.appendToParent(mdastParent, {
      type: 'inlineMath',
      value: lexicalNode.__mathString,
    });
  }
}

export type SerializedMathNode = Spread<
  {
    mathString: string
    type: 'math'
    version: 1
  },
  SerializedLexicalNode
>

export class MathNode extends DecoratorNode<JSX.Element> {
  __mathString: string;

  static getType(): string {
    return 'math';
  }

  constructor(mathString: string, key?: NodeKey) {
    super(key);
    this.__mathString = mathString;
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__mathString, node.__key)
  }
  
  exportDOM(): DOMExportOutput {
    const element = document.createElement('p');

    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('p');
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const { mathString } = serializedNode;
    const node = $createMathNode({ mathString });
    return node;
  }

  exportJSON(): SerializedMathNode {
    return {
      mathString: this.__mathString,
      type: 'math',
      version: 1
    }
  }

  decorate(_parentEditor: LexicalEditor): JSX.Element {
    var html = renderToString(this.__mathString, {
      throwOnError: false,
      output: "mathml",
    });
    if (html) {
      return (
        <span dangerouslySetInnerHTML={{__html: html}} />
      );
    }

    return <span>{this.__mathString}</span>;
  }

  isInline(): boolean {
    return false;
  }
}

export interface CreateMathNodeParameters {
  mathString: string
  key?: NodeKey
}

export function $createMathNode({ key, mathString}: CreateMathNodeParameters): MathNode {
  return new MathNode(mathString, key);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}

export type SerializedInlineMathNode = Spread<
  {
    mathString: string
    type: 'inlineMath'
    version: 1
  },
  SerializedLexicalNode
>

export class InlineMathNode extends DecoratorNode<JSX.Element> {
  __mathString: string;

  static getType(): string {
    return 'inlineMath';
  }

  constructor(mathString: string, key?: NodeKey) {
    super(key);
    this.__mathString = mathString;
  }

  static clone(node: InlineMathNode): InlineMathNode {
    return new InlineMathNode(node.__mathString, node.__key)
  }
  
  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');

    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedInlineMathNode): InlineMathNode {
    const { mathString } = serializedNode;
    const node = $createInlineMathNode({ mathString });
    return node;
  }

  exportJSON(): SerializedInlineMathNode {
    return {
      mathString: this.__mathString,
      type: 'inlineMath',
      version: 1
    }
  }

  decorate(_parentEditor: LexicalEditor): JSX.Element {
    var html = renderToString(this.__mathString, {
      throwOnError: false,
      output: "mathml",
    });
    if (html) {
      return (
        <span dangerouslySetInnerHTML={{__html: html}} />
      );
    }

    return <span>{this.__mathString}</span>;
  }

  isInline(): boolean {
    return true;
  }
}

export interface CreateInlineMathNodeParameters {
  mathString: string
  key?: NodeKey
}

export function $createInlineMathNode({ key, mathString}: CreateInlineMathNodeParameters): InlineMathNode {
  return new InlineMathNode(mathString, key);
}

export function $isInlineMathNode(node: LexicalNode | null | undefined): node is InlineMathNode {
  return node instanceof InlineMathNode;
}

type EvoyaMathPluginParams = {
}

export const evoyaMathPlugin = realmPlugin<EvoyaMathPluginParams>({
  init: (realm, params) => {
    realm.pubIn({
      [addActivePlugin$]: 'evoyaMath',
      [addLexicalNode$]: [InlineMathNode, MathNode],
      [addMdastExtension$]: mathFromMarkdown(),
      [addSyntaxExtension$]: math(),
      [addImportVisitor$]: [MdastMathVisitor, MdastInlineMathVisitor],
      [addExportVisitor$]: [LexicalInlineMathVisitor, LexicalMathVisitor],
      [addToMarkdownExtension$]: mathToMarkdown(),
    });
  }
});