import {
  Box,
  Button,
} from '@mui/material';
import { useEffect, useState, useRef, DOMElement, HTMLAttributes } from 'react';
import Add from '@mui/icons-material/Add';

import { usePrivacyShield } from './usePrivacyShield';
import { TextSection } from 'evoya/types';
import TextSectionsItem from './TextSectionsItem';
import CreateSection from './CreateSection';
import TextSectionsCategories from './TextSectionsCategories';

const TextSections = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [editSection, setEditSection] = useState<TextSection|null>(null);
  const [textSelection, setTextSelection] = useState<string>('');
  const [showCreateSection, setShowCreateSection] = useState<{x: number, y: number}|null>(null);
  const [showCreateSectionPopup, setShowCreateSectionPopup] = useState<boolean>(false);
  const textContainer = useRef<HTMLElement>(null);

  const {
    toggleSectionAnon,
    editSectionType,
    addSection,
    textSections,
  } = usePrivacyShield();

  const textSelected = (event: React.MouseEvent) => {
    if (window.getSelection) {
      const selection = window.getSelection();
      console.log(selection);
      if (selection && selection.toString()) {
        console.log(selection.toString());
        if (textContainer.current) {
          const containerBound = textContainer.current.getBoundingClientRect();
          setShowCreateSection({x: event.clientX - containerBound.x, y: event.clientY - containerBound.y - 60});
          setTextSelection(selection.toString());
        } else {
          setShowCreateSection(null);
        }
      }
    }
  };

  const textUnselected = () => {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setShowCreateSection(null);
      }
    }
  };

  const createPrivacySection = (type: string, text: string|null) => {
    if (editSection) {
      editSectionType(editSection.id ?? '', type);
    } else {
      addSection({
        id: `ps-${Date.now()}`,
        string: (text ?? textSelection).trim(),
        type,
        isAnon: true,
        isLocked: false
      });
    }
    setShowCreateSectionPopup(false);
    setEditSection(null);
    setTextSelection('');
  };

  const createSectionAction = () => {
    setShowCreateSectionPopup(true);
  }

  const closeDialog = () => {
    setShowCreateSectionPopup(false);
  }
  const dialogClosed = () => {
    setTextSelection('');
    setEditSection(null);
  }

  const editSectionAction = (section: TextSection) => {
    setEditSection(section);
    setShowCreateSectionPopup(true);
  }

  useEffect(() => {
    // document.addEventListener("selectionchange", textSelected);
    // document.addEventListener("selectionchange", textUnselected);
    document.addEventListener("mousedown", textUnselected);
    // document.addEventListener("mouseup", textSelected);
    // document.addEventListener("click", textUnselected);

    return () => {
      // document.removeEventListener("selectionchange", textSelected);
      // document.removeEventListener("selectionchange", textUnselected);
      document.removeEventListener("mousedown", textUnselected);
      // document.removeEventListener("mouseup", textSelected);
      // document.removeEventListener("click", textUnselected);
    }
  }, []);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        height: '100%',
      }}
    >
      <CreateSection
        open={showCreateSectionPopup}
        closeDialog={closeDialog}
        dialogClosed={dialogClosed}
        createSection={createPrivacySection}
        showTextField={!textSelection && !editSection}
        editSection={editSection}
        textSelection={textSelection}
      />
      <Box
        sx={{
          gridColumnStart: 'span 2',
          gridColumnEnd: 'span 2',
          padding: 2
        }}
      >
        <Box
          sx={{
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 3,
              padding: 1,
              zIndex: 10,
              whiteSpace: 'nowrap',
              display: showCreateSection ? 'block' : 'none',
              top: showCreateSection?.y,
              left: showCreateSection?.x
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button startIcon={<Add />} onClick={createSectionAction}>
              create section
            </Button>
          </Box>
          <div
            onMouseUp={textSelected}
            ref={textContainer}
          >
            {textSections.map((section) => (
              section.id ?
                <TextSectionsItem
                  section={section}
                  isActive={section.id === activeSection}
                  setActive={(id) => setActiveSection(id)}
                  toggleAnon={toggleSectionAnon}
                  setEdit={editSectionAction}
                />
                : <span>{section.string}</span>
            ))}
          </div>
        </Box>
      </Box>
      <Box
        sx={{
          padding: 2,
          overflow: 'hidden'
        }}
      >
        <TextSectionsCategories
          setActiveSection={setActiveSection}
          createSectionAction={createSectionAction}
          activeSection={activeSection}
        />
      </Box>
    </Box>
  );
};

export default TextSections;