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
  MoreVertical,
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
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

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
    onRename(id);
    setActiveMenuId(null);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
    setActiveMenuId(null);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className="w-[200px] justify-between"
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
              className={cn(
                "flex-1 cursor-pointer pr-8",
                selectedId === drawing.id && "bg-accent"
              )}
              onClick={() => handleSelect(drawing.id)}
            >
              <Check
                className={cn(
                  "mr-2 size-4",
                  selectedId === drawing.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{drawing.name}</span>
            </DropdownMenuItem>
            <DropdownMenu
              open={activeMenuId === drawing.id}
              onOpenChange={(isOpen) =>
                setActiveMenuId(isOpen ? drawing.id : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-3" />
                  <span className="sr-only">Drawing options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right">
                <DropdownMenuItem onClick={(e) => handleRename(drawing.id, e)}>
                  <Pencil className="mr-2 size-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handleDelete(drawing.id, e)}
                  disabled={!canDeleteDrawing}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
