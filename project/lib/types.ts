export type Annotation = {
  id: string;
  type: 'highlight' | 'underline' | 'comment' | 'signature';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  content?: string;
  pageNumber: number;
};

export type DocumentState = {
  file: File | null;
  annotations: Annotation[];
  currentPage: number;
  totalPages: number;
  scale: number;
  currentTool: 'select' | 'highlight' | 'underline' | 'comment' | 'signature' | null;
  currentColor: string;
};