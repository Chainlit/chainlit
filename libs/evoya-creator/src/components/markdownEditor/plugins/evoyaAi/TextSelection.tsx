import {
  inFocus$,
} from "@mdxeditor/editor";

import {
  useCellValues,
} from "@mdxeditor/gurx";

import {
  evoyaAiState$,
  scrollOffset$,
  editorContainerRef$,
} from './index';

import { useEffect, useState } from "react";

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
      {(evoyaAiState.rectangles ?? []).map((rect: DOMRect) => (
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