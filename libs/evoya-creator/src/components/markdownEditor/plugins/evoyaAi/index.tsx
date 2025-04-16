import {
  createActiveEditorSubscription$,
  createRootEditorSubscription$,
  realmPlugin,
  currentSelection$,
  getSelectionRectangle,
  getSelectedNode,
  activeEditor$,
  useCellValue,
  withLatestFrom,
  convertSelectionToNode$,
  onWindowChange$,
  readOnly$,
  inFocus$,
  addComposerChild$,
  addLexicalNode$,
  exportMarkdownFromLexical,
  importMarkdownToLexical,
  importMdastTreeToLexical,
  MarkdownParseOptions,
  $createTableNode,
  insertDecoratorNode$,
  insertMarkdown$,

  exportVisitors$,
  jsxComponentDescriptors$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  jsxIsAvailable$,
  importVisitors$,
  mdastExtensions$,
  syntaxExtensions$,
  directiveDescriptors$,
  codeBlockEditorDescriptors$,
  addActivePlugin$,
  addImportVisitor$,
  addExportVisitor$,
  LexicalExportVisitor,
  rootEditor$,
  $isTableNode,
  $isCodeBlockNode,
  $createCodeBlockNode,
} from "@mdxeditor/editor";

import {
  Realm,
  Signal,
  Action,
  Cell,
  useCellValues,
  map,
} from "@mdxeditor/gurx";

import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";

import {
  $wrapNodes,
  $isAtNodeEnd,
  $patchStyleText,
  createDOMRange,
  createRectsFromDOMRange,
} from "@lexical/selection";

import {
  $findTableNode,
  $isTableCellNode,
} from "@lexical/table";

import {
  $isListItemNode,
  $isListNode,
} from "@lexical/list";

import {
  $isHeadingNode,
} from "@lexical/rich-text";

import {
  $wrapSelectionInMarkNode,
  MarkNode,
} from "@lexical/mark";

import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
} from "@lexical/clipboard";

import {
  RangeSelection,
  LexicalEditor,
  createEditor,
  LexicalNode,
  ElementNode,
  DecoratorNode,
  RootNode,
  ParagraphNode,
  TextNode,
  $isTextNode,
  $isParagraphNode,
  $isRangeSelection,
  $isNodeSelection,
  $getRoot,
  $copyNode,
  $createParagraphNode,
  $createTextNode,
  KlassConstructor,
  $setSelection,
  $getSelection,
  $getPreviousSelection,
  $createPoint,
  $createRangeSelection,
  $createNodeSelection,
  $isElementNode,
  $isDecoratorNode,
  SerializedEditor,
  NodeSelection,
  NodeKey,
  $insertNodes,
  $selectAll,
} from "lexical";
import { RefObject } from "react";

import {
  SelectionContext,
  selectionContextDefaultData,
  CodeSelectionContext,
  CreatorMessage,
} from "@/types";

import { TextSelection } from "./TextSelection";

import { tryImportingMarkdown, evoyaImportMarkdownToLexical } from "@/components/markdownEditor/utils/markdown";

import { notInline, notInlineExtended } from "@/components/markdownEditor/utils/selection";

export const evoyaAiState$ = Cell<SelectionContext | null>(selectionContextDefaultData, (r) => {
  // r.sub(evoyaAiState$, console.log);
});
export const scrollOffset$ = Cell<number>(0);
export const editorContainerRef$ = Cell<RefObject<HTMLElement> | null>(null);

export const replaceSelectionContent$ = Signal<{ message: CreatorMessage, context: SelectionContext}>((realm) => {
  realm.sub(realm.pipe(replaceSelectionContent$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
    console.log(value);
    if (value && value.message && value.context) {
      console.log('selection context', value.context);
      const selectionContext = value.context;
      const lexicalSelection = value.context.lexical;
      const markdownMessage = value.message.content;
      const insertType = value.message.insertType;

      // if (!lexicalSelection && selectionContext.selectionType !== 'document') return;

      activeEditor?.update(() => {

        const importPoint = {
          children: [] as LexicalNode[],
          append(node: LexicalNode) {
            this.children.push(node)
          },
          getType() {
            // return lexicalSelection.getNodes()[0].getType();
            return 'importroot';
          }
        }

        // tryImportingMarkdown(realm, importPoint, value.message);
        tryImportingMarkdown(realm, importPoint, markdownMessage);
        console.log('importPoint', importPoint);
        const importChildren = importPoint.children;
        console.log('importChildren', importChildren);
        let newChildren = importChildren;

        if (selectionContext.selectionType === 'codeblock') {
          if ($isCodeBlockNode(importChildren[0])) {
            const codeBlockNode = lexicalSelection.getNodes()[0];
            console.log('code block', codeBlockNode);

            if (selectionContext.selectedCode) {
              const currentCode = codeBlockNode.getCode();
              console.log('currentCode', currentCode);
              console.log('selectedCode', selectionContext.selectedCode);
              console.log(currentCode.indexOf(selectionContext.selectedCode));
              if (currentCode.indexOf(selectionContext.selectedCode) > -1) {
                let newCode = '';
                
                if (insertType === 'after' || insertType === 'before') {
                  const codeSegments = currentCode.split(selectionContext.selectedCode);
                  const newCodeSegment = insertType === 'after' ? selectionContext.selectedCode + importChildren[0].getCode() : importChildren[0].getCode() + selectionContext.selectedCode;
                  newCode = codeSegments.join(newCodeSegment);
                  console.log('newCode', newCode);
                  // codeBlockNode.setCode(newCode);
                } else if (insertType === 'replace') {
                  newCode = currentCode.replace(selectionContext.selectedCode, importChildren[0].getCode());
                  console.log('newCode', newCode);
                  // codeBlockNode.setCode(newCode);
                }

                codeBlockNode.insertAfter($createCodeBlockNode({ code: newCode, language: selectionContext.language, meta: codeBlockNode.getMeta() }));
                codeBlockNode.remove();
              }
            } else {
              if (insertType === 'after' || insertType === 'before') {
                codeBlockNode.insertAfter(importChildren[0]);
              } else if (insertType === 'replace') {
                // codeBlockNode.setCode(importChildren[0].getCode());
                codeBlockNode.insertAfter(importChildren[0]);
                codeBlockNode.remove();
              }
            }
          }

          realm.pub(resetSelection$);
          return;
        }

        // if (selectionContext.insertType === 'after' || selectionContext.insertType === 'before') {
        if (insertType === 'after' || insertType === 'before') {
          if (selectionContext.selectionType === 'document' || selectionContext.selectionType === null) {
            const rootElement = $getRoot();
            const insertAnchor = insertType === 'before' ? rootElement.getFirstChild() : rootElement.getLastChild();

            if (insertType === 'after') {
              newChildren = newChildren.toReversed();
              newChildren.forEach((node) => insertAnchor.insertAfter(node));
            } else {
              newChildren.forEach((node) => insertAnchor.insertBefore(node));
            }
          } else {
            const selectedNodes = lexicalSelection.getNodes();
            // Selection not implemented yet
            if ($isRangeSelection(lexicalSelection)) {
              const lastPoint = lexicalSelection.isBackward() ? lexicalSelection.anchor : lexicalSelection.focus;
              const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
              let insertAnchor = insertType === 'before' ? firstPoint.getNode() : lastPoint.getNode();
              
              if (insertAnchor.getType() === 'text') {
                insertAnchor = insertAnchor.getParent();
              }

              console.log(insertAnchor);

              if (importChildren.length === 1) {
                if ($isListNode(importChildren[0])) {
                  newChildren = importChildren[0].getChildren();
                } else if ($isTableNode(importChildren[0])) {
                  // do i need to handle?
                }
              }

              if (insertType === 'after') {
                newChildren = newChildren.toReversed();
                newChildren.forEach((node) => insertAnchor.insertAfter(node));
              } else {
                newChildren.forEach((node) => insertAnchor.insertBefore(node));
              }
            } else {
              let insertAnchor = selectedNodes[0];

              if (insertType === 'after') {
                newChildren = newChildren.toReversed();
                newChildren.forEach((node) => insertAnchor.insertAfter(node));
              } else {
                newChildren.forEach((node) => insertAnchor.insertBefore(node));
              }
            }
          }
        // } else if (selectionContext.insertType === 'replace') {
        } else if (insertType === 'replace') {
          if (selectionContext.selectionType === null) {
            return;
          } else if (selectionContext.selectionType === 'document') {
            const rootElement = $getRoot();
            rootElement.clear();
            // importMarkdownToLexical({
            evoyaImportMarkdownToLexical({
              root: rootElement,
              visitors: realm.getValue(importVisitors$),
              mdastExtensions: realm.getValue(mdastExtensions$),
              markdown: markdownMessage,
              syntaxExtensions: realm.getValue(syntaxExtensions$),
              jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
              directiveDescriptors: realm.getValue(directiveDescriptors$),
              codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
            });
          } else {
            const selectedNodes = lexicalSelection.getNodes();
            console.log('selectedNodes', selectedNodes);
            if ($isRangeSelection(lexicalSelection)) {
              const lastPoint = lexicalSelection.isBackward() ? lexicalSelection.anchor : lexicalSelection.focus;
              const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
              
              if (selectedNodes.every((sn: LexicalNode) => sn.getType() === 'text')) {
                let insertAnchor = lastPoint.getNode();

                if (importChildren.length === 1) {
                  if ($isListNode(importChildren[0])) {
                    insertAnchor = insertAnchor.getParent();
                    newChildren = importChildren[0].getChildren();
                  } else if ($isParagraphNode(importChildren[0]) || $isHeadingNode(importChildren[0])) {
                    newChildren = importChildren[0].getChildren();
                  } else if ($isTableNode(importChildren[0])) {
                    // do i need to handle?
                  }
                } else {
                  insertAnchor = insertAnchor.getParent();
                }

                console.log('before insert nodes 1', newChildren, insertAnchor);

                // selectedNodes.forEach((node) => node.remove());
                if (notInline(insertAnchor) && insertAnchor.getChildren().length === 0) {
                  newChildren.toReversed().forEach((node) => insertAnchor.insertAfter(node));
                  insertAnchor.remove();
                } else {
                  // lexicalSelection.removeText();
                  lexicalSelection.insertNodes(newChildren);
                }
              } else {
                let insertAnchor = lastPoint.getNode().getParent();

                if (importChildren.length === 1) {
                  if ($isListNode(importChildren[0])) {
                    newChildren = importChildren[0].getChildren();
                  } else if ($isTableNode(importChildren[0])) {
                    // do i need to handle?
                  }
                }

                console.log('before insert nodes 2', newChildren, insertAnchor);

                newChildren.toReversed().forEach((node) => insertAnchor.insertAfter(node));
                selectedNodes.forEach((node) => node.remove());
              }
            } else {
              // lexicalSelection.insertNodes(paragraph.getChildren());
              if (importChildren.every((sn: LexicalNode) => sn.getType() === 'text')) {
                // lexicalSelection.insertNodes(importChildren);
              } else {
                if (selectedNodes.length === 1) {
                  if ($isParagraphNode(selectedNodes[0]) || $isHeadingNode(selectedNodes[0])) {
                    // importChildren.toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                  } else if ($isListItemNode(selectedNodes[0])) {
                    console.log('insert list item', importChildren[0].getChildren());
                    // importChildren[0].getChildren().toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                    newChildren = importChildren[0].getChildren();
                  } else if ($isTableCellNode(selectedNodes[0])) {
                    // do i need to handle?
                  } else if ($isTableNode(selectedNodes[0])) {
                    // importChildren.toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                  } else {
                    // no use case yet
                  }
                  newChildren.toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                  selectedNodes[0].remove();
                } else {
                  // no use case yet
                }
              }
            }
          }
        }


        // reset selection
        // const selectionContext = {
        //   lexical: null,
        //   markdown: null,
        //   selectionType: null,
        //   insertType: null
        // };

        // realm.pub(evoyaAiState$, selectionContext);
        // realm.pub(resetSelection$);

          // select inserted children (didnt work)
        if (newChildren.length > 0) {
          if (insertType === 'replace' && selectionContext.selectionType === 'document') {
            // $selectAll();
            realm.pub(selectDocument$);
          } else {
            console.log('select new content', newChildren);
            const newSelection = $createRangeSelection();
            // const selectionStartNode = $isTextNode(newChildren[0]) ? newChildren[0] : newChildren[0].getFirstDescendant();
            if ($isTableNode(newChildren[0])) {
              realm.pub(setNodeSelection$, newChildren[0]);
            } else {
              const selectionStartNode = $isTextNode(newChildren[0]) ? newChildren[0] : newChildren[0].getFirstDescendant();
              const selectionEndNode = $isTextNode(newChildren[newChildren.length - 1]) ? newChildren[newChildren.length - 1] : newChildren[newChildren.length - 1].getLastDescendant();
              newSelection.setTextNodeRange(selectionStartNode, 0, selectionEndNode, selectionEndNode.getTextContent().length);
              console.log(newSelection);
              $setSelection(newSelection);
            }
          }

          // const textNodes = importPoint

          // newSelection.setTextNodeRange();
          // $setSelection(newSelection);
          // newChildren.forEach((node) => node.select());
          // console.log(newSelection);

          // const insertedContentSelection = $createNodeSelection();
          // newChildren.forEach((node) => insertedContentSelection.add(node.getKey()));
          // $setSelection(insertedContentSelection);
          // $wrapSelectionInMarkNode(newSelection, false, 'evoyainsert');
        }
      });
    }
  });
});
/*export const replaceSelectionContent$ = Signal<{ message: string, context: SelectionContext}>((realm) => {
  realm.sub(realm.pipe(replaceSelectionContent$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
    console.log(value);
    if (value && value.message && value.context) {
      activeEditor?.update(() => {
        console.log('selection context', value.context);
        const selectionContext = value.context;
        const lexicalSelection = value.context.lexical;

        if (!lexicalSelection) return;

        const importPoint = {
          children: [] as LexicalNode[],
          append(node: LexicalNode) {
            this.children.push(node)
          },
          getType() {
            // return lexicalSelection.getNodes()[0].getType();
            return 'importroot';
          }
        }

        tryImportingMarkdown(realm, importPoint, value.message);
        console.log('importPoint', importPoint);
        const importChildren = importPoint.children;
        console.log('importChildren', importChildren);

        if (selectionContext.insertType === 'after' || selectionContext.insertType === 'before') {
          // Selection not implemented yet
          if ($isRangeSelection(lexicalSelection)) {
            const lastPoint = lexicalSelection.isBackward() ? lexicalSelection.anchor : lexicalSelection.focus;
            const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
            let targetNode = selectionContext.insertType === 'before' ? firstPoint.getNode() : lastPoint.getNode();
            
            if (targetNode.getType() === 'text') {
              targetNode = targetNode.getParent();
            }

            console.log(targetNode)

            // parapgraphChildren.forEach((child) => {
            //   if (selectionContext.insertType === 'before') {
            //     targetNode.insertBefore(child, false);
            //   } else {
            //     targetNode.insertAfter(child, false);
            //   }
            // });
          } else {
            const targetNode = lexicalSelection.getNodes()[0];

            console.log(targetNode)

            // parapgraphChildren.forEach((child) => {
            //   if (selectionContext.insertType === 'before') {
            //     targetNode.insertBefore(child, false);
            //   } else {
            //     targetNode.insertAfter(child, false);
            //   }
            // });
          }
        } else if (selectionContext.insertType === 'replace') {
          if (selectionContext.selectionType === 'document') {
            const rootElement = $getRoot();
            rootElement.clear();
            // importMarkdownToLexical({
            evoyaImportMarkdownToLexical({
              root: rootElement,
              visitors: realm.getValue(importVisitors$),
              mdastExtensions: realm.getValue(mdastExtensions$),
              markdown: value.message,
              syntaxExtensions: realm.getValue(syntaxExtensions$),
              jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
              directiveDescriptors: realm.getValue(directiveDescriptors$),
              codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
            });
          } else {
            const selectedNodes = lexicalSelection.getNodes();
            console.log('selectedNodes', selectedNodes);
            if ($isRangeSelection(lexicalSelection)) {
              const lastPoint = lexicalSelection.isBackward() ? lexicalSelection.anchor : lexicalSelection.focus;
              const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
              
              if (selectedNodes.every((sn: LexicalNode) => sn.getType() === 'text')) {
                let insertAnchor = lastPoint.getNode();
                let newChildren = importChildren;

                if (importChildren.length === 1) {
                  if ($isListNode(importChildren[0])) {
                    insertAnchor = insertAnchor.getParent();
                    newChildren = importChildren[0].getChildren();
                  } else if ($isParagraphNode(importChildren[0]) || $isHeadingNode(importChildren[0])) {
                    newChildren = importChildren[0].getChildren();
                  } else if ($isTableNode(importChildren[0])) {
                    // do i need to handle?
                  }
                } else {
                  insertAnchor = insertAnchor.getParent();
                }

                console.log('before insert nodes 1', newChildren, insertAnchor);

                newChildren.forEach((node) => insertAnchor.insertAfter(node));
                selectedNodes.forEach((node) => node.remove());
              } else {
                let insertAnchor = lastPoint.getNode().getParent();
                let newChildren = importChildren;

                if (importChildren.length === 1) {
                  if ($isListNode(importChildren[0])) {
                    newChildren = importChildren[0].getChildren();
                  } else if ($isTableNode(importChildren[0])) {
                    // do i need to handle?
                  }
                }

                console.log('before insert nodes 2', newChildren, insertAnchor);

                newChildren.toReversed().forEach((node) => insertAnchor.insertAfter(node));
                selectedNodes.forEach((node) => node.remove());
              }
            } else {
              // lexicalSelection.insertNodes(paragraph.getChildren());
              if (importChildren.every((sn: LexicalNode) => sn.getType() === 'text')) {
                // lexicalSelection.insertNodes(importChildren);
              } else {
                if (selectedNodes.length === 1) {
                  if ($isParagraphNode(selectedNodes[0]) || $isHeadingNode(selectedNodes[0])) {
                    importChildren.toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                    selectedNodes[0].remove();
                  } else if ($isListItemNode(selectedNodes[0])) {
                    console.log('insert list item', importChildren[0].getChildren());
                    importChildren[0].getChildren().toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                    selectedNodes[0].remove();
                  } else if ($isTableCellNode(selectedNodes[0])) {
                    // do i need to handle?
                  } else if ($isTableNode(selectedNodes[0])) {
                    importChildren.toReversed().forEach((node) => selectedNodes[0].insertAfter(node));
                    selectedNodes[0].remove();
                  } else {
                    // no use case yet
                  }
                } else {
                  // no use case yet
                }
              }
            }
          }
        }
      });
    }
  });
});*/

type EvoyaAiPluginParams = {
  containerRef: RefObject<HTMLElement>;
  creatorType: string;
  setRealm: (realm: Realm) => void;
  setSelectionContext: (context: SelectionContext | null) => void;
}

export const setNodeSelection$ = Signal<any>((r) => {});
export const setNodeSelectionByKey$ = Signal<any>((r) => {});
export const setCodeSelection$ = Signal<any>((r) => {});
export const resetSelection$ = Action((r) => {});
export const selectDocument$ = Action((r) => {});
export const creatorType$ = Cell<string>('', (r) => {});
// export const evoyaAiParams$ = Cell<EvoyaAiPluginParams | null>(null, (r) => {});

export const evoyaAiPlugin = realmPlugin<EvoyaAiPluginParams>({
  init: (realm, params) => {
    if (params?.setRealm) {
      params.setRealm(realm);
    }
    realm.sub(realm.pipe(selectDocument$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
      // activeEditor?.update(() => {
      //   $selectAll();
      // });
      const selectionContext = {
        lexical: null,
        markdown: null,
        selectionType: 'document' as 'document',
        insertType: 'replace' as 'replace',
      };
      
      if (params?.setSelectionContext) {
        params.setSelectionContext(selectionContext);
      }

      realm.pub(evoyaAiState$, selectionContext);
    });  

    // const updateScrollOffset = () => {
    //   console.log(params?.containerRef?.current?.scrollTop);
    //   realm.pub(scrollOffset$, params?.containerRef?.current?.scrollTop)
    // }

    // window.addEventListener('resize', updateScrollOffset)
    // window.addEventListener('scroll', updateScrollOffset)

    realm.pubIn({
      [addActivePlugin$]: 'evoyaAi',
      [creatorType$]: params?.creatorType,
      [editorContainerRef$]: params?.containerRef,
      // [evoyaAiParams$]: params,
      // [addImportVisitor$]: MdastHeadingVisitor,
      // [addLexicalNode$]: SelectionPlaceholderNode,
      [addLexicalNode$]: MarkNode,
      // [addExportVisitor$]: LexicalSelectionVisitor,
    });
    // realm.pub(editorContainerRef$, params?.containerRef);
    realm.pub(addComposerChild$, TextSelection);
    realm.pub(replaceSelectionContent$, null);
    // realm.pub(addLexicalNode$, SelectionPlaceholderNode);
    realm.sub(resetSelection$, () => {
      const selectionContext = {
        lexical: null,
        markdown: null,
        selectionType: null,
        insertType: null
      };
      if (params?.setSelectionContext) {
        params.setSelectionContext(selectionContext);
      }
      realm.pub(evoyaAiState$, selectionContext);
    });
    realm.sub(realm.pipe(realm.combine(currentSelection$, onWindowChange$), withLatestFrom(activeEditor$, readOnly$, inFocus$)), ([[selection], activeEditor, readOnly, inFocus]) => {
      const nodeToMarkdown = (node: ElementNode) => {
        return exportMarkdownFromLexical({
          root: node,
          visitors: realm.getValue(exportVisitors$),
          jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
          toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
          toMarkdownOptions: realm.getValue(toMarkdownOptions$),
          jsxIsAvailable: realm.getValue(jsxIsAvailable$)
        });
      };

      if (activeEditor && selection && !readOnly && inFocus) {
        if ($isRangeSelection(selection)) {
          const startPoint = selection.isBackward() ? selection.focus : selection.anchor;
          const endPoint = !selection.isBackward() ? selection.focus : selection.anchor;
          const domRange = createDOMRange(activeEditor, startPoint.getNode(), startPoint.offset, endPoint.getNode(), endPoint.offset);
          console.log(domRange);
          const rects = createRectsFromDOMRange(activeEditor, domRange);
          console.log(rects);
          let scrollOffset = 0;
          if (params?.containerRef?.current) {
            scrollOffset = params?.containerRef.current.scrollTop;
          }
          
          const startEnd = selection.getStartEndPoints();
          const restoredSelection = $createRangeSelection();
          const startOffset = startEnd[0].offset;
          const endOffset = startEnd[1].offset;
          restoredSelection.anchor.set(startEnd[0].key, startOffset, 'text');
          restoredSelection.focus.set(startEnd[1].key, endOffset, 'text');
          console.log(restoredSelection);

          if (selection.anchor.is(selection.focus)) {
            const selectionContext = {
              lexical: null,
              markdown: null,
              selectionType: null,
              insertType: null
            };
            
            if (params?.setSelectionContext) {
              params.setSelectionContext(selectionContext);
            }

            realm.pub(evoyaAiState$, selectionContext);
            /*if ($isAtNodeEnd(selection.anchor)) {
              // const selectionContext = {
              //   lexical: restoredSelection,
              //   markdown: null,
              //   selectionType: 'caret' as 'caret',
              //   insertType: 'after' as 'after',
              // };
              const selectionContext = {
                lexical: restoredSelection,
                markdown: null,
                selectionType: 'document' as 'document',
                insertType: 'replace' as 'replace',
              };
              
              if (params?.setSelectionContext) {
                params.setSelectionContext(selectionContext);
              }

              realm.pub(evoyaAiState$, selectionContext);
            } else {
              const anchorNode = selection.anchor.getNode();
              const anchorNodeParent = anchorNode.getParent();
              const nodeSelection = $createNodeSelection();

              if (anchorNode.getType() === 'text' && anchorNodeParent && anchorNodeParent.getType() !== 'root') {
                const domElement = activeEditor.getElementByKey(anchorNodeParent.getKey());
                let newRect;
                if (domElement) {
                  newRect = domElement.getBoundingClientRect();
                }
                console.log(newRect);

                nodeSelection.add(anchorNodeParent.__key);

                const selectionContext = {
                  lexical: nodeSelection,
                  markdown: nodeToMarkdown(anchorNodeParent),
                  selectionType: 'node' as 'node',
                  insertType: 'replace' as 'replace',
                  rect: newRect,
                  scrollOffset
                };
                
                if (params?.setSelectionContext) {
                  params.setSelectionContext(selectionContext);
                }

                realm.pub(evoyaAiState$, selectionContext);
              } else {
                const domElement = activeEditor.getElementByKey(anchorNode.getKey());
                let newRect;
                if (domElement) {
                  newRect = domElement.getBoundingClientRect()
                }
                console.log(newRect);
                
                nodeSelection.add(anchorNode.__key);

                const selectionContext = {
                  lexical: nodeSelection,
                  markdown: nodeToMarkdown(anchorNode),
                  selectionType: 'node' as 'node',
                  insertType: 'replace' as 'replace',
                  rect: newRect,
                  scrollOffset
                };
                
                if (params?.setSelectionContext) {
                  params.setSelectionContext(selectionContext);
                }

                realm.pub(evoyaAiState$, selectionContext);
              }
            }*/
          } else {
            const selectedNodes = selection.getNodes();
            console.log(selection);
            console.log(selectedNodes);

            if (selectedNodes.length > 0) {
              const anchorParent = selectedNodes[0].getParent();
              const anchorParentKey = selectedNodes[0].getParent().getKey();
              console.log(selectedNodes[0].getParent());

              if (selectedNodes.every((sn: LexicalNode) => sn.getType() === 'text' && sn.__parent === anchorParentKey)) {
                if (anchorParent?.getType() === 'listitem' && startPoint.offset === 0 && $isAtNodeEnd(endPoint)) {
                  const selMd = nodeToMarkdown(anchorParent);
                  console.log(selMd);

                  const selectionContext = {
                    lexical: restoredSelection,
                    markdown: selMd,
                    selectionType: 'range' as 'range',
                    insertType: 'replace' as 'replace',
                    rectangles: rects,
                    scrollOffset
                  };
                  
                  if (params?.setSelectionContext) {
                    params.setSelectionContext(selectionContext);
                  }

                  realm.pub(evoyaAiState$, selectionContext);
                } else {
                  // activeEditor.update(() => {
                    // const extractedSelectionNodes = selection.extract();
                    // const extractedSelectionNodes = restoredSelection.extract();
                    const selMd = restoredSelection.getTextContent();


                    // const extractedNodes = extractedSelectionNodes.map(en => {
                    //   const newTextNode = new TextNode(en.__text);
                    //   newTextNode.__style = en.__style;
                    //   newTextNode.__format = en.__format;
                    //   return newTextNode;
                    // });
                    // const elemNode = new ParagraphNode();
                    // elemNode.append(...extractedNodes);
                    // const selMd = nodeToMarkdown(elemNode);
                    // console.log(selMd);

                    // const el = $createParagraphNode();
                    // el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                    // const selMd = nodeToMarkdown(el);
                    // const selMd = $convertToMarkdownString(TRANSFORMERS, el);;
                    // const selMd = exportMarkdownFromLexical({
                    //   root: el,
                    //   visitors: realm.getValue(exportVisitors$),
                    //   jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
                    //   toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
                    //   toMarkdownOptions: realm.getValue(toMarkdownOptions$),
                    //   jsxIsAvailable: realm.getValue(jsxIsAvailable$)
                    // });
                    
                    // const selMd = selectedNodes.map((textNode) => nodeToMarkdown(textNode)).join('');

                    // console.log(selMd);

                    const selectionContext = {
                      lexical: restoredSelection,
                      markdown: selMd,
                      selectionType: 'range' as 'range',
                      insertType: 'replace' as 'replace',
                      rectangles: rects,
                      scrollOffset
                    };
                    
                    if (params?.setSelectionContext) {
                      params.setSelectionContext(selectionContext);
                    }

                    realm.pub(evoyaAiState$, selectionContext);
                  // });
                }
              } else if (selectedNodes.length === 1) {
                const selMd = nodeToMarkdown(selectedNodes[0]);
                console.log(selMd);

                const selectionContext = {
                  lexical: restoredSelection,
                  markdown: selMd,
                  selectionType: 'range' as 'range',
                  insertType: 'replace' as 'replace',
                  rectangles: rects,
                  scrollOffset
                };
                
                if (params?.setSelectionContext) {
                  params.setSelectionContext(selectionContext);
                }

                realm.pub(evoyaAiState$, selectionContext);
              } else {
                /*const exportPoint = {
                  __key: 'root',
                  __type: 'root',
                  children: [] as LexicalNode[],
                  append(node: LexicalNode) {
                    this.children.push(node)
                  },
                  getType() {
                    // return lexicalSelection.getNodes()[0].getType();
                    return 'root';
                  }
                }*/
                const extractedSelectionNodes = selection.extract();
                console.log(extractedSelectionNodes);
                console.log(selection.getNodes());
                let nodeFilter = notInline;
                if (selectedNodes.some($isListItemNode)) {
                  nodeFilter = notInlineExtended;
                }
                const filteredNodes = selectedNodes.filter(nodeFilter);
                const selMd = filteredNodes.map((node) => nodeToMarkdown(node)).join('');
                console.log(selMd);
                // const newRects = filteredNodes.map((node) => {
                //   const domElement = activeEditor.getElementByKey(node.getKey());
                //   let newRect;
                //   if (domElement) {
                //     newRect = domElement.getBoundingClientRect()
                //   }
                //   return newRect;
                // });
                const newRects = filteredNodes
                  .map((node) => activeEditor.getElementByKey(node.getKey()))
                  .filter((domElement) => !!domElement)
                  .map((domElement) => domElement.getBoundingClientRect());

                const selectionContext = {
                  lexical: restoredSelection,
                  markdown: selMd,
                  selectionType: 'range' as const,
                  insertType: 'replace' as const,
                  rectangles: newRects,
                  scrollOffset
                };
                
                if (params?.setSelectionContext) {
                  params.setSelectionContext(selectionContext);
                }

                realm.pub(evoyaAiState$, selectionContext);


                // exportPoint.children = 

                // el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                // $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, selection).nodes).forEach((node) => exportPoint.append(node));
                // const el = new RootNode();
                // el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                /*activeEditor.update(() => {
                  // const el = new RootNode();
                  // el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                  // const selMd = nodeToMarkdown(el);
                  // console.log(selMd);
                  const exportNodes = $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, selection).nodes);
                  console.log(exportNodes);
                  const selMd = exportNodes.map((node) => nodeToMarkdown(node)).join('');
                  // const selMd = nodeToMarkdown(exportPoint);
                  console.log(selMd);
                  // console.log($generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, selection).nodes));

                  const selectionContext = {
                    lexical: restoredSelection,
                    markdown: selMd,
                    selectionType: 'range' as 'range',
                    insertType: 'replace' as 'replace',
                    rectangles: rects,
                    scrollOffset
                  };
                  
                  if (params?.setSelectionContext) {
                    params.setSelectionContext(selectionContext);
                  }

                  realm.pub(evoyaAiState$, selectionContext);
                });*/
                // exportPoint.children = $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes);
                // const selMd = nodeToMarkdown(exportPoint);
                // console.log(selMd);

                /*const lexicalTypes = ['text', 'paragraph', 'heading', 'listitem', 'list', 'table', 'image', 'math', 'inlineMath'];
                if (selectedNodes.every((sn: LexicalNode) => lexicalTypes.includes(sn.getType()))) {
                  activeEditor.update(() => {
                    const el = $createParagraphNode();
                    el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                    const selMd = nodeToMarkdown(el);
                    console.log(selMd);

                    const selectionContext = {
                      lexical: restoredSelection,
                      markdown: selMd,
                      selectionType: 'range' as 'range',
                      insertType: 'replace' as 'replace',
                      rectangles: rects,
                      scrollOffset
                    };
                    
                    if (params?.setSelectionContext) {
                      params.setSelectionContext(selectionContext);
                    }

                    realm.pub(evoyaAiState$, selectionContext);
                  });
                } else if (selectedNodes.some((sn: LexicalNode) => ['listitem', 'list'].includes(sn.getType()))) {
                  // handle list selection ???
                }*/
              }
            }
          }
        } else {
          console.log('unhandled selection');
        }
      }
    });
    realm.sub(realm.pipe(setNodeSelectionByKey$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      rootEditor?.update(() => {
        const selection = $createNodeSelection();
        selection.add(value);
        realm.pub(setNodeSelection$, selection.getNodes()[0]);
      });
    });
    realm.sub(realm.pipe(setNodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      const selection = $createNodeSelection();
      selection.add(value.__key);

      const selMd = exportMarkdownFromLexical({
        root: value,
        visitors: realm.getValue(exportVisitors$),
        jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
        toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
        toMarkdownOptions: realm.getValue(toMarkdownOptions$),
        jsxIsAvailable: realm.getValue(jsxIsAvailable$)
      });
      console.log(selMd);

      let scrollOffset = 0;
      if (params?.containerRef?.current) {
        scrollOffset = params?.containerRef.current.scrollTop;
      }
      
      rootEditor?.update(() => {
        const domElement = rootEditor.getElementByKey(value.getKey());
        let newRect;
        if (domElement) {
          newRect = domElement.getBoundingClientRect()
        }
        console.log(newRect);

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
  
        realm.pubIn({
          [evoyaAiState$]: selectionContext,
          [inFocus$]: false
        });
      });
    });
    realm.sub(realm.pipe(setCodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      // rootEditor?.update(() => {
        const selection = $createNodeSelection();
        selection.add(value.nodeKey);

        const selectionContext = {
          lexical: selection,
          markdown: null,
          selectionType: 'codeblock' as 'codeblock',
          insertType: 'replace' as 'replace',
          code: value.code,
          selectedCode: value.selection,
          language: value.language,
        };
        // const selectionContext = {
        //   lexical: selection,
        //   code: value.code,
        //   selectedCode: value.selection
        // };
        
        if (params?.setSelectionContext) {
          params.setSelectionContext(selectionContext);
        }

        realm.pub(evoyaAiState$, selectionContext);
      // });
    });
  },
  update(realm, params) {
    realm.pub(editorContainerRef$, params?.containerRef);
  }
});