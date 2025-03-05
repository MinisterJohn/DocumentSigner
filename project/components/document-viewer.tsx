"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { DocumentState, Annotation } from "@/lib/types"
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/hooks/use-toast"
import * as pdfjsLib from "pdfjs-dist"

// Initialize PDF.js worker correctly
const workerSrc = `https://unpkg.com/pdfjs-dist@3.10.111/build/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;



interface DocumentViewerProps {
  documentState: DocumentState
  setDocumentState: React.Dispatch<React.SetStateAction<DocumentState>>
}

export function DocumentViewer({ documentState, setDocumentState }: DocumentViewerProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signaturePath, setSignaturePath] = useState<{ x: number; y: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [workerInitialized, setWorkerInitialized] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    setWorkerInitialized(true);
    setDebugInfo("PDF.js worker initialized successfully");
  }, []);
  
  // Load the PDF document using pdfjs-dist when a file is available.
  useEffect(() => {
    if (!documentState.file || !workerInitialized) {
      if (!documentState.file) {
        setIsLoading(false)
        setDebugInfo("No file provided")
      } else if (!workerInitialized) {
        setDebugInfo("Waiting for PDF.js worker to initialize")
      }
      return
    }

    setIsLoading(true)
    setDebugInfo(`Loading file: ${documentState.file.name}, size: ${documentState.file.size} bytes`)

    // Create a FileReader to read the file as an ArrayBuffer
    const fileReader = new FileReader()

    fileReader.onload = function () {
      setDebugInfo(`FileReader loaded successfully, result size: ${(this.result as ArrayBuffer).byteLength} bytes`)

      try {
        const typedArray = new Uint8Array(this.result as ArrayBuffer)
        setDebugInfo(`Creating typed array, length: ${typedArray.length}`)

        // Simplified PDF loading configuration
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
        })

        setDebugInfo("PDF loading task created, waiting for promise...")

        loadingTask.promise
          .then((pdf) => {
            setDebugInfo(`PDF loaded successfully, pages: ${pdf.numPages}`)
            setPdfDocument(pdf)
            setDocumentState((prev) => ({
              ...prev,
              totalPages: pdf.numPages,
              currentPage: prev.currentPage > 0 ? prev.currentPage : 1,
            }))
            setIsLoading(false)
          })
          .catch((error) => {
            console.error("Error loading PDF:", error)
            setDebugInfo(`PDF loading error: ${error.message}`)
            toast({
              title: "PDF Loading Error",
              description: `Failed to load the PDF document: ${error.message}`,
              variant: "destructive",
            })
            setIsLoading(false)
          })
      } catch (error: any) {
        console.error("Error processing file data:", error)
        setDebugInfo(`Error processing file data: ${error.message}`)
        toast({
          title: "PDF Processing Error",
          description: `Error processing the PDF file: ${error.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fileReader.onerror = () => {
      console.error("FileReader error:", fileReader.error)
      setDebugInfo(`FileReader error: ${fileReader.error}`)
      toast({
        title: "File Reading Error",
        description: "Failed to read the PDF file.",
        variant: "destructive",
      })
      setIsLoading(false)
    }

    // Read the file as an ArrayBuffer
    try {
      fileReader.readAsArrayBuffer(documentState.file)
      setDebugInfo("Started reading file as ArrayBuffer")
    } catch (error: any) {
      console.error("Error initiating file read:", error)
      setDebugInfo(`Error initiating file read: ${error.message}`)
      toast({
        title: "File Reading Error",
        description: `Failed to read the PDF file: ${error.message}`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }, [documentState.file, setDocumentState, workerInitialized, toast]) // Added toast to dependencies

  // Render the selected page from the PDF document along with annotations.
  const renderPage = async (pdf: PDFDocumentProxy, pageNumber: number, scale: number) => {
    try {
      setDebugInfo(`Rendering page ${pageNumber} at scale ${scale}`)
      const page = await pdf.getPage(pageNumber)
      const canvas = canvasRef.current
      if (!canvas) {
        setDebugInfo("Canvas ref is null, cannot render page")
        return
      }

      const viewport = page.getViewport({ scale })
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setDebugInfo("Failed to get 2D context from canvas")
        return
      }

      // Set canvas dimensions to match viewport
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      setDebugInfo(`Canvas dimensions set to ${viewport.width}x${viewport.height}`)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Render the PDF page
      const renderContext = {
        canvasContext: ctx,
        viewport,
      }

      try {
        setDebugInfo("Starting page render")
        await page.render(renderContext).promise
        setDebugInfo("Page rendered successfully")
        // After the PDF page is rendered, draw annotations on top
        renderAnnotations(ctx)
      } catch (error: any) {
        console.error("Error rendering PDF page:", error)
        setDebugInfo(`Error rendering PDF page: ${error.message}`)
        toast({
          title: "Rendering Error",
          description: `Failed to render the PDF page: ${error.message}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error getting PDF page:", error)
      setDebugInfo(`Error getting PDF page: ${error.message}`)
      toast({
        title: "Page Error",
        description: `Failed to get the PDF page: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Draw the annotations over the rendered PDF page.
  const renderAnnotations = (ctx: CanvasRenderingContext2D) => {
    if (!ctx) return

    // Draw annotations for the current page.
    documentState.annotations
      .filter((ann) => ann.pageNumber === documentState.currentPage)
      .forEach((ann) => {
        switch (ann.type) {
          case "highlight":
            ctx.fillStyle = ann.color + "80" // Add transparency
            ctx.fillRect(ann.x, ann.y, ann.width || 0, ann.height || 0)
            break
          case "underline":
            ctx.strokeStyle = ann.color || "#000000"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(ann.x, ann.y + (ann.height || 0))
            ctx.lineTo(ann.x + (ann.width || 0), ann.y + (ann.height || 0))
            ctx.stroke()
            break
          case "comment":
            // Draw comment icon
            ctx.fillStyle = ann.color || "#4CAF50"
            ctx.beginPath()
            ctx.arc(ann.x, ann.y, 10, 0, 2 * Math.PI)
            ctx.fill()
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 12px sans-serif"
            ctx.fillText("?", ann.x - 3, ann.y + 4)
            break
          case "signature":
            if (ann.content) {
              try {
                const pathData = JSON.parse(ann.content)
                ctx.strokeStyle = "#1E40AF"
                ctx.lineWidth = 2
                ctx.beginPath()
                pathData.forEach((point: { x: number; y: number }, index: number) => {
                  const x = ann.x + point.x
                  const y = ann.y + point.y
                  if (index === 0) {
                    ctx.moveTo(x, y)
                  } else {
                    ctx.lineTo(x, y)
                  }
                })
                ctx.stroke()
              } catch (e) {
                console.error("Failed to parse signature data", e)
              }
            }
            break
        }
      })

    // Draw the current signature path while drawing.
    if (isDrawing && signaturePath.length > 1) {
      ctx.strokeStyle = "#1E40AF"
      ctx.lineWidth = 2
      ctx.beginPath()
      signaturePath.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    }
  }

  // Fix 6: Improve the useEffect for page rendering to include toast in dependencies
  useEffect(() => {
    if (pdfDocument && documentState.currentPage > 0) {
      renderPage(pdfDocument, documentState.currentPage, documentState.scale)
    }
  }, [pdfDocument, documentState.currentPage, documentState.scale, toast]) // Added toast to dependencies

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !documentState.currentTool) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / documentState.scale
    const y = (e.clientY - rect.top) / documentState.scale

    if (documentState.currentTool === "comment") {
      const content = prompt("Enter your comment:")
      if (content) {
        const newAnnotation: Annotation = {
          id: uuidv4(),
          type: "comment",
          x,
          y,
          content,
          pageNumber: documentState.currentPage,
          color: documentState.currentColor,
        }

        setDocumentState((prev) => ({
          ...prev,
          annotations: [...prev.annotations, newAnnotation],
        }))

        toast({
          title: "Comment added",
          description: "Your comment has been added to the document.",
        })
      }
    } else if (documentState.currentTool === "highlight" || documentState.currentTool === "underline") {
      const newAnnotation: Annotation = {
        id: uuidv4(),
        type: documentState.currentTool,
        x,
        y,
        width: 100, // Mock width
        height: 20, // Mock height
        pageNumber: documentState.currentPage,
        color: documentState.currentColor,
      }

      setDocumentState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newAnnotation],
      }))

      toast({
        title: `Text ${documentState.currentTool}ed`,
        description: `The selected text has been ${documentState.currentTool}ed.`,
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || documentState.currentTool !== "signature") return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / documentState.scale
    const y = (e.clientY - rect.top) / documentState.scale
    setSignaturePath([{ x, y }])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || documentState.currentTool !== "signature" || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / documentState.scale
    const y = (e.clientY - rect.top) / documentState.scale
    setSignaturePath((prev) => [...prev, { x, y }])
  }

  const handleMouseUp = () => {
    if (!isDrawing || documentState.currentTool !== "signature") return
    setIsDrawing(false)
    if (signaturePath.length > 1) {
      const xs = signaturePath.map((p) => p.x)
      const ys = signaturePath.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const newAnnotation: Annotation = {
        id: uuidv4(),
        type: "signature",
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        pageNumber: documentState.currentPage,
        content: JSON.stringify(
          signaturePath.map((p) => ({
            x: p.x - minX,
            y: p.y - minY,
          })),
        ),
      }

      setDocumentState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newAnnotation],
      }))

      toast({
        title: "Signature added",
        description: "Your signature has been added to the document.",
      })
    }
    setSignaturePath([])
  }

  const handlePrevPage = () => {
    if (documentState.currentPage > 1) {
      setDocumentState((prev) => ({
        ...prev,
        currentPage: prev.currentPage - 1,
      }))
    }
  }

  const handleNextPage = () => {
    if (documentState.currentPage < documentState.totalPages) {
      setDocumentState((prev) => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }))
    }
  }

  const handleZoomIn = () => {
    setDocumentState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.1, 2),
    }))
  }

  const handleZoomOut = () => {
    setDocumentState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.1, 0.5),
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={documentState.currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {documentState.currentPage} of {documentState.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={documentState.currentPage >= documentState.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={documentState.scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(documentState.scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={documentState.scale >= 2}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fix 7: Add debug info display */}
      {debugInfo && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-auto max-h-24">
          <p className="font-mono">Debug: {debugInfo}</p>
        </div>
      )}

      <Card className="p-4 flex justify-center overflow-auto">
        <div
          ref={containerRef}
          className={cn("relative transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          {!documentState.file && !isLoading && (
            <div className="flex items-center justify-center h-[500px] w-[400px] border border-dashed rounded-lg">
              <p className="text-muted-foreground">No document loaded</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn(
              "border shadow-sm",
              documentState.currentTool === "signature"
                ? "cursor-crosshair"
                : documentState.currentTool
                  ? "cursor-pointer"
                  : "cursor-default",
              !documentState.file && "hidden",
            )}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </Card>
    </div>
  )
}

