import { memo, useEffect, useRef, useState } from 'react';
import { type ITextElement, useConfig } from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Markdown } from '@/components/Markdown';
import { Skeleton } from '@/components/ui/skeleton';

import { useFetch } from 'hooks/useFetch';

// Bokeh CDN URLs
const BOKEH_VERSION = '3.4.1';
const BOKEH_URLS = {
  js: [
    `https://cdn.bokeh.org/bokeh/release/bokeh-${BOKEH_VERSION}.min.js`,
    `https://cdn.bokeh.org/bokeh/release/bokeh-widgets-${BOKEH_VERSION}.min.js`,
    `https://cdn.bokeh.org/bokeh/release/bokeh-tables-${BOKEH_VERSION}.min.js`,
    `https://cdn.bokeh.org/bokeh/release/bokeh-api-${BOKEH_VERSION}.min.js`
  ],
  css: [
    `https://cdn.bokeh.org/bokeh/release/bokeh-${BOKEH_VERSION}.min.css`,
    `https://cdn.bokeh.org/bokeh/release/bokeh-widgets-${BOKEH_VERSION}.min.css`,
    `https://cdn.bokeh.org/bokeh/release/bokeh-tables-${BOKEH_VERSION}.min.css`
  ]
};

// Debug logger for Bokeh integration
const debugLog = (message: string, data?: any) => {
  const prefix = '[Bokeh Integration]';
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
};

// Function to check if content contains Bokeh plot data
const isBokehData = (content: string): boolean => {
  try {
    debugLog('Checking if content is Bokeh data');
    debugLog('Raw content:', content);
    
    const parsed = JSON.parse(content);
    debugLog('Parsed content:', parsed);

    const checks = {
      isObject: typeof parsed === 'object' && parsed !== null,
      hasTargetId: 'target_id' in parsed,
      hasRootId: 'root_id' in parsed,
      hasDoc: 'doc' in parsed,
      docIsObject: typeof parsed.doc === 'object' && parsed.doc !== null,
      hasRoots: parsed.doc && 'roots' in parsed.doc
    };

    debugLog('Bokeh data validation checks:', checks);

    const isValid = Object.values(checks).every(check => check === true);
    debugLog('Is valid Bokeh data:', isValid);

    return isValid;
  } catch (error) {
    debugLog('Failed to parse or validate Bokeh data:', error);
    debugLog('Invalid content:', content);
    return false;
  }
};

// Declare Bokeh types for window object
declare global {
  interface Window {
    Bokeh?: {
      embed?: {
        embed_item: (doc: any, target: string) => void;
      };
    };
  }
}

interface BokehRendererProps {
  data: string;
  plotId: string;
}

// Simpler Bokeh renderer component based on your previous implementation
// Add CSS to hide the Bokeh title
const style = document.createElement('style');
style.textContent = `
  .bokeh-no-title .bk-header {
    display: none !important;
  }
`;
document.head.appendChild(style);

const BokehRenderer = memo(({ data, plotId }: BokehRendererProps) => {
  const plotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadBokehResources = async () => {
      try {
        BOKEH_URLS.css.forEach(cssUrl => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = cssUrl;
          document.head.appendChild(link);
        });

        for (const jsUrl of BOKEH_URLS.js) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsUrl;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${jsUrl}`));
            document.head.appendChild(script);
          });
        }
      } catch (err) {
        console.error('Failed to load Bokeh resources:', err);
        setError('Failed to load plotting library');
      }
    };

    if (!window.Bokeh) {
      loadBokehResources();
    }
  }, []); 
  useEffect(() => {
    if (!plotRef.current) return;

    plotRef.current.innerHTML = '';

    try {
      const plotData = JSON.parse(data);
      
      if (window.Bokeh?.embed?.embed_item) {
        window.Bokeh.embed.embed_item(plotData, plotId);
      } else {
        const timer = setTimeout(() => {
          if (window.Bokeh?.embed?.embed_item) {
            window.Bokeh.embed.embed_item(plotData, plotId);
          } else {
            setError('Plotting library failed to initialize');
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to render plot:', err);
      setError(`Failed to render plot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [data, plotId]);

  if (error) {
    return (
      <Alert variant="error">
        {error}
      </Alert>
    );
  }

  return (
    <div
      ref={plotRef}
      id={plotId}
      style={{
        width: '100%',
        minWidth: '600px',
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      className="bokeh-no-title"
    />
  );
});

interface SmartTextElementProps {
  element: ITextElement;
}

const SmartTextElement = ({ element }: SmartTextElementProps) => {
  const { data, error, isLoading } = useFetch(element.url || null);
  const { config } = useConfig();
  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  if (isLoading) {
    return <Skeleton className="h-4 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="error">An error occurred while loading the content</Alert>
    );
  }

  let content = data || '';

  const isBokehElement = element.name?.includes('bokeh_plot') || element.name?.includes('voltage_time_plot') || element.name?.includes('plot');
  const containsBokehData = isBokehData(content);

  if ((isBokehElement || containsBokehData) && content.trim()) {
    const plotId = `plot-${element.id}-${Date.now()}`;
    return (
      <div className={`${element.display}-bokeh`}>
        <BokehRenderer data={content} plotId={plotId} />
      </div>
    );
  }

  // Regular text element processing
  if (element.language) {
    content = `\`\`\`${element.language}\n${content}\n\`\`\``;
  }

  return (
    <Markdown
      allowHtml={allowHtml}
      latex={latex}
      className={`${element.display}-text`}
    >
      {content}
    </Markdown>
  );
};

export { SmartTextElement }; 