import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { IElement } from 'state/element';

interface Props {
  element: IElement;
}

export default function TextElement({ element }: Props) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (fetching || !element.url) return;
    setFetching(true);
    fetch(element.url)
      .then((res) => res.text())
      .then((_text) => {
        setText(_text);
        setFetching(false);
      })
      .catch(() => {
        setText('');
        setError(true);
        setFetching(false);
      });
  }, [element]);

  const content = fetching
    ? 'Loading...'
    : error
    ? 'Error'
    : text
    ? text
    : (element.content as string);

  return (
    <Typography whiteSpace="initial" color="text.primary">
      {content}
    </Typography>
  );
}
