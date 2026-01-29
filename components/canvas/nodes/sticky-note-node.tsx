import { memo } from 'react';
import { NodeProps, NodeResizer, Node } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';

interface StickyNoteData extends Record<string, unknown> {
  content: string;
  color: 'yellow' | 'pink' | 'cyan' | 'purple';
  onChange?: (content: string) => void;
}

type StickyNoteNodeType = Node<StickyNoteData, 'stickyNote'>;

const colorClasses = {
  yellow: 'bg-yellow-200 border-yellow-300 text-yellow-900',
  pink: 'bg-pink-200 border-pink-300 text-pink-900',
  cyan: 'bg-cyan-200 border-cyan-300 text-cyan-900',
  purple: 'bg-purple-200 border-purple-300 text-purple-900',
};

function StickyNoteNode({ data, selected }: NodeProps<StickyNoteNodeType>) {
  const colorClass = colorClasses[data.color || 'yellow'];

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
      />
      <div className={`sticky-note-node ${colorClass} rounded shadow-md p-3 min-w-[120px] min-h-[120px] border transition-all duration-200`}>
        <Textarea
          value={data.content || ''}
          onChange={(e) => data.onChange?.(e.target.value)}
          className="bg-transparent border-none resize-none focus:ring-0 p-0 text-sm h-full w-full placeholder:text-current/50"
          placeholder="Add a note..."
        />
      </div>
    </>
  );
}

export default memo(StickyNoteNode);
