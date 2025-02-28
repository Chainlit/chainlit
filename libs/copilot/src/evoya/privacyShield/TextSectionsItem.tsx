import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { TextSection } from './types';

import { Badge } from "@chainlit/app/src/components/ui/badge";

interface Props {
  section: TextSection;
  isActive: boolean;
  setActive: (id: string) => void;
  setEdit: (section: TextSection) => void;
  toggleAnon: (id: string) => void;
}

const TextSectionsItem = ({ section, isActive, setActive, toggleAnon, setEdit }: Props): JSX.Element => {
  const activeStyle = (section.isAnon || isActive);
  const [showEdit, setShowEdit] = useState(false)

  const mouseEnter = () => {
    setShowEdit(true)
    if (section.id) {
      setActive(section.id);
    }
  };

  const mouseLeave = () => {
    setActive('');
    setShowEdit(false)
  };

  const click = () => {
    if (section.id) {
      toggleAnon(section.id);
    }
  };

  const edit = () => {
    setEdit(section);
  };

  return (
    <span>
      <Badge
        key={section.id}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
        className={`inline bg-white px-3 py-1 rounded-3xl  w-fit border focus:outline-none cursor-pointer 
        ${section.isAnon ? `flex border-green-500 text-green-500 hover:bg-green-500 hover:text-white ${isActive && 'bg-green-500 text-white'}`
            : `flex border-red-500 text-red-500 hover:bg-red-500 hover:text-white ${isActive && 'bg-red-500 text-white'}`} text-xs space-x-1 hover:border-opacity-80`}
      >
        <span onClick={click}>{section.isAnon ? section.anonString : section.string}</span>
        {!section.isLocked && showEdit && (
          <Pencil
            onClick={edit}
            className="text-white h-3 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}
      </Badge>
    </span>
  );
};

export default TextSectionsItem;
