import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Printer,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle
} from '@/components/ui/dialog';

import { type IPdfElement } from 'client-types/';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PDFViewerProps {
  url: string;
  className?: string;
  startPage?: number;
  persistentToolbar?: boolean;
}

export function PDFViewer({
  url,
  className,
  startPage = 1,
  persistentToolbar = false
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(Math.max(1, startPage || 1));
  const [scale, setScale] = useState(1.0);
  const [isHovered, setIsHovered] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(
      startPage && startPage >= 1 && startPage <= numPages ? startPage : 1
    );
  }

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 3));
  };
  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };
  const prevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };
  const nextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`flex flex-col bg-muted/20 border border-border rounded-md min-h-[50vh] ${
        className || ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
    >
      {/* Sticky toolbar — lives in the normal flex flow so it never overlaps content */}
      <div
        className={`sticky top-0 z-10 shrink-0 flex flex-wrap items-center justify-between p-2 gap-2 bg-background/80 backdrop-blur-sm border-b border-border rounded-t-md transition-opacity duration-200 ${
          persistentToolbar || isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={prevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-16 text-center shadow-sm">
            {pageNumber} / {numPages || '?'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center shadow-sm">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={handlePrint}
            title="Print/Open PDF"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
            title="Download PDF"
          >
            <a
              href={url}
              download
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto w-full bg-muted/10">
        <div className="w-fit min-w-full flex justify-center p-2 md:p-4">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                Loading PDF...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-md bg-white max-w-full"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

interface Props {
  element: IPdfElement;
}

const PDFElement = ({ element }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPreviewWidth(el.clientWidth - 16);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!element.url) {
    return null;
  }

  // A standalone page or sidebar display
  if (element.display === 'side' || element.display === 'page') {
    return (
      <PDFViewer
        url={element.url}
        startPage={element.page}
        className={`${element.display}-pdf w-full h-[80vh] flex-1`}
      />
    );
  }

  // Inline display
  return (
    <>
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        aria-label="Open PDF in a larger view"
        className="inline-pdf relative group cursor-pointer border border-border rounded-md overflow-hidden bg-muted/20 w-full max-w-xs h-auto min-h-[160px] flex items-center justify-center hover:border-primary/50 transition-all p-2"
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <div className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm">
          <Maximize2 className="h-4 w-4 text-foreground" />
        </div>

        <div className="flex flex-col items-center justify-center pointer-events-none">
          <Document
            file={element.url}
            loading={
              <div className="text-xs text-muted-foreground">
                Loading preview...
              </div>
            }
          >
            <Page
              pageNumber={element.page || 1}
              width={previewWidth > 0 ? previewWidth : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-sm border border-border rounded-sm bg-white"
            />
          </Document>
          <div className="text-center mt-2">
            <span className="text-xs font-medium text-muted-foreground truncate w-full px-2 max-w-[200px] inline-block">
              {element.name || 'PDF Document'}
            </span>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80 z-50" />
          <DialogContent className="border-none bg-transparent shadow-none max-w-none p-2 md:p-4 w-[100vw] h-[100vh] md:w-[95vw] md:h-[95vh] flex flex-col [&>button]:hidden z-[60]">
            <DialogTitle className="sr-only">View PDF</DialogTitle>
            <DialogDescription className="sr-only">
              A modal with a larger view of the PDF.
            </DialogDescription>
            <div className="flex justify-end mb-2">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
            <div className="flex-1 w-full bg-background rounded-lg overflow-hidden flex flex-col">
              <PDFViewer
                url={element.url}
                startPage={element.page}
                persistentToolbar
                className="w-full h-full"
              />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export { PDFElement };
