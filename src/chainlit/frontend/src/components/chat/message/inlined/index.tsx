import { DocumentType, IDocuments } from "state/document";
import InlinedImageList from "./image";
import { Stack } from "@mui/material";
import InlinedTextList from "./text";

interface Props {
  inlined: IDocuments;
}

export default function InlinedDocuments({ inlined }: Props) {
  if (!inlined || !Object.keys(inlined).length) {
    return null;
  }

  const images = Object.keys(inlined)
    .filter((key) => inlined[key].type === DocumentType.img)
    .map((k) => {
      return {
        src:
          inlined[k].url || URL.createObjectURL(new Blob([inlined[k].content])),
        title: inlined[k].name,
      };
    });

  const texts = Object.fromEntries(
    Object.entries(inlined).filter(([k, v]) => v.type === DocumentType.txt)
  );

  return (
    <Stack spacing={1}>
      {images.length ? <InlinedImageList items={images} /> : null}
      {Object.keys(texts).length ? <InlinedTextList items={texts} /> : null}
    </Stack>
  );
}
