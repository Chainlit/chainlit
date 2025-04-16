import {
  RangeSelection,
  NodeSelection,
  LexicalNode,
} from "lexical";

export interface EvoyaCreatorConfig {
  enabled: boolean;
  container: HTMLElement;
}

export type SelectionContext = {
  lexical: RangeSelection | NodeSelection | null;
  markdown: string | null;
  selectionType: 'range' | 'node' | 'caret' | 'document' | 'codeblock' | null;
  insertType: 'after' | 'before' | 'replace' | null;
  rectangles?: Array<DOMRect>;
  rect?: any;
  scrollOffset?: number;
  code?: string;
  selectedCode?: string;
  language?: string;
}

export type CodeSelectionContext = {
  lexical: NodeSelection | null;
  code: string;
  selectedCode: string;
}

export const selectionContextDefaultData: SelectionContext = {
  lexical: null,
  markdown: null,
  selectionType: null,
  insertType: null
}

export interface ImportPoint {
  append(node: LexicalNode): void
  getType(): string
}

export type CreatorMessage = {
  insertType: string; // 'none' | 'after' | 'before' | 'replace';
  content: string;
  feedback: string | null;
}