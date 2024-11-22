import { ReactElement, useCallback, useEffect, useState, useMemo } from "react";
import mermaid, { RenderResult } from 'mermaid';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNewOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { ClipboardCopy } from 'components/atoms/ClipboardCopy';

import { MouseEvent } from "react";

export interface MermaidDiagramProps {
  children: string,
  id?: string,
  testId?: string,
  className?: string,
  onClick?: (event: MouseEvent<HTMLElement>) => void,
  onError?: (error: any) => void,
}

const MermaidDiagram = (props: MermaidDiagramProps): ReactElement => {
  const [showSource, setShowSource] = useState(false);
  const [element, setElement] = useState<HTMLDivElement>();
  const [render_result, setRenderResult] = useState<RenderResult>();

  const container_id = `${props.id || 'd' + Date.now()}-mermaid`;
  const diagram_text = props.children;

  // initialize mermaid here, but beware that it gets called once for every instance of the component
  useEffect(() => {
    // wait for page to load before initializing mermaid
    mermaid.initialize({
      startOnLoad: true,
      // securityLevel: "loose",
      // theme: "forest",
      logLevel: 5
    });
  }, []);

  // hook to track updates to the component ref, compatible with useEffect unlike useRef
  const updateDiagramRef = useCallback((elem: HTMLDivElement) => {
    if (!elem) return;
    setElement(elem);
  }, []);

  // hook to update the component when either the element or the rendered diagram changes
  useEffect(() => {
    if (showSource) return;
    if (!element) return;
    if (!render_result?.svg) return;
    element.innerHTML = render_result.svg;
    render_result.bindFunctions?.(element);
  }, [
    element,
    render_result,
    showSource,
  ]);

  // hook to handle the diagram rendering
  useEffect(() => {
    if (!diagram_text || diagram_text.length === 0) return;
    // create async function inside useEffect to cope with async mermaid.run
    (async () => {
      try {
        const rr = await mermaid.render(`${container_id}-svg`, diagram_text);
        setRenderResult(rr);
      } catch (e: any) {
        props.onError?.(e);
      }
    })();
  }, [
    diagram_text
  ]);

  const mermaidUrl = useMemo<string>(() => {
    const mermaidState: any = {
      code: diagram_text,
      mermaid: {
        theme: 'default'
      },
      autoSync: true,
      rough: false,
      updateDiagram: true
    };

    return `https://mermaid.live/edit#base64:${window.btoa(JSON.stringify(mermaidState))}`;
  }, [diagram_text]);

  // render container (div) to hold diagram (nested SVG)
  return (
    <Paper sx={{ position: 'relative', width: '100%', boxShadow: 0, overflow: 'hidden', padding: 2, boxSizing: 'border-box' }}>
      <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
        <Tooltip
          title={'Open in Mermaid Live'}
        >
          <IconButton onClick={() => window.open(mermaidUrl, '_blank')}>
            <OpenInNewIcon sx={{ width: 20, height: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={'Show graph source'}
        >
          <IconButton onClick={() => setShowSource(true)}>
            <ArticleIcon sx={{ width: 20, height: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <style>
        {`.markdown-body .mermaid-diagram p {
          white-space: nowrap;
          font-size: 14px;
        }`}
      </style>
      <div className={`mermaid-diagram ${props.className}`}
        onClick={props.onClick}
        id={container_id}
        data-testid={props.testId}
        ref={updateDiagramRef}
      />
      {showSource && (
        <Card sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          bottom: 10,
          left: 10,
          boxShadow: 3,
          backgroundColor: 'white',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'absolute', top: 5, right: 15, color: 'gray.500' }}>
            <ClipboardCopy value={diagram_text} />
            <Tooltip
              title={'Close'}
            >
              <IconButton onClick={() => setShowSource(false)}>
                <CloseIcon sx={{ width: 20, height: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: 2,
            overflow: 'auto',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <code
              style={{
                whiteSpace: 'pre-wrap'
              }}
            >
              {diagram_text}
            </code>
          </Box>
        </Card>
      )}
    </Paper>
  );
}

export { MermaidDiagram };