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
} from "@mdxeditor/editor";

import * as Mdast from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown';

import {
  Realm,
  Signal,
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
} from "lexical";
import { Ref, useEffect, useState } from "react";

export const TextSelection = () => {
  const [
    evoyaAiState,
    scrollOffset,
    editorContainerRef,
    isFocus,
  ] = useCellValues(
    evoyaAiState$,
    scrollOffset$,
    editorContainerRef$,
    inFocus$,
  );
  const [scrollComp, setScrollComp] = useState(0);

  useEffect(() => {
    console.log(editorContainerRef);
    if (editorContainerRef) {
      const updateScrollOffset = () => {
        if (editorContainerRef) {
          console.log(editorContainerRef.current?.scrollTop);
          // realm.pub(scrollOffset$, editorContainerRef.current?.scrollTop);
          setScrollComp(editorContainerRef.current?.scrollTop ?? 0);
        }
      }

      window.addEventListener('resize', updateScrollOffset, true);
      window.addEventListener('scroll', updateScrollOffset, true);
    }
  }, []);

  console.log('evoyaAiState', evoyaAiState);
  console.log('isFocus', isFocus);
  if (isFocus) return null;
  if (!evoyaAiState) return null;

  const rectCompensation = 3.5;
  // const scrollCompensation = (evoyaAiState.scrollOffset ?? 0) - scrollOffset;
  const scrollCompensation = (evoyaAiState.scrollOffset ?? 0) - scrollComp;
  const theRect = evoyaAiState.rect;

  return (
    <>
      {/* {(evoyaAiState.rectangles ?? []).map((rect) => (
        <div
          style={{
            position: 'fixed',
            backgroundColor: 'red',
            zIndex: '-1',
            top: `${rect?.top ?? 0}px`,
            left: `${rect?.left ?? 0}px`,
            width: `${rect?.width ?? 0}px`,
            height: `${rect?.height ?? 0}px`
          }}
        ></div>
      ))} */}
      {(evoyaAiState.rectangles ?? []).map((rect) => (
        <div
          style={{
            position: 'fixed',
            backgroundColor: 'highlight',
            zIndex: '-1',
            top: `${(rect?.top ?? 0) - rectCompensation + scrollCompensation}px`,
            left: `${rect?.left ?? 0}px`,
            width: `${rect?.width ?? 0}px`,
            height: `${(rect?.height ?? 0) + rectCompensation * 2}px`
          }}
        ></div>
      ))}
      {theRect && (
        <div
        style={{
          position: 'fixed',
          backgroundColor: 'highlight',
          zIndex: '-1',
          top: `${(theRect?.top ?? 0) + scrollCompensation}px`,
          left: `${theRect?.left ?? 0}px`,
          width: `${theRect?.width ?? 0}px`,
          height: `${theRect?.height ?? 0}px`
        }}
        ></div>
      )}
    </>
  )
}

// class SelectionPlaceholderNode extends DecoratorNode<JSX.Element> {
class SelectionPlaceholderNode extends ElementNode {
  // ['constructor']!: KlassConstructor<typeof SelectionPlaceholderNode>;

  constructor(key?: NodeKey) {
    super(key);
    this.__style = 'background-color: #ff0000;';
  }

  // decorate(): JSX.Element {
  //   console.log(arguments);
  //   return <div>testtttt</div>
  // }

  createDOM(): HTMLElement {
    const newDiv = document.createElement('div');
    newDiv.style.backgroundColor = "#ff0000";
    return newDiv;
  }

  static getType(): string {
    return 'selectionp';
  }
}

export const LexicalSelectionVisitor: LexicalExportVisitor<SelectionPlaceholderNode, Mdast.Paragraph> = {
  testLexicalNode: (node: LexicalNode) => node.getType() === 'selectionp',
  visitLexicalNode: ({ actions, mdastParent, lexicalNode }) => {
    // actions.addAndStepInto('paragraph')
    actions.visitChildren(lexicalNode, mdastParent);
  }
}

export type SelectionContext = {
  lexical: RangeSelection | NodeSelection | null;
  markdown: string | null;
  selectionType: 'range' | 'node' | 'caret' | 'document' | null;
  insertType: 'after' | 'before' | 'replace' | null;
  rectangles?: Array<DOMRect>;
  rect?: any;
  scrollOffset?: number;
}

const defaultData: SelectionContext = {
  lexical: null,
  markdown: null,
  selectionType: null,
  insertType: null
}

export const highlightSelectionContent$ = Signal<SelectionContext>((realm) => {
  realm.sub(realm.pipe(highlightSelectionContent$, withLatestFrom(activeEditor$)), ([selectionContext, activeEditor]) => {
    console.log(selectionContext);
    if (selectionContext.lexical && $isRangeSelection(selectionContext.lexical)) {
      activeEditor?.update(() => {
        // selectionContext.lexical?.setStyle('background-color: #ff0000');
        // $wrapNodes(selectionContext.lexical, () => new SelectionPlaceholderNode());
        // $wrapNodes(selectionContext.lexical, () => {
        //     const elementNode = new ElementNode();
        //     elementNode.setStyle('background-color: #ff0000');
        //     return elementNode;
        // });
        // const startPoint = selectionContext.lexical.isBackward() ? selectionContext.lexical.focus : selectionContext.lexical.anchor;
        // const endPoint = !selectionContext.lexical.isBackward() ? selectionContext.lexical.focus : selectionContext.lexical.anchor;
        // const domRange = createDOMRange(activeEditor, startPoint.getNode(), startPoint.offset, endPoint.getNode(), endPoint.offset);
        // console.log(domRange);
        // const rects = createRectsFromDOMRange(activeEditor, domRange);
        // console.log(rects);
        // realm.pub(evoyaAiState$, {...selectionContext, rectangles: rects, rect: getSelectionRectangle(activeEditor)});
      });
    }
  });
});

/*export type RectData = Pick<DOMRect, 'height' | 'width' | 'top' | 'left'>

export interface EvoyaAIData {
  selection: any;
  selectedNode: any;
  rectangle: RectData;
}

const defaultData: EvoyaAIData = {
  selection: null,
  selectedNode: null,
  rectangle: {top: 0, left: 0, width: 0, height: 0},
}*/

export const evoyaAiState$ = Cell<SelectionContext | null>(defaultData, (r) => {
  // r.sub(evoyaAiState$, console.log);
});
export const scrollOffset$ = Cell<number>(0);
export const editorContainerRef$ = Cell<React.RefObject<HTMLElement> | null>(null);
/*export const evoyaAiState$ = Cell<SelectionContext>(defaultData, (r) => {
  r.link(
    r.pipe(
      r.combine(currentSelection$, onWindowChange$),
      withLatestFrom(activeEditor$, evoyaAiState$),
      map(([change, activeEditor, evoyaAiState]) => {
        console.log('evoyaAiState',evoyaAiState);
        if (evoyaAiState?.lexical && activeEditor) {
          if ($isRangeSelection(evoyaAiState.lexical)) {
            const startPoint = evoyaAiState.lexical.isBackward() ? evoyaAiState.lexical.focus : evoyaAiState.lexical.anchor;
            const endPoint = !evoyaAiState.lexical.isBackward() ? evoyaAiState.lexical.focus : evoyaAiState.lexical.anchor;
            const domRange = createDOMRange(activeEditor, startPoint.getNode(), startPoint.offset, endPoint.getNode(), endPoint.offset);
            console.log(domRange);
            const rects = createRectsFromDOMRange(activeEditor, domRange);
            console.log(rects);
            return {
              ...evoyaAiState,
              rectangles: rects,
              rect: getSelectionRectangle(activeEditor)
            };
          }
        }
        return defaultData;
      })
    ),
    evoyaAiState$
  );
});*/
/*export const evoyaAiState$ = Cell<EvoyaAIData>(defaultData, (r) => {
  r.link(
    r.pipe(
      r.combine(currentSelection$, onWindowChange$),
      withLatestFrom(activeEditor$, readOnly$),
      map(([[selection], activeEditor, readOnly]) => {
        if ($isRangeSelection(selection) && activeEditor && !readOnly) {
          // const anchor = this.anchor;
          // const focus = this.focus;
          // const selection2 = new RangeSelection(
          //   $createPoint(anchor.key, anchor.offset, anchor.type),
          //   $createPoint(focus.key, focus.offset, focus.type),
          //   this.format,
          //   this.style,
          // );
          // console.log('start end', selection.getStartEndPoints());
          const startEnd = selection.getStartEndPoints();
          console.log('startEnd', startEnd);
          // console.log('selection', selection);
          // console.log('selection2', selection2);
          // const selectionClone = selection.clone();
          // console.log('selection', selectionClone);

          // const anchor = $createPoint(startEnd[0].__key, startEnd[0].offset, 'text');
          // const focus = $createPoint(startEnd[1].__key, startEnd[1].offset, 'text');
          // const restoredSelection = new RangeSelection(anchor, focus, 0, '');
          const restoredSelection = $createRangeSelection();
          const startOffset = startEnd[0].offset;
          const endOffset = startEnd[1].offset;
          console.log(endOffset, 'text');
          restoredSelection.anchor.set(startEnd[0].key, startEnd[0].offset, 'text');
          restoredSelection.focus.set(startEnd[0].key, startOffset + endOffset, 'text');

          console.log(restoredSelection)
          return {
            selection: restoredSelection,
            // start: startEnd[0],
            // end: startEnd[1],
            type: 'range',
            selectedNode: getSelectedNode(selection),
            rectangle: getSelectionRectangle(activeEditor),
            content: selection.getTextContent()
          };
        } else {
          return defaultData;
        }
        return defaultData;
      })
    ),
    evoyaAiState$
  );
});*/

function evoyaImportMarkdownToLexical({
  root,
  markdown,
  visitors,
  syntaxExtensions,
  mdastExtensions,
  ...descriptors
}: MarkdownParseOptions): void {
  let mdastRoot: Mdast.Root
  try {
    mdastRoot = fromMarkdown(markdown, {
      extensions: syntaxExtensions,
      mdastExtensions
    })
  } catch (e: unknown) {
    throw e;
    // if (e instanceof Error) {
    //   throw new MarkdownParseError(`Error parsing markdown: ${e.message}`, e)
    // } else {
    //   throw new MarkdownParseError(`Error parsing markdown: ${e}`, e)
    // }
  }

  importMdastTreeToLexical({ root, mdastRoot, visitors, ...descriptors })
}

interface ImportPoint {
  append(node: LexicalNode): void
  getType(): string
}

function tryImportingMarkdown(r: Realm, node: ImportPoint, markdownValue: string) {
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
    console.log(e);
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

const notInline = (node: LexicalNode) =>
  ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();

// export const replaceSelectionContent$ = Signal<{ message: string, selection: any}>((realm) => {
export const replaceSelectionContent$ = Signal<{ message: string, context: SelectionContext}>((realm) => {
  realm.sub(realm.pipe(replaceSelectionContent$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
    console.log(value);
    if (value && value.message && value.context) {
      activeEditor?.update(() => {
        console.log('selection context', value.context);
        const selectionContext = value.context;
        const lexicalSelection = value.context.lexical;

        // $setSelection(lexicalSelection);
        // realm.pub(insertMarkdown$, value.message);
        // return;

        // const paragraph = new ParagraphNode();
        // const paragraph = new RootNode();
        // // $convertFromMarkdownString(value.message, TRANSFORMERS, paragraph);
        // importMarkdownToLexical({
        //   // root: value.selection.getNodes()[0],
        //   root: paragraph,
        //   visitors: realm.getValue(importVisitors$),
        //   mdastExtensions: realm.getValue(mdastExtensions$),
        //   markdown: value.message,
        //   syntaxExtensions: realm.getValue(syntaxExtensions$),
        //   jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
        //   directiveDescriptors: realm.getValue(directiveDescriptors$),
        //   codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
        // });
        // let parapgraphChildren = paragraph.getChildren();
        // if (parapgraphChildren && parapgraphChildren.length === 1 && parapgraphChildren[0].getType() === 'paragraph') {
        //   parapgraphChildren = parapgraphChildren[0].getChildren();
        // }

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
            importMarkdownToLexical({
              // root: value.selection.getNodes()[0],
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
            if ($isRangeSelection(lexicalSelection)) {
              const lastPoint = lexicalSelection.isBackward() ? lexicalSelection.anchor : lexicalSelection.focus;
              const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
              // console.log(parapgraphChildren);
              /*if (selectedNodes.some(notInline)) {
                let firstNode = firstPoint.getNode();
                console.log(lexicalSelection.getNodes());
                console.log(firstNode);

                if (firstNode.getType() === 'text') {
                  firstNode = firstNode.getParent();
                }

                parapgraphChildren.forEach((child) => {
                  firstNode.insertBefore(child, false);
                });

                selectedNodes.forEach((node: LexicalNode) => node.remove());
              } else {
                // $getSelection().insertNodes(parapgraphChildren);
                lexicalSelection.insertNodes(parapgraphChildren);
              }*/
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

                newChildren.toReversed().forEach((node) => insertAnchor.insertAfter(node));
                selectedNodes.forEach((node) => node.remove());


                /*if (importChildren.length === 1) {
                  const newChildren = !$isTextNode(importChildren[0]) ? importChildren[0].getChildren() : importChildren;
                  newChildren.forEach((node) => firstPoint.getNode().insertBefore(node));
                  selectedNodes.forEach((node) => node.remove());
                } else {
                  importChildren.forEach((node) => firstPoint.getNode().getParent().insertBefore(node));
                  selectedNodes.forEach((node) => node.remove());
                }*/
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
        return;


        if ($isRangeSelection(lexicalSelection)) {
          const paragraph = new ParagraphNode();
          // $convertFromMarkdownString(value.message, TRANSFORMERS, paragraph);
          importMarkdownToLexical({
            // root: value.selection.getNodes()[0],
            root: paragraph,
            visitors: realm.getValue(importVisitors$),
            mdastExtensions: realm.getValue(mdastExtensions$),
            markdown: value.message,
            syntaxExtensions: realm.getValue(syntaxExtensions$),
            jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
            directiveDescriptors: realm.getValue(directiveDescriptors$),
            codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
          });
          let parapgraphChildren = paragraph.getChildren();
          if (parapgraphChildren && parapgraphChildren.length === 1 && parapgraphChildren[0].getType() === 'paragraph') {
            parapgraphChildren = parapgraphChildren[0].getChildren();
          }
          console.log(paragraph, parapgraphChildren);

          console.log("isSamePoint", lexicalSelection.anchor.is(lexicalSelection.focus));
          if (lexicalSelection.anchor.is(lexicalSelection.focus)) {
            console.log("ayy");
          } else {
            const selectedNodes = lexicalSelection.getNodes();
            if (selectedNodes.some(notInline)) {
              const firstPoint = lexicalSelection.isBackward() ? lexicalSelection.focus : lexicalSelection.anchor;
              let firstNode = firstPoint.getNode();
              console.log(lexicalSelection.getNodes());
              console.log(parapgraphChildren);
              console.log(firstNode);

              if (firstNode.getType() === 'text') {
                firstNode = firstNode.getParent();
              }

              parapgraphChildren.forEach((child) => {
                firstNode.insertBefore(child, false);
              });

              selectedNodes.forEach((node: LexicalNode) => node.remove());
            } else {
              // $getSelection().insertNodes(parapgraphChildren);
              lexicalSelection.insertNodes(parapgraphChildren);
            }
          }
        } else if ($isNodeSelection(lexicalSelection)) {
          // const rootNode = new RootNode();
          // const rootNode = new ElementNode();
          const rootNode = new ParagraphNode();
          console.log("$isNodeSelection");
          console.log(lexicalSelection);
          console.log(lexicalSelection.getNodes()[0]);

          importMarkdownToLexical({
            root: rootNode,
            visitors: realm.getValue(importVisitors$),
            mdastExtensions: realm.getValue(mdastExtensions$),
            markdown: value.message,
            syntaxExtensions: realm.getValue(syntaxExtensions$),
            jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
            directiveDescriptors: realm.getValue(directiveDescriptors$),
            codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
          });

          lexicalSelection.insertNodes(rootNode.getChildren());

          /*let mdastRoot;
          try {
            mdastRoot = fromMarkdown(value.message, null, {
              extensions: realm.getValue(syntaxExtensions$),
              mdastExtensions: realm.getValue(mdastExtensions$)
            });
            console.log(mdastRoot);

            // value.selection.insertNodes([$createTableNode(mdastRoot.children[0])]);

            // realm.pub(currentSelection$, value.selection);
            // realm.pub(insertDecoratorNode$, $createTableNode(mdastRoot.children[0]));
          } catch (e: unknown) {
            console.log(e);
          }*/
          
        }
      });
    }
  });
});

export const evoyaAiPlugin = realmPlugin<{
  containerRef: React.RefObject<HTMLElement>;
  setRealm: (realm: Realm) => void;
  setSelectionContext: (context: SelectionContext) => void;
}>({
  init: (realm, params) => {
    if (params?.setRealm) {
      params.setRealm(realm);
    }

    // const updateScrollOffset = () => {
    //   console.log(params?.containerRef?.current?.scrollTop);
    //   realm.pub(scrollOffset$, params?.containerRef?.current?.scrollTop)
    // }

    // window.addEventListener('resize', updateScrollOffset)
    // window.addEventListener('scroll', updateScrollOffset)

    realm.pubIn({
      [addActivePlugin$]: 'evoyaAi',
      // [addImportVisitor$]: MdastHeadingVisitor,
      // [addLexicalNode$]: SelectionPlaceholderNode,
      // [addExportVisitor$]: LexicalSelectionVisitor,
    });
    realm.pub(editorContainerRef$, params?.containerRef);
    realm.pub(addComposerChild$, TextSelection);
    realm.pub(replaceSelectionContent$, null);
    // realm.pub(addLexicalNode$, SelectionPlaceholderNode);
    realm.sub(realm.pipe(realm.combine(currentSelection$, onWindowChange$), withLatestFrom(activeEditor$, readOnly$)), ([[selection], activeEditor, readOnly]) => {
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

      if (activeEditor && selection && !readOnly) {
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
            if ($isAtNodeEnd(selection.anchor)) {
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
                // const domElement = anchorNodeParent.exportDOM(activeEditor);
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
                // const domElement = anchorNode.exportDOM(activeEditor);
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
            }
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
                    // rect: getSelectionRectangle(activeEditor),
                    scrollOffset
                  };
                  
                  if (params?.setSelectionContext) {
                    params.setSelectionContext(selectionContext);
                  }

                  realm.pub(evoyaAiState$, selectionContext);
                } else {
                  activeEditor.update(() => {
                    const extractedSelectionNodes = selection.extract();
                    const extractedNodes = extractedSelectionNodes.map(en => {
                      const newTextNode = new TextNode(en.__text);
                      newTextNode.__style = en.__style;
                      newTextNode.__format = en.__format;
                      return newTextNode;
                    });
                    const elemNode = new ParagraphNode();
                    elemNode.append(...extractedNodes);
                    const selMd = nodeToMarkdown(elemNode);
                    console.log(selMd);

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
                    // const selMd = extractedSelectionNodes.map((textNode) => nodeToMarkdown(textNode)).join('');

                    // console.log(selMd);

                    const selectionContext = {
                      lexical: restoredSelection,
                      markdown: selMd,
                      selectionType: 'range' as 'range',
                      insertType: 'replace' as 'replace',
                      rectangles: rects,
                      // rect: getSelectionRectangle(activeEditor),
                      scrollOffset
                    };
                    
                    if (params?.setSelectionContext) {
                      params.setSelectionContext(selectionContext);
                    }

                    realm.pub(evoyaAiState$, selectionContext);
                  });
                }
              } else if (selectedNodes.length === 1) {
                // const selMd = $convertToMarkdownString(TRANSFORMERS, selectedNodes[0]);
                const selMd = nodeToMarkdown(selectedNodes[0]);
                console.log(selMd);

                const selectionContext = {
                  lexical: restoredSelection,
                  markdown: selMd,
                  selectionType: 'range' as 'range',
                  insertType: 'replace' as 'replace',
                  rectangles: rects,
                  // rect: getSelectionRectangle(activeEditor),
                  scrollOffset
                };
                
                if (params?.setSelectionContext) {
                  params.setSelectionContext(selectionContext);
                }

                realm.pub(evoyaAiState$, selectionContext);
              } else {
                if (selectedNodes.every((sn: LexicalNode) => ['text', 'paragraph', 'heading', 'listitem', 'list'].includes(sn.getType()))) {
                  // const relevantNodes = selectedNodes.filter((sn: LexicalNode) => ['paragraph', 'heading'].includes(sn.getType()));
                  // const elemNode = new ParagraphNode();
                  // elemNode.append(...relevantNodes.map(n => convertSelectionToNode$.clone()));
                  // const selMd = exportMarkdownFromLexical({
                  //   root: elemNode,
                  //   visitors: realm.getValue(exportVisitors$),
                  //   jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
                  //   toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
                  //   toMarkdownOptions: realm.getValue(toMarkdownOptions$),
                  //   jsxIsAvailable: realm.getValue(jsxIsAvailable$)
                  // });
                  // console.log(selMd);

                  activeEditor.update(() => {
                    const el = $createParagraphNode();
                    el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                    // const selMd = $convertToMarkdownString(TRANSFORMERS, el);
                    const selMd = nodeToMarkdown(el);
                    console.log(selMd);

                    const selectionContext = {
                      lexical: restoredSelection,
                      markdown: selMd,
                      selectionType: 'range' as 'range',
                      insertType: 'replace' as 'replace',
                      rectangles: rects,
                      // rect: getSelectionRectangle(activeEditor),
                      scrollOffset
                    };
                    
                    if (params?.setSelectionContext) {
                      params.setSelectionContext(selectionContext);
                    }

                    realm.pub(evoyaAiState$, selectionContext);
                  });
                } else if (selectedNodes.some((sn: LexicalNode) => ['listitem', 'list'].includes(sn.getType()))) {
                  // handle list selection ???
                }
              }
            }
          }
        } else {
          console.log('unhandled selection');
        }
      }
    });
  },
  update(realm, params) {
    realm.pub(editorContainerRef$, params?.containerRef);
  }
});