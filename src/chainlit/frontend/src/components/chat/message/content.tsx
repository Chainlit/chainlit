import { Link as RRLink } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { Typography, Link, Stack } from "@mui/material";
import { IDocuments, documentSideViewState } from "state/document";
import { useSetRecoilState } from "recoil";
import InlinedDocuments from "./inlined";
import { memo } from "react";

interface Props {
  content: string;
  language?: string;
  documents: IDocuments;
}

function prepareContent({ documents, content, language }: Props) {
  const documentNames = Object.keys(documents);
  const documentRegexp = documentNames.length
    ? new RegExp(`(${documentNames.join("|")})`, "g")
    : undefined;
  let preparedContent = content.trim();
  const inlinedDocuments: IDocuments = {};

  if (documentRegexp) {
    preparedContent = preparedContent.replaceAll(documentRegexp, (match) => {
      if (documents[match].display === "inline") {
        inlinedDocuments[match] = documents[match];
      }
      return `[${match}](${match})`;
    });
  }

  if (language) {
    preparedContent = `\`\`\`${language}\n${preparedContent}\n\`\`\``;
  }

  return { preparedContent, inlinedDocuments };
}

export default memo(function MessageContent({
  content,
  documents,
  language,
}: Props) {
  const setSideView = useSetRecoilState(documentSideViewState);
  const { preparedContent, inlinedDocuments } = prepareContent({
    content,
    language,
    documents,
  });

  return (
    <Stack width="100%">
      <Typography
        sx={{
          width: "100%",
          minHeight: "20px",
          fontSize: "1rem",
          lineHeight: "1.5rem",
          fontFamily: "Inter",
        }}
      >
        <ReactMarkdown
          className="markdown-body"
          components={{
            a({ node, className, children, ...props }) {
              const documentName = children[0] as string;
              const document = documents[documentName];

              if (!document) {
                return (
                  <Link {...props} target="_blank">
                    {children}
                  </Link>
                );
              }

              if (document.display === "inline") {
                return <span style={{ fontWeight: 700 }}>{children}</span>;
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
                  to={
                    document.display === "page"
                      ? `/document/${documentName}`
                      : "#"
                  }
                >
                  {children}
                </Link>
              );
            },
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  children={String(children).replace(/\n$/, "")}
                  style={a11yDark}
                  wrapLongLines
                  language={match[1]}
                  PreTag="div"
                />
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {preparedContent}
        </ReactMarkdown>
      </Typography>
      <InlinedDocuments inlined={inlinedDocuments} />
    </Stack>
  );
});
