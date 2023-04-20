import CircleIcon from "@mui/icons-material/Circle";
import { Alert, AlertTitle, Stack } from "@mui/material";
import DocumentText from "components/document/text";
import { IDocuments } from "state/document";

interface Props {
  items: IDocuments;
}

export default function InlinedTextList({ items }: Props) {
  return (
    <Stack spacing={1}>
      {Object.entries(items).map(([k, v]) => {
        return (
          <Alert color="info" key={k} icon={false}>
            <AlertTitle>{k}</AlertTitle>
            <DocumentText document={v} />
          </Alert>
        );
      })}
    </Stack>
  );
}
