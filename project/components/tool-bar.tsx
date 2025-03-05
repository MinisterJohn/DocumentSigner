"use client";

import { DocumentState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Highlighter, 
  Underline, 
  MessageSquare, 
  PenTool, 
  MousePointer, 
  Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ToolBarProps {
  documentState: DocumentState;
  setDocumentState: React.Dispatch<React.SetStateAction<DocumentState>>;
}

export function ToolBar({ documentState, setDocumentState }: ToolBarProps) {
  const { toast } = useToast();
  
  const handleToolSelect = (tool: DocumentState['currentTool']) => {
    setDocumentState(prev => ({
      ...prev,
      currentTool: prev.currentTool === tool ? null : tool,
    }));
  };

  const handleColorSelect = (color: string) => {
    setDocumentState(prev => ({
      ...prev,
      currentColor: color,
    }));
  };

  const handleClearAnnotations = () => {
    if (documentState.annotations.length === 0) {
      toast({
        title: "No annotations to clear",
        description: "There are no annotations on this document.",
      });
      return;
    }

    if (confirm('Are you sure you want to clear all annotations?')) {
      setDocumentState(prev => ({
        ...prev,
        annotations: [],
      }));
      
      toast({
        title: "Annotations cleared",
        description: "All annotations have been removed from the document.",
      });
    }
  };

  const colors = [
    { name: 'Yellow', value: '#FFEB3B' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Blue', value: '#2196F3' },
    { name: 'Red', value: '#F44336' },
    { name: 'Purple', value: '#9C27B0' },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Annotation Tools</CardTitle>
        <CardDescription>
          Select a tool to annotate your document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Tools</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                documentState.currentTool === 'select' && "bg-primary/10 border-primary/50"
              )}
              onClick={() => handleToolSelect('select')}
              title="Select"
              disabled={!documentState.file}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                documentState.currentTool === 'highlight' && "bg-primary/10 border-primary/50"
              )}
              onClick={() => handleToolSelect('highlight')}
              title="Highlight Text"
              disabled={!documentState.file}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                documentState.currentTool === 'underline' && "bg-primary/10 border-primary/50"
              )}
              onClick={() => handleToolSelect('underline')}
              title="Underline Text"
              disabled={!documentState.file}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                documentState.currentTool === 'comment' && "bg-primary/10 border-primary/50"
              )}
              onClick={() => handleToolSelect('comment')}
              title="Add Comment"
              disabled={!documentState.file}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                documentState.currentTool === 'signature' && "bg-primary/10 border-primary/50"
              )}
              onClick={() => handleToolSelect('signature')}
              title="Add Signature"
              disabled={!documentState.file}
            >
              <PenTool className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 text-destructive hover:text-destructive"
              onClick={handleClearAnnotations}
              title="Clear All Annotations"
              disabled={!documentState.file}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color.value}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  documentState.currentColor === color.value 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-muted"
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
                disabled={!documentState.file}
              />
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Tool</h3>
          <p className="text-sm text-muted-foreground">
            {documentState.currentTool 
              ? documentState.currentTool.charAt(0).toUpperCase() + documentState.currentTool.slice(1)
              : 'None selected'}
          </p>
          
          {documentState.currentTool === 'highlight' && (
            <p className="text-xs text-muted-foreground">
              Click on text to highlight it
            </p>
          )}
          
          {documentState.currentTool === 'underline' && (
            <p className="text-xs text-muted-foreground">
              Click on text to underline it
            </p>
          )}
          
          {documentState.currentTool === 'comment' && (
            <p className="text-xs text-muted-foreground">
              Click anywhere to add a comment
            </p>
          )}
          
          {documentState.currentTool === 'signature' && (
            <p className="text-xs text-muted-foreground">
              Click and drag to draw your signature
            </p>
          )}
        </div>

        {documentState.file && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Document Info</h3>
              <p className="text-xs text-muted-foreground">
                {documentState.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(documentState.file.size / 1024 / 1024).toFixed(2)} MB • {documentState.totalPages} pages
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}