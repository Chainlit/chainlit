import { IElement, sideViewState } from 'state/element';
import { Link as RRLink } from 'react-router-dom';
import { Link } from '@mui/material';
import { useSetRecoilState } from 'recoil';

interface Props {
  element: IElement;
}

export default function ElementRef({ element }: Props) {
  const setSideView = useSetRecoilState(sideViewState);

  if (element.display === 'inline') {
    return <span style={{ fontWeight: 700 }}>{element.name}</span>;
  }

  const elementId = element.id || element.tempId;

  return (
    <Link
      className="element-link"
      onClick={() => {
        if (element.display === 'side') {
          setSideView(element);
        }
      }}
      component={RRLink}
      to={element.display === 'page' ? `/element/${elementId}` : '#'}
    >
      {element.name}
    </Link>
  );
}
