import {
  LexicalNode,
  $isElementNode,
  $isDecoratorNode,
} from "lexical";

import {
  $isListItemNode
} from "@lexical/list";

import {
  $isTableCellNode
} from "@lexical/table";

import {
  $isTableNode,
} from "@mdxeditor/editor";

export const notInline = (node: LexicalNode) =>
  ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();

export const notInlineExtended = (node: LexicalNode) =>
  (($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline()) && !$isListItemNode(node) && !$isTableCellNode(node);