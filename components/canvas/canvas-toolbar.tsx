import { Panel } from '@xyflow/react';
import { Type, StickyNote, ZoomIn, ZoomOut, Maximize, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  onAddNode: (type: string, data?: Record<string, unknown>) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onShowHelp?: () => void;
  /** Whether we're on a mobile/tablet viewport */
  isMobile?: boolean;
}

export function CanvasToolbar({ onAddNode, onZoomIn, onZoomOut, onFitView, onShowHelp, isMobile }: CanvasToolbarProps) {
  // Touch-friendly button classes - minimum 44px tap target on mobile
  // Added transition classes for hover/active animations
  const buttonClass = cn(
    "transition-transform duration-150 hover:scale-105 active:scale-95",
    isMobile && "min-h-[44px] min-w-[44px]"
  );

  // Icon classes - slightly larger on mobile for better visibility
  const iconClass = isMobile ? "h-5 w-5" : "h-4 w-4";
  const colorDotClass = isMobile ? "w-4 h-4 rounded" : "w-3 h-3 rounded";

  return (
    <Panel position="bottom-center" className="canvas-toolbar">
      <div className={cn(
        "flex items-center bg-surface border border-border rounded-lg shadow-lg",
        isMobile ? "gap-0.5 p-1.5" : "gap-1 p-1"
      )}>
        {/* Add nodes */}
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddNode('text-note', { content: '' })}
          title="Add text note (N)"
          className={buttonClass}
        >
          <Type className={iconClass} />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddNode('sticky-note', { content: '', color: 'yellow' })}
          title="Add sticky note (S)"
          className={buttonClass}
        >
          <StickyNote className={iconClass} />
        </Button>

        <Separator orientation="vertical" className={cn(isMobile ? "h-8" : "h-6", "mx-1")} />

        {/* Sticky note colors - show fewer on mobile to save space */}
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddNode('sticky-note', { content: '', color: 'yellow' })}
          title="Yellow sticky"
          className={buttonClass}
        >
          <span className={cn(colorDotClass, "bg-yellow-400")} />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={() => onAddNode('sticky-note', { content: '', color: 'pink' })}
          title="Pink sticky"
          className={buttonClass}
        >
          <span className={cn(colorDotClass, "bg-pink-400")} />
        </Button>
        {/* Hide cyan on mobile to save space */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddNode('sticky-note', { content: '', color: 'cyan' })}
            title="Cyan sticky"
          >
            <span className={cn(colorDotClass, "bg-cyan-400")} />
          </Button>
        )}

        <Separator orientation="vertical" className={cn(isMobile ? "h-8" : "h-6", "mx-1")} />

        {/* Zoom controls */}
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={onZoomIn}
          title="Zoom in"
          className={buttonClass}
        >
          <ZoomIn className={iconClass} />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={onZoomOut}
          title="Zoom out"
          className={buttonClass}
        >
          <ZoomOut className={iconClass} />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "default" : "sm"}
          onClick={onFitView}
          title="Fit view (F)"
          className={buttonClass}
        >
          <Maximize className={iconClass} />
        </Button>

        {/* Help - hide keyboard shortcuts button on mobile since they're not useful */}
        {!isMobile && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="sm" onClick={onShowHelp} title="Keyboard shortcuts (?)">
              <Keyboard className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Panel>
  );
}
