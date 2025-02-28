import { useCallback, useEffect, useState, useMemo, ReactElement } from "react";
import mermaid, { RenderResult } from "mermaid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { X, ExternalLink, FileText } from "lucide-react";
import { deflate } from "pako";
import { fromUint8Array } from "js-base64";
import { MouseEvent } from "react";
import CopyButton from "./CopyButton";
import { LoaderCircle } from "lucide-react"

export interface MermaidDiagramProps {
  children: string;
  id?: string;
  testId?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onError?: (error: any) => void;
}

const MermaidDiagram = ({ children, id, testId, className, onClick }: MermaidDiagramProps): ReactElement => {
  const [showSource, setShowSource] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult>();

  const containerId = `${id || "d" + Date.now()}-mermaid`;
  const diagramText = children;

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, logLevel: 5 });
  }, []);

  const updateDiagramRef = useCallback((elem: HTMLDivElement) => {
    if (!elem) return;
    setElement(elem);
  }, []);

  useEffect(() => {
    if (showSource || !element || !renderResult?.svg) return;
    element.innerHTML = renderResult.svg;
    renderResult.bindFunctions?.(element);
  }, [element, renderResult, showSource]);

  useEffect(() => {
    if (!diagramText) return;
    (async () => {
      try {
        const isValid = await mermaid.parse(diagramText, { suppressErrors: true });
        if (!isValid) return setRenderResult(undefined);
        const rr = await mermaid.render(`${containerId}-svg`, diagramText);
        setRenderResult(rr);
      } catch { }
    })();
  }, [diagramText]);

  const mermaidUrl = useMemo<string>(() => {
    try {
      const formatJSON = (data: unknown): string => JSON.stringify(data, undefined, 2);
      const serialize = (state: string): string => {
        const data = new TextEncoder().encode(state);
        const compressed = deflate(data, { level: 9 });
        return fromUint8Array(compressed, true);
      }
      const mermaidState: any = {
        code: diagramText,
        mermaid: formatJSON({
          theme: 'default'
        }),
        autoSync: false,
        rough: false,
        updateDiagram: true,
      };

      const json = JSON.stringify(mermaidState);
      const serialized = serialize(json);

      return `https://mermaid.live/edit#pako:${serialized}`;
    } catch (error) {
      return '';
    }
  }, [diagramText]);

  if (renderResult == undefined) {
    return (
      <div className='flex justify-center p-4 bg-white shadow rounded-lg '>
        Generating mermaid diagram...
      </div>
    )
  }
  return (
    <div className="relative w-full p-4 bg-white shadow rounded-lg overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-2">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => window.open(mermaidUrl, "_blank")}>
                <ExternalLink className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in Mermaid Live</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowSource(true)}>
                <FileText className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show graph source</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className={`mermaid-diagram ${className}`} id={containerId} data-testid={testId} ref={updateDiagramRef} onClick={onClick} />
      {showSource && (
        <Card className="absolute inset-2 p-4 bg-white shadow-lg flex flex-col">
          <div className="absolute top-2 right-2 flex gap-2">
            <CopyButton content={diagramText} />
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowSource(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <pre className="font-mono text-sm whitespace-pre-wrap p-2 overflow-auto h-full">{diagramText}</pre>
        </Card>
      )}
    </div>
  );
};

export { MermaidDiagram };
