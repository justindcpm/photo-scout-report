import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Square, Circle, ArrowRight, Type, Trash2, Download, Undo, Redo } from 'lucide-react';

interface Annotation {
  id: string;
  type: 'arrow' | 'rectangle' | 'circle' | 'text' | 'freehand';
  points: number[];
  text?: string;
  color: string;
  strokeWidth: number;
  fontSize?: number;
}

interface PhotoAnnotationProps {
  imageUrl: string;
  onAnnotationsChange: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[];
}

export const PhotoAnnotation = ({ imageUrl, onAnnotationsChange, initialAnnotations = [] }: PhotoAnnotationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<Annotation['type']>('arrow');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [color, setColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.width, height: image.height });
      redrawCanvas();
    };
    image.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    redrawCanvas();
    onAnnotationsChange(annotations);
  }, [annotations, imageSize, onAnnotationsChange]);

  const addToHistory = useCallback((newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAnnotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSize.width) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    const image = new Image();
    image.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = image.width / image.height;
      const canvasAspectRatio = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (aspectRatio > canvasAspectRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / aspectRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * aspectRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      // Draw annotations
      annotations.forEach(annotation => {
        drawAnnotation(ctx, annotation, offsetX, offsetY, drawWidth, drawHeight, image.width, image.height);
      });
    };
    image.src = imageUrl;
  };

  const drawAnnotation = (
    ctx: CanvasRenderingContext2D, 
    annotation: Annotation, 
    offsetX: number, 
    offsetY: number, 
    drawWidth: number, 
    drawHeight: number, 
    imageWidth: number, 
    imageHeight: number
  ) => {
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.fillStyle = annotation.color;

    // Scale points from image coordinates to canvas coordinates
    const scaleX = drawWidth / imageWidth;
    const scaleY = drawHeight / imageHeight;
    
    const scaledPoints = annotation.points.map((point, index) => {
      if (index % 2 === 0) {
        return point * scaleX + offsetX; // x coordinate
      } else {
        return point * scaleY + offsetY; // y coordinate
      }
    });

    switch (annotation.type) {
      case 'arrow':
        if (scaledPoints.length >= 4) {
          drawArrow(ctx, scaledPoints[0], scaledPoints[1], scaledPoints[2], scaledPoints[3]);
        }
        break;
      case 'rectangle':
        if (scaledPoints.length >= 4) {
          const width = scaledPoints[2] - scaledPoints[0];
          const height = scaledPoints[3] - scaledPoints[1];
          ctx.strokeRect(scaledPoints[0], scaledPoints[1], width, height);
        }
        break;
      case 'circle':
        if (scaledPoints.length >= 4) {
          const centerX = (scaledPoints[0] + scaledPoints[2]) / 2;
          const centerY = (scaledPoints[1] + scaledPoints[3]) / 2;
          const radius = Math.abs(scaledPoints[2] - scaledPoints[0]) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 'freehand':
        if (scaledPoints.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(scaledPoints[0], scaledPoints[1]);
          for (let i = 2; i < scaledPoints.length; i += 2) {
            ctx.lineTo(scaledPoints[i], scaledPoints[i + 1]);
          }
          ctx.stroke();
        }
        break;
      case 'text':
        if (scaledPoints.length >= 2 && annotation.text) {
          ctx.font = `${annotation.fontSize || fontSize}px Arial`;
          ctx.fillText(annotation.text, scaledPoints[0], scaledPoints[1]);
        }
        break;
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getImageCoordinates = (canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSize.width) return { x: canvasX, y: canvasY };

    const aspectRatio = imageSize.width / imageSize.height;
    const canvasAspectRatio = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (aspectRatio > canvasAspectRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / aspectRatio;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * aspectRatio;
      drawHeight = canvas.height;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    }

    const scaleX = imageSize.width / drawWidth;
    const scaleY = imageSize.height / drawHeight;
    
    return {
      x: (canvasX - offsetX) * scaleX,
      y: (canvasY - offsetY) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    const imageCoords = getImageCoordinates(x, y);

    if (currentTool === 'text' as Annotation['type']) {
      setTextPosition({ x: imageCoords.x, y: imageCoords.y });
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool,
      points: [imageCoords.x, imageCoords.y],
      color,
      strokeWidth,
      fontSize: currentTool === 'text' ? fontSize : undefined
    };

    if (currentTool === 'freehand') {
      newAnnotation.points = [imageCoords.x, imageCoords.y];
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const { x, y } = getCanvasCoordinates(e);
    const imageCoords = getImageCoordinates(x, y);

    if (currentTool === 'freehand') {
      setCurrentAnnotation(prev => prev ? {
        ...prev,
        points: [...prev.points, imageCoords.x, imageCoords.y]
      } : null);
    } else {
      setCurrentAnnotation(prev => prev ? {
        ...prev,
        points: [prev.points[0], prev.points[1], imageCoords.x, imageCoords.y]
      } : null);
    }
  };

  const handleMouseUp = () => {
    if (currentAnnotation && isDrawing) {
      const newAnnotations = [...annotations, currentAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  const addTextAnnotation = () => {
    if (textValue.trim()) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        points: [textPosition.x, textPosition.y],
        text: textValue,
        color,
        strokeWidth,
        fontSize
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
    setShowTextInput(false);
    setTextValue('');
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    addToHistory([]);
  };

  const removeLastAnnotation = () => {
    if (annotations.length > 0) {
      const newAnnotations = annotations.slice(0, -1);
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
  };

  const downloadAnnotatedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'annotated-image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Render current annotation preview
  useEffect(() => {
    if (currentAnnotation) {
      const tempAnnotations = [...annotations, currentAnnotation];
      setAnnotations(tempAnnotations);
      
      return () => {
        setAnnotations(annotations);
      };
    }
  }, [currentAnnotation]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex gap-1">
            <Button
              variant={currentTool === 'arrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('arrow')}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('rectangle')}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('circle')}
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'freehand' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('freehand')}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('text')}
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-8 p-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Width:</label>
            <Select value={String(strokeWidth)} onValueChange={(v) => setStrokeWidth(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1px</SelectItem>
                <SelectItem value="2">2px</SelectItem>
                <SelectItem value="3">3px</SelectItem>
                <SelectItem value="5">5px</SelectItem>
                <SelectItem value="8">8px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentTool === 'text' && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Size:</label>
              <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                  <SelectItem value="24">24px</SelectItem>
                  <SelectItem value="32">32px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-1 ml-auto">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={removeLastAnnotation}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearAnnotations}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAnnotatedImage}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-border rounded-lg cursor-crosshair w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {showTextInput && (
            <div className="absolute bg-background border rounded p-2 shadow-lg" style={{
              left: textPosition.x,
              top: textPosition.y
            }}>
              <div className="flex gap-2">
                <Input
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter text..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTextAnnotation();
                    } else if (e.key === 'Escape') {
                      setShowTextInput(false);
                      setTextValue('');
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={addTextAnnotation}>Add</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};