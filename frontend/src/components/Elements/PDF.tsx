


// On force Next.js Ã  charger le moteur PDF uniquement cÃ´tÃ© navigateur (ssr: false)
const PDFElement = React.lazy(
  () => import('./PDFClient').then((mod) => mod.PDFElement),
  { 
    ssr: false, 
    loading: () => <p className="text-xs text-muted-foreground p-2">Chargement du lecteur PDF...</p> 
  }
);

const PDFViewer = React.lazy(
  () => import('./PDFClient').then((mod) => mod.PDFViewer),
  { ssr: false }
);

export { PDFElement, PDFViewer };