import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import createCache from "@emotion/cache";
import { CacheProvider } from '@emotion/react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';

import {
  Realm,
} from "@mdxeditor/gurx";

import {
  MDXEditor,
  diffSourcePlugin,
  markdownShortcutPlugin,
  AdmonitionDirectiveDescriptor,
  DirectiveDescriptor,
  directivesPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  SandpackConfig,
  codeBlockPlugin,
  codeMirrorPlugin,
  sandpackPlugin,
  MDXEditorMethods,
  CodeMirrorEditor,
} from '@mdxeditor/editor';
import mdxCss from '@mdxeditor/editor/style.css?inline';
import mdxCustomCss from './custom.css?inline';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import MDXEditorToolbar from './MDXEditorToolbar';

// import {
//   SelectionContext,
//   evoyaAiPlugin,
//   replaceSelectionContent$,
//   highlightSelectionContent$,
//   evoyaAiState$,
// } from './plugins/evoyaAiPlugin';

import {
  evoyaAiPlugin,
  replaceSelectionContent$,
  evoyaAiState$,
} from './plugins/evoyaAi';

import {
  evoyaMathPlugin,
} from './plugins/math';

import {
  evoyaRootPlugin,
} from './plugins/extend/root';

import {
  CodeSelectionContext,
  SelectionContext,
} from "types";

import {
  tablePlugin as evoyaTablePlugin,
} from './plugins/extend/table';

import {
  MermaidCodeEditorDescriptor,
  EvoyaCodeEditorDescriptor,
  evoyaCodePlugin,
} from './plugins/extend/codeblocks';

import EvoyaLogo from '@/svg/EvoyaLogo';
import HandPointer from '@/svg/HandPointer';
import { IStep } from 'client-types/*';

import {
  messageBuilder,
  messageParser,
} from './utils/message';

import {
  getSvgIcon,
} from './utils/icons';

export default function MDXEditorWrapper() {
  const {
    creatorType,
    creatorContent,
    setCreatorContent,
  } = useEvoyaCreator();
  const [mdContent, setMdContent] = useState(creatorContent);
  const [editorSelectionContext, setEditorSelectionContext] = useState<SelectionContext | null>(null);
  const [editorSelectionMessageContext, setEditorSelectionMessageContext] = useState<SelectionContext | null>(null);
  const [mdxRealm, setMdxRealm] = useState<Realm|null>(null);
  const mdxEditorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLElement>(null);

  const handleRemoveContext = useCallback(() => {
    // setEditorSelectionContext({
    //   lexical: null,
    //   markdown: null,
    //   selectionType: 'document',
    //   insertType: 'replace'
    // });
    setEditorSelectionContext({
      lexical: null,
      markdown: null,
      selectionType: null,
      insertType: null
    });
    mdxRealm?.pub(evoyaAiState$, null);
  }, [mdxRealm]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.getEvoyaCreatorContent = mdxEditorRef.current.getMarkdown;
    console.log(mdxEditorRef.current);

    return () => {
      // @ts-expect-error is not a valid prop
      window.getEvoyaCreatorContent = () => null;
    }
  }, [mdxEditorRef]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendCreatorMessage = (message) => {
      // const creatorMessage = {
      //   ...message,
      //   metadata: {
      //     canvas: {
      //       content: mdContent,
      //       selection: editorSelectionMessageContext?.markdown
      //     }
      //   }
      // }

      const newMsg = messageBuilder(editorSelectionContext, message, mdContent);

      // @ts-expect-error is not a valid prop
      window.sendChainlitMessage(newMsg);
      // window.sendChainlitMessage({
      //   ...message,
      //   output: newMsg
      // });

      console.log('context', editorSelectionContext);
      setEditorSelectionMessageContext(editorSelectionContext);
    }

    // @ts-expect-error is not a valid prop
    window.testCreatorUpdate = (message) => {
      const parsedMessage = messageParser(message.output);
      // mdxRealm?.pub(replaceSelectionContent$, {message: message.output, context: editorSelectionContext});
      mdxRealm?.pub(replaceSelectionContent$, {message: parsedMessage, context: editorSelectionContext});
    }

  }, [mdxRealm, mdContent, editorSelectionContext]);

  /*useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.highlightSelection = () => {
      // mdxRealm?.pub(highlightSelectionContent$, editorSelectionContext);
    }
  }, [mdxRealm, editorSelectionContext]);*/

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.updateEvoyaCreator = (message: IStep, parent: any) => {
      console.log(message, parent);
      console.log(message.output);
      console.log(editorSelectionMessageContext);
      const parsedMessage = messageParser(message.output);
      console.log(parsedMessage);
      mdxRealm?.pub(replaceSelectionContent$, {message: parsedMessage, context: editorSelectionMessageContext});

      return parsedMessage.feedback;
    };
  }, [mdxRealm, editorSelectionMessageContext]);

  const stylesCache = createCache({
    key: "creator-portal", // <style data-emotion="your-key">...
    container: document.getElementById('chainlit-copilot')?.shadowRoot?.getElementById('evoya-creator-context-ref'),
  });

  return (
    <>
    {createPortal(
      <div
        style={{
          backgroundColor: 'white',
          padding: '.5rem 1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #f4f4f4',
          margin: '0 -1rem'
        }}
      >
        <CacheProvider value={stylesCache}>
          {(editorSelectionContext?.selectionType === "range" || editorSelectionContext?.selectionType === "node") && (
            <Chip
              sx={{ fontWeight: 'bold' }}
              label="Partial"
              variant="outlined"
              onDelete={handleRemoveContext}
              avatar={
                <Avatar sx={{ bgcolor: '#eeeeee' }}>
                  <HandPointer color='#FF2E4E' />
                </Avatar>
              }
            />
          )}
          {editorSelectionContext?.selectionType === "document" && (
            <Chip
              sx={{ fontWeight: 'bold' }}
              label="Everything"
              variant="outlined"
              onDelete={handleRemoveContext}
              avatar={
                <Avatar sx={{ bgcolor: '#eeeeee' }}>
                  <HandPointer color='#FF2E4E' />
                </Avatar>
              }
            />
          )}
          {editorSelectionContext?.selectionType === "codeblock" && (
            <Chip
              sx={{ fontWeight: 'bold' }}
              label={editorSelectionContext.selectedCode ? "Code Selection" : "Code Block"}
              variant="outlined"
              onDelete={handleRemoveContext}
              avatar={
                <Avatar sx={{ bgcolor: '#eeeeee' }}>
                  <HandPointer color='#FF2E4E' />
                </Avatar>
              }
            />
          )}
        </CacheProvider>
      </div>,
      document.getElementById('chainlit-copilot')?.shadowRoot?.getElementById('evoya-creator-context-ref')
    )}
    <Box
      ref={containerRef}
      sx={{
        overflow: 'auto',
        height: '100%'
      }}
    >
      <style type="text/css">
        {mdxCss}
        {mdxCustomCss}
      </style>
      <MDXEditor
        className="evoya-creator-editor"
        ref={mdxEditorRef}
        markdown={creatorContent}
        iconComponentFor={getSvgIcon}
        plugins={[
          ...MDX_PLUGINS,
          evoyaAiPlugin({
            containerRef,
            creatorType,
            setSelectionContext: (context: SelectionContext | null) => {
              console.log('selectionContext', context);
              setEditorSelectionContext(context);
            },
            setRealm: setMdxRealm
          }),
          evoyaTablePlugin({
            containerRef,
            setSelectionContext: (context: SelectionContext | null) => {
              console.log('selectionContext', context);
              setEditorSelectionContext(context);
            },
          }),
          evoyaMathPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: creatorContent }),
        ]}
        // readOnly={false}
        onChange={(md) => {
          // console.log(md);
          // setCreatorContent(md);
          setMdContent(md);
          localStorage.setItem('evoya-creator', JSON.stringify({
            content: md,
            type: 'markdown'
          }));
        }}
      />
    </Box>
    </>
  );
}

export const MDX_PLUGINS = [
  toolbarPlugin({ toolbarContents: () => <MDXEditorToolbar /> }),
  listsPlugin(),
  quotePlugin(),
  headingsPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  // imagePlugin({
  //   imageAutocompleteSuggestions: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
  //   imageUploadHandler: async () => Promise.resolve('https://picsum.photos/200/300')
  // }),
  imagePlugin({}),
  // tablePlugin(),
  thematicBreakPlugin(),
  // frontmatterPlugin(),
  codeBlockPlugin({
    codeBlockEditorDescriptors: [
      MermaidCodeEditorDescriptor,
      EvoyaCodeEditorDescriptor,
      // { priority: -10, match: (_) => true, Editor: CodeMirrorEditor }
    ]
  }),
  evoyaCodePlugin({
    codeBlockLanguages: {
      python: 'Python',
      javascript: 'JavaScript',
      json: 'JSON',
      vega: 'Vega',
      mermaid: 'Mermaid',
      css: 'CSS',
      markdown: 'Markdown',
      txt: 'Plain Text',
      typescript: 'TypeScript',
      '': 'Unspecified'
    }
  }),
  evoyaRootPlugin(),
  // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
  // codeMirrorPlugin({
  //   codeBlockLanguages: {
  //     js: 'JavaScript',
  //     json: 'JSON',
  //     vega: 'Vega',
  //     mermaid: 'Mermaid',
  //     mmd: 'Mermaid',
  //     markdown: 'Markdown',
  //     css: 'CSS',
  //     txt: 'Plain Text',
  //     plaintext: 'Plain Text',
  //     tsx: 'TypeScript',
  //     '': 'Unspecified'
  //   }
  // }),
  markdownShortcutPlugin(),
];