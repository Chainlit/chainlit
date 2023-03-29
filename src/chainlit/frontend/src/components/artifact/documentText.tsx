import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { IDocument } from "state/chat";

interface Props {
  document: IDocument;
}

export default function DocumentText({ document }: Props) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (fetching || !document.url) return;
    setFetching(true);
    fetch(document.url!)
      .then((res) => res.text())
      .then((text) => {
        document.content = text;
        setFetching(false);
      })
      .catch((err) => {
        setError(true);
        setFetching(false);
      });
  }, [document]);

  const text = fetching ? "Loading..." : error ? "Error" : document.content;

  return (
    <Typography whiteSpace="initial" color="text.primary">
      {text}
    </Typography>
  );
}
