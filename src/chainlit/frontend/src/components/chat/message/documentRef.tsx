import { IDocument, documentSideViewState } from "state/document";
import { Link as RRLink } from "react-router-dom";
import { Link } from "@mui/material";
import { useSetRecoilState } from "recoil";

interface Props {
  document: IDocument;
}

export default function DocumentRef({ document }: Props) {
  const setSideView = useSetRecoilState(documentSideViewState);

  if (document.display === "inline") {
    return <span style={{ fontWeight: 700 }}>{document.name}</span>;
  }

  return (
    <Link
      className="document-link"
      onClick={() => {
        if (document.display === "side") {
          setSideView(document);
        }
      }}
      component={RRLink}
      to={document.display === "page" ? `/document/${document.name}` : "#"}
    >
      {document.name}
    </Link>
  );
}
