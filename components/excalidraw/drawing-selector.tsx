"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingSelectorProps {
  drawings: Array<{
    id: number;
    name: string;
    isDefault: boolean;
  }>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
  disabled?: boolean;
}

export function DrawingSelector({
  drawings,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  disabled = false,
}: DrawingSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedDrawing = drawings.find((d) => d.id === selectedId);
  const canDeleteDrawing = drawings.length > 1;

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
  };

  const handleCreate = () => {
    onCreate();
    setOpen(false);
  };

  const handleRename = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRename(id);
    setOpen(false);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(id);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className="w-[200px] justify-between dark:hover:text-foreground"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedDrawing?.name ?? "Select Drawing"}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {drawings.map((drawing) => (
          <div
            key={drawing.id}
            className="group relative flex items-center"
          >
            <DropdownMenuItem
              className="flex-1 cursor-pointer pr-16"
              onClick={() => handleSelect(drawing.id)}
            >
              <Check
                className={cn(
                  "mr-2 size-4 shrink-0",
                  selectedId === drawing.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span
                className={cn(
                  "truncate",
                  selectedId === drawing.id && "font-medium"
                )}
              >
                {drawing.name}
              </span>
            </DropdownMenuItem>
            <div
              className="absolute right-1.5 flex items-center gap-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                onClick={(e) => handleRename(drawing.id, e)}
                title="Rename"
              >
                <Pencil className="size-3.5" />
              </button>
              {canDeleteDrawing && (
                <button
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => handleDelete(drawing.id, e)}
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleCreate}
        >
          <Plus className="mr-2 size-4" />
          New Drawing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
