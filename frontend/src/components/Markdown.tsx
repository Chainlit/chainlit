
import { cn } from '@/lib/utils';
import { omit } from 'lodash';
import { useContext, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import 'katex/dist/katex.min.css';

import { ChainlitContext, type IMessageElement } from '@chainlit/react-client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import BlinkingCursor from './BlinkingCursor';
import CodeSnippet from './CodeSnippet';
import { ElementRef } from './Elements/ElementRef';
import {
  type AlertProps,
  MarkdownAlert,
  alertComponents,
  normalizeAlertType
} from './MarkdownAlert';

interface Props {
  allowHtml?: boolean;
  latex?: boolean;
  renderMarkdown?: boolean;
  refElements?: IMessageElement[];
  children: string;
  className?: string;
}

const cursorPlugin = () => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent) => {
      const placeholderPattern = /\u200B/g;
      const matches = [...(node.value?.matchAll(placeholderPattern) || [])];

      if (matches.length > 0) {
        const newNodes: any[] = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch] = match;
          const startIndex = match.index!;
          const endIndex = startIndex + fullMatch.length;

          if (startIndex > lastIndex) {
            newNodes.push({
              type: 'text',
              value: node.value!.slice(lastIndex, startIndex)
            });
          }

          newNodes.push({
            type: 'blinkingCursor',
            data: {
              hName: 'blinkingCursor',
              hProperties: { text: 'Blinking Cursor' }
            }
          });

          lastIndex = endIndex;
        });

        if (lastIndex < node.value!.length) {
          newNodes.push({
            type: 'text',
            value: node.value!.slice(lastIndex)
          });
        }

        parent!.children.splice(index, 1, ...newNodes);
      }
    });
  };
};

const Markdown = ({
  allowHtml,
  latex,
  renderMarkdown,
  refElements,
  className,
  children
}: Props) => {
  const apiClient = useContext(ChainlitContext);

  const rehypePlugins = useMemo(() => {
    let plugins: any[] = [];
    if (allowHtml) {
      plugins = [rehypeRaw, ...plugins];
    }
    if (latex) {
      plugins = [rehypeKatex, ...plugins];
    }
    return plugins;
  }, [allowHtml, latex]);

  const remarkPlugins = useMemo(() => {
    let plugins: any[] = [
      cursorPlugin,
      remarkGfm,
      remarkDirective,
      MarkdownAlert
    ];

    if (latex) {
      plugins = [...plugins, remarkMath];
    }
    return plugins;
  }, [latex]);

  if (renderMarkdown === false) {
    return (
      <pre
        className={cn('whitespace-pre-wrap break-words', className)}
        style={{ fontFamily: 'inherit' }}
      >
        {children}
      </pre>
    );
  }

  return (
    /* CORRECTION: On applique les classes de style sur une div parente 
      car react-markdown n'accepte plus className depuis la v9.
    */
    <div className={cn('prose lg:prose-xl max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          ...alertComponents,
          code(props) {
            return (
              <code
                {...omit(props, ['node'])}
                className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-white"
              />
            );
          },
          pre({ children, ...props }: any) {
            return <CodeSnippet {...props} />;
          },
          a({ children, ...props }) {
            const name = children as string;
            const element = refElements?.find((e) => e.name === name);
            if (element) {
              return <ElementRef element={element} />;
            } else {
              return (
                <a
                  {...props}
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  {children}
                </a>
              );
            }
          },
          img: (image: any) => {
            const src = image.src.startsWith('/public')
              ? apiClient.buildEndpoint(image.src)
              : image.src;

            const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.ogv', '.m4v'];
            const isVideo = videoExtensions.some((ext) =>
              src.toLowerCase().split(/[?#]/)[0].endsWith(ext)
            );

            if (isVideo) {
              return (
                <div className="my-4">
                  <video
                    src={src}
                    controls
                    className="w-full h-auto rounded-md"
                    style={{ maxWidth: '100%' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            }

            return (
              <div className="my-4">
                <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                  <img
                    src={src}
                    alt={image.alt}
                    className="h-full w-full object-contain"
                  />
                </AspectRatio>
              </div>
            );
          },
          blockquote(props) {
            return (
              <blockquote
                {...omit(props, ['node'])}
                className="mt-6 border-l-2 pl-6 italic border-primary/50"
              />
            );
          },
          ul(props) {
            return <ul {...omit(props, ['node'])} className="my-3 ml-3 list-disc pl-2" />;
          },
          ol(props) {
            return <ol {...omit(props, ['node'])} className="my-3 ml-3 list-decimal pl-2" />;
          },
          table({ children, ...props }) {
            return (
              <Card className="my-4 overflow-hidden">
                <Table {...(props as any)}>{children}</Table>
              </Card>
            );
          },
          // @ts-expect-error custom plugin
          blinkingCursor: () => <BlinkingCursor whitespace />,
          alert: ({ type, children, ...props }: AlertProps & { type?: string }) => {
            const alertType = normalizeAlertType(type || props.variant || 'info');
            return alertComponents.Alert({ variant: alertType, children });
          }
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export { Markdown };