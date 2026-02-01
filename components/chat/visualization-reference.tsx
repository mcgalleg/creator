'use client';

import { ExternalLink, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VisualizationReferenceProps {
  title: string;
  nodeId: string;
  componentType?: string;
  onViewOnCanvas?: () => void;
}

/**
 * A compact card that appears in chat messages referencing a visualization
 * that has been rendered on the canvas. Provides a link to view/focus the
 * visualization on the canvas without rendering the full component inline.
 */
export function VisualizationReference({
  title,
  componentType = 'Chart',
  onViewOnCanvas,
}: VisualizationReferenceProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg">
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-xs">
            {componentType}
          </Badge>
          <span className="text-xs text-muted-foreground">Added to canvas</span>
        </div>
      </div>

      {/* Action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewOnCanvas}
        className="flex-shrink-0 gap-1.5"
        aria-label={`View ${title} on canvas`}
      >
        <span className="hidden sm:inline">View</span>
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
}
