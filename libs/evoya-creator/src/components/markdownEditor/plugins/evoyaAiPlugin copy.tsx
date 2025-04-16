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
} from "@mdxeditor/editor";

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
} from "@lexical/selection";

import {
  $findTableNode,
} from "@lexical/table";

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
  $isElementNode,
  $isDecoratorNode,
  SerializedEditor,
} from "lexical";

export const TextSelection = () => {
  const [
    evoyaAiState,
    isFocus,
  ] = useCellValues(
    evoyaAiState$,
    inFocus$,
  );

  const theRect = evoyaAiState.rectangle;

  if (isFocus) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          backgroundColor: 'highlight',
          zIndex: '-1',
          top: `${theRect?.top ?? 0}px`,
          left: `${theRect?.left ?? 0}px`,
          width: `${theRect?.width ?? 0}px`,
          height: `${theRect?.height ?? 0}px`
        }}
      ></div>
    </>
  )
}

class SelectionPlaceholderNode extends ElementNode {
  ['constructor']!: KlassConstructor<typeof SelectionPlaceholderNode>;

  static getType(): string {
    return 'selectionp';
  }
}

export type RectData = Pick<DOMRect, 'height' | 'width' | 'top' | 'left'>

export interface EvoyaAIData {
  selection: any;
  selectedNode: any;
  rectangle: RectData;
}

const defaultData: EvoyaAIData = {
  selection: null,
  selectedNode: null,
  rectangle: {top: 0, left: 0, width: 0, height: 0},
}

export const evoyaAiState$ = Cell<EvoyaAIData>(defaultData, (r) => {
  r.link(
    r.pipe(
      r.combine(currentSelection$, onWindowChange$),
      withLatestFrom(activeEditor$, readOnly$),
      map(([[selection], activeEditor, readOnly]) => {
        /*if ($isRangeSelection(selection) && activeEditor && !readOnly) {
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
        }*/
        return defaultData;
      })
    ),
    evoyaAiState$
  );
});

const notInline = (node: LexicalNode) =>
  ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();

export const replaceSelectionContent$ = Signal<{ message: string, selection: any}>((realm) => {
  console.log('register replaceSelectionContent$');
  realm.sub(realm.pipe(replaceSelectionContent$, withLatestFrom(activeEditor$, evoyaAiState$)), ([value, activeEditor, evoyaAiState]) => {
    console.log(value);
    if (value && value.message && value.selection) {
      console.log(value.message);
      if (value.message != null) {
        // const paragraph = new ParagraphNode();
        // $convertFromMarkdownString(value.message, TRANSFORMERS, paragraph);
        // value.selection.insertNodes(paragraph.getChildren());

        activeEditor?.update(() => {
          // console.log('evoyaAiState.selection', evoyaAiState.selection);
          console.log('value.selection', value.selection);
          // const restoredSelection = $createRangeSelection();
          // restoredSelection.anchor.set(evoyaAiState.start.__key, evoyaAiState.start.offset, 'text');
          // restoredSelection.focus.set(evoyaAiState.end.__key, evoyaAiState.end.offset, 'text');

          // $setSelection(evoyaAiState.selection);
          // $setSelection(restoredSelection);

          // console.log('$getSelection()', $getSelection());

          console.log("isRangeSelection", $isRangeSelection(value.selection), value.selection);
          if ($isRangeSelection(value.selection)) {
            const paragraph = new ParagraphNode();
            $convertFromMarkdownString(value.message, TRANSFORMERS, paragraph);
            let parapgraphChildren = paragraph.getChildren();
            if (parapgraphChildren && parapgraphChildren.length === 1 && parapgraphChildren[0].getType() === 'paragraph') {
              parapgraphChildren = parapgraphChildren[0].getChildren();
            }
            console.log(paragraph, parapgraphChildren);

            console.log("isSamePoint", value.selection.anchor.is(value.selection.focus));
            if (value.selection.anchor.is(value.selection.focus)) {
              console.log("ayy");
            } else {
              const selectedNodes = value.selection.getNodes();
              if (selectedNodes.some(notInline)) {
                const firstPoint = value.selection.isBackward() ? value.selection.focus : value.selection.anchor;
                let firstNode = firstPoint.getNode();
                console.log(value.selection.getNodes());
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
                // evoyaAiState.selection.insertNodes(parapgraphChildren);
                value.selection.insertNodes(parapgraphChildren);
              }
            }
          } else if ($isNodeSelection(value.selection)) {
            // const rootNode = new RootNode();
            // const rootNode = new ElementNode();
            console.log("$isNodeSelection");
            console.log(value.selection);
            console.log(value.selection.getNodes()[0]);
            /*importMarkdownToLexical({
              // root: value.selection.getNodes()[0],
              root: rootNode,
              visitors: realm.getValue(importVisitors$),
              mdastExtensions: realm.getValue(mdastExtensions$),
              markdown: value.message,
              syntaxExtensions: realm.getValue(syntaxExtensions$),
              jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
              directiveDescriptors: realm.getValue(directiveDescriptors$),
              codeBlockEditorDescriptors: realm.getValue(codeBlockEditorDescriptors$)
            });
            console.log(rootNode.getChildren());*/

            let mdastRoot;
            try {
              mdastRoot = fromMarkdown(value.message, {
                extensions: realm.getValue(syntaxExtensions$),
                mdastExtensions: realm.getValue(mdastExtensions$)
              });
              console.log(mdastRoot);
            } catch (e: unknown) {
              console.log(e);
            }
            
          }
        });
      }
    }
  });
});

export const evoyaAiPlugin = realmPlugin<{
  onSelectionChange: (text: string, selection: any) => void;
  setRealm: (realm: Realm) => void;
  setContextData: (editorJson: SerializedEditor, selection: RangeSelection) => void;
}>({
  init: (realm, params) => {
    if (params?.setRealm) {
      params.setRealm(realm);
    }
    // realm.sub(createActiveEditorSubscription$, (editor) => {
    //     // console.log('createActiveEditorSubscription$', getSelectionRectangle(editor))
    //     // console.log('createActiveEditorSubscription$', editor);
    // });
    // realm.sub(currentSelection$, (selection) => {
    //     // console.log('currentSelection$', getSelectionRectangle(editor))
    //     console.log('currentSelection$', selection);
    //     if (selection) {
    //       const activeEditor = useCellValue(activeEditor$);
    //       console.log('cs-activeEditor$', activeEditor);
    //       if (activeEditor) {
    //         console.log('cs-activeEditor$', getSelectionRectangle(activeEditor));
    //       }
    //       console.log('currentSelection$', getSelectedNode(selection));
    //     }
    // });
    realm.pub(addComposerChild$, TextSelection);
    realm.pub(replaceSelectionContent$, null);
    // realm.pub(addLexicalNode$, SelectionPlaceholderNode);
    /*realm.sub(activeEditor$, (activeEditor) => {
      // @ts-expect-error is not a valid prop
      window.updateEvoyaCreator = (message: string, selection: BaseSelection) => {
        // if (selection) {
        //   selection.insertText(message);
        //   // editorSelection.removeText();
        //   // $convertFromMarkdownString()
        //   // editorSelection.insertNodes();
        //   // editorSelection.insertNodes();
        //   //mdxEditorRef.current.insertMarkdown(message)
        // }
        // activeEditor.update(() => {
        //   const selection = $getSelection();
        //   selection.insertText(message);
        // });
        activeEditor.update(() => {
          const selection = $getSelection();
          selection.insertText(message);
        });
      }
    });*/
    realm.sub(realm.pipe(realm.combine(currentSelection$, onWindowChange$), withLatestFrom(activeEditor$, readOnly$)), ([[selection], activeEditor, readOnly]) => {
      // if ($isRangeSelection(selection) && activeEditor && !readOnly) {
      //   params.onSelectionChange({
      //     selection,
      //     selectedNode: getSelectedNode(selection),
      //     rectangle: getSelectionRectangle(activeEditor),
      //     content: selection.getTextContent()
      //   });
      // } else {
      //   return defaultData;
      // }
      // console.log('currentSelection$', getSelectionRectangle(editor))
      // console.log('currentSelection$', selection);
      if ($isRangeSelection(selection) && activeEditor && !readOnly) {
        const editorJson = activeEditor.toJSON();
        console.log(editorJson);
        console.log(JSON.stringify(editorJson));
        // console.log(JSON.stringify(selection));
        // const newEditorState = createEditor(activeEditor._config);
        // newEditorState.parseEditorState(editorJson);
        // console.log(newEditorState);
        // const root = $getRoot();
        // console.log(root.exportJSON());
        // const rootClone = $copyNode(root);
        // console.log(rootClone.getTextContent());

        // params.onSelectionChange(window.getSelection()?.toString(), selection);


        const startEnd = selection.getStartEndPoints();
        const restoredSelection = $createRangeSelection();
        const startOffset = startEnd[0].offset;
        const endOffset = startEnd[1].offset;
        // console.log(endOffset);
        restoredSelection.anchor.set(startEnd[0].key, startOffset, 'text');
        restoredSelection.focus.set(startEnd[1].key, endOffset, 'text');
        console.log(restoredSelection);

        // if (params?.setContextData) {
        //   params.setContextData(editorJson, restoredSelection);
        // }


        const selectedNodes = selection.getNodes();
        console.log(selection);
        console.log(selectedNodes);

        if (selectedNodes.length > 0) {
          console.log(selectedNodes[0].getParent());
          const anchorParentKey = selectedNodes[0].getParent().getKey();
          console.log(selectedNodes[0].__parent);
          console.log(activeEditor);
          console.log(activeEditor._parentEditor);

          if (selectedNodes.every((sn: LexicalNode) => sn.getType() === 'text' && sn.__parent === anchorParentKey)) {
            // const extractedNodes = selection.extract().map(en => new TextNode(en.__text));
            // const extractedNodes = selection.extract().map(en => $createTextNode(en.__text).afterCloneFrom(en));
            const extractedNodes = selection.extract().map(en => {
              const newTextNode = new TextNode(en.__text);
              newTextNode.__style = en.__style;
              newTextNode.__format = en.__format;
              return newTextNode;
            });
            console.log(extractedNodes);
            const elemNode = new ParagraphNode();
            // const elemNode = new SelectionPlaceholderNode();
            elemNode.append(...extractedNodes);
            console.log(elemNode);
            console.log(elemNode.getChildren());
            const selMd = exportMarkdownFromLexical({
              root: elemNode,
              visitors: realm.getValue(exportVisitors$),
              jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
              toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
              toMarkdownOptions: realm.getValue(toMarkdownOptions$),
              jsxIsAvailable: realm.getValue(jsxIsAvailable$)
            });
            console.log(selMd);

            if (params?.onSelectionChange) {
              params.onSelectionChange(selMd, restoredSelection);
            }

            /*activeEditor.update(() => {
              // const extractedNodes = selection.extract().map(en => {
              //   const newTextNode = new TextNode(en.__text);
              //   newTextNode.__style = en.__style;
              //   newTextNode.__format = en.__format;
              //   return newTextNode;
              // });
              // console.log(extractedNodes);
              // const elemNode = new ParagraphNode();
              // elemNode.append(...extractedNodes);
              // console.log(elemNode);
              // console.log(elemNode.getChildren());
              // const selMd = exportMarkdownFromLexical({
              //   root: elemNode,
              //   visitors: realm.getValue(exportVisitors$),
              //   jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
              //   toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
              //   toMarkdownOptions: realm.getValue(toMarkdownOptions$),
              //   jsxIsAvailable: realm.getValue(jsxIsAvailable$)
              // });
              // console.log(selMd);

              const el = $createParagraphNode();
              el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
              const output = $convertToMarkdownString(TRANSFORMERS, el);
              console.log(output);
  
              if (params?.onSelectionChange) {
                // params.onSelectionChange(selMd, restoredSelection);
                params.onSelectionChange(output, restoredSelection);
              }
            });*/
          } else if (selectedNodes.length === 1) {
            const selMd = $convertToMarkdownString(TRANSFORMERS, selectedNodes[0]);
            console.log(selMd);

            if (params?.onSelectionChange) {
              params.onSelectionChange(selMd, restoredSelection);
            }
          } else {
            if (selectedNodes.every((sn: LexicalNode) => ['text', 'paragraph', 'heading'].includes(sn.getType()))) {
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
              // if (params?.onSelectionChange) {
              //   params.onSelectionChange(selMd, restoredSelection);
              // }

              activeEditor.update(() => {
                const el = $createParagraphNode();
                el.splice(0, 0, $generateNodesFromSerializedNodes($generateJSONFromSelectedNodes(activeEditor, $getSelection()).nodes));
                const output = $convertToMarkdownString(TRANSFORMERS, el);
                console.log(output);

                if (params?.onSelectionChange) {
                  params.onSelectionChange(output, restoredSelection);
                }
              });
            }
          }
        }
      } else {
        console.log('unhandled selection');
      }

      /*if (selection) {
        const extractedNodes = selection.extract();
        const selectedNodes = selection.getNodes();
        if (extractedNodes.length > 0) {
          // const mdex = $convertToMarkdownString(lexicalElementNode);
          // console.log(mdex);
          console.log('currentSelection$-ext', selection.extract());
          console.log('cs-activeEditor$', editor);
          if (editor) {
            console.log('cs-activeEditor$', getSelectionRectangle(editor));
          }
          const selectedNode = getSelectedNode(selection);
          console.log('currentSelection$', selectedNode);
          console.log('currentSelection$', selectedNode?.getParent());

          const firstPoint = selection.isBackward() ? selection.focus : selection.anchor;
          const lastPoint = selection.isBackward() ? selection.anchor : selection.focus;
          const firstNode = firstPoint.getNode();
          const lastNode = lastPoint.getNode();

          const delimiterNodeStart = new TextNode('£££');
          const delimiterNodeEnd = new TextNode('£££');

          if (firstNode.is(lastNode)) {
            if ($isTextNode(firstNode)) {
              const splitNodes = firstNode.splitText(firstPoint.offset, lastPoint.offset);
              console.log(splitNodes);
            } else if ($isParagraphNode(firstNode)) {
            } else {
              firstNode.insertBefore(delimiterNodeStart);
              firstNode.insertAfter(delimiterNodeEnd);
            }
          } else {
            if ($isTextNode(firstNode)) {
              firstNode.spliceText(firstPoint.offset, 0, '£££');
            } else if ($isParagraphNode(firstNode)) {
            } else {
              firstNode.insertBefore(delimiterNodeStart);
            }

            if ($isTextNode(lastNode)) {
              lastNode.spliceText(lastPoint.offset, 0, '£££');
            } else if ($isParagraphNode(firstNode)) {
            } else {
              lastNode.insertAfter(delimiterNodeEnd);
            }
          }
        }
      }*/
    });
    // realm.sub(activeEditor$, (editor) => {
    //     // console.log('currentSelection$', getSelectionRectangle(editor))
    //     console.log('activeEditor$', editor);
    // });
    // realm.sub(createRootEditorSubscription$, (editor) => {
    //     // console.log('createRootEditorSubscription$', getSelectionRectangle(editor))
    //     console.log('createRootEditorSubscription$', editor);
    // });
  },
});