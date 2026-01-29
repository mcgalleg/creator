import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';

interface TextNoteData {
  content: string;
  onChange?: (content: string) => void;
}

function TextNoteNode({ data, selected }: NodeProps) {
  const noteData = data as unknown as TextNoteData;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={80}
      />
      <div
        className="text-note-node bg-surface/80 border border-border rounded-md p-3 min-w-[150px] min-h-[80px] transition-all duration-200"
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <Textarea
            value={noteData.content || ''}
            onChange={(e) => noteData.onChange?.(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="bg-transparent border-none resize-none focus:ring-0 p-0 text-sm"
            placeholder="Type your note..."
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {noteData.content || 'Double-click to edit...'}
          </p>
        )}
      </div>
    </>
  );
}

export default memo(TextNoteNode);
