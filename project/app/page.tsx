"use client";

import { useState } from 'react';
import { DocumentUploader } from '@/components/document-uploader';
import { DocumentViewer } from '@/components/document-viewer';
import { ToolBar } from '@/components/tool-bar';
import { DocumentState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb } from 'pdf-lib';

export default function Home() {
  const { toast } = useToast();
  const [documentState, setDocumentState] = useState<DocumentState>({
    file: null,
    annotations: [],
    currentPage: 1,
    totalPages: 0,
    scale: 1,
    currentTool: null,
    currentColor: '#FFEB3B',
  });

  const handleFileUpload = (file: File) => {
    setDocumentState({
      ...documentState,
      file,
      annotations: [],
      currentPage: 1,
    });
    
    toast({
      title: "Document uploaded",
      description: `${file.name} has been successfully loaded.`,
    });
  };

  const processPDFWithAnnotations = async (file: File, annotations: any[]) => {
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    annotations.forEach(({ page, x, y, text, color }) => {
      if (pages[page]) {
        pages[page].drawText(text, {
          x,
          y,
          size: 12,
          color: rgb(color.r, color.g, color.b),
        });
      }
    });
    
    const modifiedPdfBytes = await pdfDoc.save();
    return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  };

  const handleExport = async () => {
    if (!documentState.file) {
      toast({
        title: "No document to export",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting document",
      description: "Your annotated document is being prepared...",
    });

    try {
      const annotatedBlob = await processPDFWithAnnotations(documentState.file, documentState.annotations);
      const url = URL.createObjectURL(annotatedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotated-${documentState.file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Your annotated document has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while processing the document.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6" />
            <span>Document Signer & Annotation Tool</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={!documentState.file}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-6 p-4 sm:p-6 md:px-8">
        <div className="flex flex-col gap-4">
          <ToolBar 
            documentState={documentState} 
            setDocumentState={setDocumentState} 
          />
        </div>
        <div className="flex flex-col gap-4">
          {!documentState.file ? (
            <DocumentUploader onFileUpload={handleFileUpload} />
          ) : (
            <DocumentViewer 
              documentState={documentState} 
              setDocumentState={setDocumentState} 
            />
          )}
        </div>
      </div>
    </main>
  );
}
