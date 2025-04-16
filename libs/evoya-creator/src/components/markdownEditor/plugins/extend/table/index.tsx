import {
  realmPlugin,
  addLexicalNode$,
  addExportVisitor$,
  addToMarkdownExtension$,
  addImportVisitor$,
  addSyntaxExtension$,
  addMdastExtension$,
  MdastImportVisitor,
  withLatestFrom,
  rootEditor$,
  getSelectionRectangle,

  exportMarkdownFromLexical,
  exportVisitors$,
  jsxComponentDescriptors$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  jsxIsAvailable$,
  activeEditor$,
  inFocus$,
} from "@mdxeditor/editor";

import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";

import {
  Realm,
  Signal,
  Cell,
  useCellValues,
  map,
} from "@mdxeditor/gurx";

import React, { Ref } from 'react';

import {
  DecoratorNode,
  LexicalEditor,
  LexicalNode,
  ElementNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $createNodeSelection,
  $createParagraphNode,
  $setSelection,
} from 'lexical';

import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
} from "@lexical/clipboard";

import * as Mdast from 'mdast';

import { gfmTableFromMarkdown, gfmTableToMarkdown, Options as GfmTableOptions } from 'mdast-util-gfm-table';
import { gfmTable } from 'micromark-extension-gfm-table';

// import { MdastTableVisitor } from "@mdxeditor/editor/dist/plugins/table/MdastTableVisitor.js";
import { TableNode as TableNodeSource, SerializedTableNode  } from "@mdxeditor/editor/dist/plugins/table/TableNode.js";
// import { TableEditor as TableEditorSource} from "@mdxeditor/editor/dist/plugins/table/TableEditor.js";
import { LexicalTableVisitor } from "@mdxeditor/editor/dist/plugins/table/LexicalTableVisitor.js";

import { TableEditor } from "./TableEditor";

// import {
//   SelectionContext,
//   evoyaAiState$,
// } from '../../evoyaAiPlugin';

import {
  SelectionContext,
} from '@/types';
import {
  evoyaAiState$,
} from '../../evoyaAi';

// const TableEditor = (props) => {
//   console.log("fewgreqgrheqrqehhqqtehntqnh")
//   return <TableEditorSource {...props} />
// }

export const MdastTableVisitor: MdastImportVisitor<Mdast.Table> = {
  testNode: 'table',
  visitNode({ mdastNode, lexicalParent }) {
    ;(lexicalParent as ElementNode).append($createTableNode(mdastNode))
  }
}

export function $createTableNode(mdastNode: Mdast.Table): TableNode {
  return new TableNode(mdastNode)
}

class TableNode extends TableNodeSource {
  constructor(mdastNode?: Mdast.Table, key?: NodeKey) {
    super(mdastNode, key);
  }
  
  decorate(parentEditor: LexicalEditor): JSX.Element {
    console.log("oh wefweqgqweg")
    return <TableEditor lexicalTable={this} mdastNode={this.__mdastNode} parentEditor={parentEditor} />
  }

  static clone(node: TableNode): TableNode {
    return new TableNode(structuredClone(node.__mdastNode), node.__key)
  }

  static importJSON(serializedNode: SerializedTableNode): TableNode {
    return $createTableNode(serializedNode.mdastNode)
  }
}

// export const setNodeSelection$ = Signal<any>((r) => {});

type EvoyaGfmTableOptions = GfmTableOptions & {
  // setNodeSelection: (node: any, md: string) => void;
  containerRef: Ref<HTMLElement>;
  setSelectionContext: (context: SelectionContext) => void;
}

export const tablePlugin = realmPlugin<EvoyaGfmTableOptions>({
  init(realm, params) {
    realm.pubIn({
      // import
      [addMdastExtension$]: gfmTableFromMarkdown(),
      [addSyntaxExtension$]: gfmTable(),
      [addImportVisitor$]: MdastTableVisitor,
      // export
      [addLexicalNode$]: TableNode,
      [addExportVisitor$]: LexicalTableVisitor,
      [addToMarkdownExtension$]: gfmTableToMarkdown({
        tableCellPadding: params?.tableCellPadding ?? true,
        tablePipeAlign: params?.tablePipeAlign ?? true
      })
    });
    /*realm.sub(realm.pipe(setNodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      const selection = $createNodeSelection();
      selection.add(value.__key);
      // const selMd = $convertToMarkdownString(TRANSFORMERS, value);
      // console.log(selMd);
      // rootEditor.update(() => {
      //   const el = $createParagraphNode();
      //   el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(rootEditor, selection).nodes));
      //   const output = $convertToMarkdownString(TRANSFORMERS, el);
      //   console.log(output);

      //   if (params?.setNodeSelection) {
      //     params.setNodeSelection(selection, output);
      //   }
      // });

      const selMd = exportMarkdownFromLexical({
        root: value,
        visitors: realm.getValue(exportVisitors$),
        jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
        toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
        toMarkdownOptions: realm.getValue(toMarkdownOptions$),
        jsxIsAvailable: realm.getValue(jsxIsAvailable$)
      });
      console.log(selMd);
      // if (params?.setNodeSelection) {
      //   params.setNodeSelection(selection, selMd);
      // }

      let scrollOffset = 0;
      if (params?.containerRef?.current) {
        scrollOffset = params?.containerRef.current.scrollTop;
      }
      // const domElement = value.exportDOM(rootEditor);
      // console.log(domElement.element);
      // let newRect;
      // if (domElement.element) {
      //   newRect = domElement.element.getBoundingClientRect()
      // }
      // console.log(newRect);
      
      rootEditor?.update(() => {
        // $setSelection(selection);
        // const newRect = getSelectionRectangle(activeEditor);
        const domElement = rootEditor.getElementByKey(value.getKey());
        // rootEditor.blur();
        let newRect;
        if (domElement) {
          newRect = domElement.getBoundingClientRect()
        }
        console.log(newRect)

        const selectionContext = {
          lexical: selection,
          markdown: selMd,
          selectionType: 'node' as 'node',
          insertType: 'replace' as 'replace',
          rect: newRect,
          scrollOffset
        };
        
        if (params?.setSelectionContext) {
          params.setSelectionContext(selectionContext);
        }
  
        // realm.pub(evoyaAiState$, selectionContext);
        // realm.pub(inFocus$, false);
        realm.pubIn({
          [evoyaAiState$]: selectionContext,
          [inFocus$]: false
        });

        // rootEditor.focus(() => {
        //   if (params?.setSelectionContext) {
        //     params.setSelectionContext(selectionContext);
        //   }
        //   realm.pub(evoyaAiState$, selectionContext);
        // });
      });
    });*/
  }
})