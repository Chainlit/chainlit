import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import { Typography, Link, Stack } from "@mui/material";
import { IDocuments } from "state/document";
import InlinedDocuments from "./inlined";
import { memo } from "react";
import { IActions } from "state/action";
import DocumentRef from "./documentRef";
import ActionRef from "./actionRef";

interface Props {
  content: string;
  language?: string;
  documents: IDocuments;
  actions: IActions;
}

function prepareContent({ documents, actions, content, language }: Props) {
  const documentNames = Object.keys(documents);
  const documentRegexp = documentNames.length
    ? new RegExp(`(${documentNames.join("|")})`, "g")
    : undefined;

  const actionContents = Object.values(actions).map(a => a.trigger);
  const actionRegexp = actionContents.length
    ? new RegExp(`(${actionContents.join("|")})`, "g")
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

  if (actionRegexp) {
    preparedContent = preparedContent.replaceAll(actionRegexp, (match) => {
      // spaces break markdown links. The address in the link is not used anyway
      return `[${match}](${match.replaceAll(" ", "_")})`;
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
  actions,
  language,
}: Props) {
  const { preparedContent, inlinedDocuments } = prepareContent({
    content,
    language,
    documents,
    actions,
  });

  if (!preparedContent) return null;

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
          remarkPlugins={[remarkGfm]}
          className="markdown-body"
          components={{
            a({ node, className, children, ...props }) {
              const name = children[0] as string;
              const document = documents[name];
              const action = Object.values(actions).find(
                (a) => a.trigger === name
              );

              if (document) {
                return <DocumentRef document={document} />;
              } else if (action) {
                return <ActionRef action={action} />;
              } else {
                return (
                  <Link {...props} target="_blank">
                    {children}
                  </Link>
                );
              }
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
