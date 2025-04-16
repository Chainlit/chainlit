import React, { useCallback, useEffect} from 'react';
import mermaid from 'mermaid';
import {
  CodeBlockEditorDescriptor,
  useCodeBlockEditorContext,
  CodeMirrorEditor,
  editorInFocus$,
  rootEditor$,
} from '@mdxeditor/editor';

import { usePublisher, useRealm } from '@mdxeditor/gurx';

import EvoyaLogo from '@/svg/EvoyaLogo';
import HandPointer from '@/svg/HandPointer';

import { setNodeSelection$, setNodeSelectionByKey$, setCodeSelection$ } from '../../evoyaAi';

mermaid.initialize({ startOnLoad: true })

const MermaidPreview: React.FC<{ code: string }> = ({ code }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      void mermaid.render('graphDiv', code).then(({ svg }) => {
        ref.current!.innerHTML = svg
      })
    }
  }, [code])

  return <div ref={ref}>{code}</div>
}

export const MermaidCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, _meta) => {
    return language === 'mermaid' || language == 'mmd'
  },
  priority: 0,
  Editor: (props) => {
    console.log(props);
    const setNodeSelection = usePublisher(setNodeSelectionByKey$);
    const realm = useRealm();

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
        <div className="mermaidBlockWrapper">
          <div className="mermaidBlockAction" onClick={() => setNodeSelection(props.nodeKey)}>
            <HandPointer />
          </div>
          <div className="mermaidEditorWrapper">
            <CodeMirrorEditor {...props} />
          </div>
          <div className="mermaidPreviewWrapper">
            <div>
              <MermaidPreview code={props.code} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}