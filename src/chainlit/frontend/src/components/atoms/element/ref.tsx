import { Link as RRLink } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';

import { Link } from '@mui/material';

import { IMessageElement, sideViewState } from 'state/element';

interface Props {
  element: IMessageElement;
}

export default function ElementRef({ element }: Props) {
  const setSideView = useSetRecoilState(sideViewState);
  if (element.display === 'inline') {
    return <span style={{ fontWeight: 700 }}>{element.name}</span>;
  }

  let path = `/element/${element.id}`;
  if (element.conversationId) {
    path += `?conversation=${element.conversationId}`;
  }

  return (
    <Link
      className="element-link"
      onClick={() => {
        if (element.display === 'side') {
          setSideView(element);
        }
      }}
      component={RRLink}
      to={element.display === 'page' ? path : '#'}
    >
      {element.name}
    </Link>
  );
}
