import { useEffect, useRef } from 'react';
import type { SetterOrUpdater } from 'recoil';

import type { IMessageElement } from '@chainlit/react-client';

type SideView = { title: string; elements: IMessageElement[] } | undefined;

// The shared view can outlive this hook during navigation between threads.
const messageSideViews = new WeakSet<NonNullable<SideView>>();

export function createMessageSideView(elements: IMessageElement[]) {
  const view = {
    title: elements[elements.length - 1].name,
    elements
  };
  messageSideViews.add(view);
  return view;
}

export function useSideElements(
  elements: IMessageElement[],
  setSideView: SetterOrUpdater<SideView>
) {
  const knownSideElementsRef = useRef<Map<string, IMessageElement>>(new Map());
  const knownSideOrderRef = useRef<string[]>([]);

  useEffect(() => {
    const sideElements = elements.filter((e) => e.display === 'side');

    const prevMap = knownSideElementsRef.current;
    const prevOrder = knownSideOrderRef.current;
    const currentIds = sideElements.map((e) => e.id);

    const hasChanged =
      currentIds.length !== prevOrder.length ||
      currentIds.some((id, i) => prevOrder[i] !== id) ||
      sideElements.some((e) => prevMap.get(e.id) !== e);

    knownSideElementsRef.current = new Map(sideElements.map((e) => [e.id, e]));
    knownSideOrderRef.current = currentIds;
    const shouldOpen =
      hasChanged &&
      sideElements.some(
        (element) =>
          prevMap.get(element.id) !== element && element.autoExpand !== false
      );
    setSideView((current) => {
      if (
        current &&
        messageSideViews.has(current) &&
        current.elements.every((e) => e.display === 'page')
      ) {
        const currentElements = new Map(elements.map((e) => [e.id, e]));
        const pages = current.elements
          .map((e) => currentElements.get(e.id))
          .filter((e): e is IMessageElement => e?.display === 'page');
        if (pages.length === 0) {
          return shouldOpen ? createMessageSideView(sideElements) : undefined;
        }
        return pages.length === current.elements.length &&
          pages.every((e, i) => e === current.elements[i])
          ? current
          : createMessageSideView(pages);
      }
      if (sideElements.length === 0) {
        return current && messageSideViews.has(current) ? undefined : current;
      }
      return hasChanged && (current || shouldOpen)
        ? createMessageSideView(sideElements)
        : current;
    });
  }, [elements, setSideView]);
}
