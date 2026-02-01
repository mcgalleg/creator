import { memo, useState } from 'react';
import { NodeProps, NodeResizer, Handle, Position } from '@xyflow/react';
import { Trash2, GripVertical, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalyticsRenderer } from '@/components/chat/analytics-renderer';
import { useCanvasActions } from '@/contexts/canvas-actions-context';
import type { UITree } from '@/hooks/use-analytics-chat';

interface AnalyticsCardData {
  title: string;
  uiTree?: UITree;
}

function AnalyticsCardNode({ id, data, selected }: NodeProps) {
  const cardData = data as unknown as AnalyticsCardData;
  const [isCompact, setIsCompact] = useState(false);
  const { removeNode } = useCanvasActions();

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={280}
        minHeight={isCompact ? 48 : 120}
        lineClassName="border-primary"
        handleClassName="bg-primary"
      />
      {/*
        Native-feeling node: transparent background lets canvas show through,
        minimal chrome, content is the star
      */}
      <div
        className={`
          analytics-card-node
          bg-background/95 backdrop-blur-sm
          border border-border/50
          rounded-xl shadow-xl
          overflow-hidden
          min-w-[280px]
          transition-all duration-200
          ${selected ? 'ring-2 ring-primary/50 border-primary/50' : 'hover:border-border'}
        `}
      >
        {/* Minimal header - only shows on hover or when selected */}
        <div
          className={`
            card-header flex items-center justify-between px-2 py-1.5
            bg-muted/30 border-b border-border/30
            transition-opacity duration-200
            ${selected ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
          `}
          style={{ opacity: selected ? 1 : undefined }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => { if (!selected) e.currentTarget.style.opacity = '0'; }}
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[180px]">
              {cardData.title || 'Analytics'}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className="h-5 w-5 p-0 hover:bg-muted"
            >
              {isCompact ? (
                <Maximize2 className="h-2.5 w-2.5 text-muted-foreground" />
              ) : (
                <Minimize2 className="h-2.5 w-2.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNode(id)}
              className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>

        {/* Content area - renders the actual React components natively */}
        {!isCompact && (
          <div className="card-content p-3 overflow-auto @container" style={{ maxHeight: '500px' }}>
            {cardData.uiTree ? (
              <div className="analytics-native-render @container">
                <AnalyticsRenderer tree={cardData.uiTree} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                No visualization data
              </div>
            )}
          </div>
        )}

        {/* Collapsed state shows just the title */}
        {isCompact && (
          <div className="px-3 py-2 text-sm font-medium truncate">
            {cardData.title || 'Analytics'}
          </div>
        )}
      </div>

      {/* Subtle connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-primary/50 !border-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-primary/50 !border-primary"
      />
    </>
  );
}

export default memo(AnalyticsCardNode);
