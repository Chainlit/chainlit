import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { IDocument } from "state/chat";

interface Props {
  document: IDocument;
}

export default function DocumentText({ document }: Props) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (fetching || !document.url) return;
    setFetching(true);
    fetch(document.url!)
      .then((res) => res.text())
      .then((_text) => {
        setText(_text)
        setFetching(false);
      })
      .catch((err) => {
        setText("")
        setError(true);
        setFetching(false);
      });
  }, [document]);

  const content = fetching ? "Loading..." : error ? "Error" : text ? text : document.content;

  return (
    <Typography whiteSpace="initial" color="text.primary">
      {content}
    </Typography>
  );
}
