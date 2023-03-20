import { Box, Typography } from "@mui/material";
import { Navigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { documentsState, DocumentType, IDocument } from "state/chat";

export const renderDocument = (document: IDocument, embedded = false) => {
  switch (document.spec.type) {
    case DocumentType.img:
      return (
        <img
          style={{
            maxWidth: embedded ? "300px" : "100%",
            borderRadius: "0.2rem",
          }}
          src={URL.createObjectURL(new Blob([document.content]))}
        />
      );
    case DocumentType.txt:
      return <Typography whiteSpace="initial" color="text.primary">{document.content}</Typography>;
    default:
      return null;
  }
};

const DocumentView = () => {
  let { name } = useParams();
  const documents = useRecoilValue(documentsState);

  const document = documents[name!];

  if (!document) {
    return <Navigate to="/" />;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      p={3}
      boxSizing="border-box"
      width="100%"
      sx={{
        maxHeight: "100%",
        overflow: "scroll",
      }}
    >
      {renderDocument(document)}
    </Box>
  );
};

export default DocumentView;
