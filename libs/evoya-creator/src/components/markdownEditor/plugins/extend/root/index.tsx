import { LexicalNode, RootNode as LexicalRootNode } from 'lexical';
import * as Mdast from 'mdast';
import {
  LexicalExportVisitor,
  realmPlugin,
  addExportVisitor$,
} from '@mdxeditor/editor';

export const LexicalRootVisitor: LexicalExportVisitor<LexicalRootNode, Mdast.Root> = {
  testLexicalNode: (node: LexicalNode) => node.getType() === 'root',
  priority: 100,
  visitLexicalNode: ({ actions }) => {
    actions.addAndStepInto('root');
  }
}

export const evoyaRootPlugin = realmPlugin<{}>({
  init: (realm, params) => {
    realm.pubIn({
      [addExportVisitor$]: [LexicalRootVisitor],
    });
  }
});