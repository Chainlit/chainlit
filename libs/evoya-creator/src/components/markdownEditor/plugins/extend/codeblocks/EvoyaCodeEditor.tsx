import React, { useEffect, useCallback } from 'react';
import {
  CodeBlockEditorDescriptor,
  useCodeBlockEditorContext,
  CodeMirrorEditor,
  editorInFocus$,
  rootEditor$,
} from '@mdxeditor/editor';

import {
  $getNodeByKey,
} from 'lexical';

import { usePublisher, useCellValue, useRealm } from '@mdxeditor/gurx';

import EvoyaLogo from '@/svg/EvoyaLogo';
import HandPointer from '@/svg/HandPointer';

import { setNodeSelection$, setNodeSelectionByKey$, setCodeSelection$ } from '../../evoyaAi';

export const EvoyaCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, _meta) => {
    return true;
  },
  priority: -10,
  Editor: (props) => {
    console.log(props);
    const setNodeSelection = usePublisher(setNodeSelectionByKey$);
    // const editorInFocus = useCellValue(editorInFocus$);
    const realm = useRealm();
    // const cb = useCodeBlockEditorContext();
    // const codeMirrorWrapperRef = React.useRef<HTMLDivElement>(null);
    // const [code, setCode] = React.useState(props.code);

    // const selectionChange = useCallback(() => {
    //   console.log('editorInFocus',editorInFocus);
    // }, [editorInFocus]);
    const selectionChange = useCallback(() => {
      const editorInFocus = realm.getValue(editorInFocus$);
      const rootEditor = realm.getValue(rootEditor$);
      console.log('editorInFocus', realm.getValue(editorInFocus$));

      if (editorInFocus?.editorType === 'codeblock' && editorInFocus?.rootNode?.__key === props.nodeKey) {
        const selectedCode = document.getSelection()?.toString();
        console.log('documentSelection', selectedCode);
        const codeDomNode = rootEditor.getElementByKey(editorInFocus?.rootNode?.__key);
        const isChild = codeDomNode?.contains(document.activeElement);
        console.log(isChild);
        if (isChild) {
          const codeSelection = {
            nodeKey: props.nodeKey,
            code: props.code,
            selection: selectedCode,
            language: props.language,
          };
          realm.pub(setCodeSelection$, codeSelection);
        }
      }
    }, [props, realm]);

    useEffect(() => {
      document.addEventListener('selectionchange', selectionChange);

      return () => document.removeEventListener('selectionchange', selectionChange);
    }, [selectionChange]);

    return (
      <div
        onKeyDown={(e) => {
          e.nativeEvent.stopImmediatePropagation()
        }}
      >
        <div className="codeBlockWrapper">
          <div className="codeBlockAction" onClick={() => setNodeSelection(props.nodeKey)}>
            <HandPointer />
          </div>
          <div className="codeEditorWrapper">
            <CodeMirrorEditor {...props} />
          </div>
        </div>
      </div>
    );
  }
}