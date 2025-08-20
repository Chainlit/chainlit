import { useCallback, useEffect, useState } from 'react';

interface UseCommandNavigationProps {
  items: any[];
  isOpen: boolean;
  onSelect: (item: any) => void;
  onClose?: () => void;
}

export const useCommandNavigation = ({
  items,
  isOpen,
  onSelect,
  onClose
}: UseCommandNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastMouseMove, setLastMouseMove] = useState(0);

  // Reset selection when opening or items change
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setLastMouseMove(0);
    }
  }, [isOpen, items.length]);

  const handleMouseMove = useCallback(
    (index: number) => {
      const now = Date.now();
      // Only update if mouse actually moved (not just from render)
      if (now - lastMouseMove > 50) {
        setSelectedIndex(index);
        setLastMouseMove(now);
      }
    },
    [lastMouseMove]
  );

  const handleMouseLeave = useCallback(() => {
    // Keep the last hovered item selected when mouse leaves
    setLastMouseMove(Date.now());
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || items.length === 0) return;

      // Check if mouse was recently moved
      const timeSinceMouseMove = Date.now() - lastMouseMove;
      const isUsingKeyboard = timeSinceMouseMove > 100;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          if (isUsingKeyboard) {
            setSelectedIndex((prev) =>
              prev < items.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          if (isUsingKeyboard) {
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : items.length - 1
            );
          }
          break;

        case 'Enter': {
          e.preventDefault();
          e.stopPropagation();
          const selectedItem = items[selectedIndex];
          if (selectedItem) {
            onSelect(selectedItem);
          }
          break;
        }

        case 'Tab': {
          e.preventDefault();
          e.stopPropagation();
          const selectedItem = items[selectedIndex];
          if (selectedItem) {
            onSelect(selectedItem);
          }
          break;
        }

        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          if (onClose) {
            onClose();
          }
          break;
      }
    },
    [isOpen, items, selectedIndex, lastMouseMove, onSelect, onClose]
  );

  return {
    selectedIndex,
    handleMouseMove,
    handleMouseLeave,
    handleKeyDown
  };
};
