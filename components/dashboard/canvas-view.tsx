"use client";

import { useState } from "react";
import { useCanvases } from "@/hooks/use-canvases";
import { CanvasSelector } from "./canvas-selector";
import { CanvasNameDialog } from "./canvas-name-dialog";
import { AnalyticsCanvas } from "@/components/canvas/analytics-canvas";
import { Loader2 } from "lucide-react";

export function CanvasView() {
  const {
    canvases,
    selectedCanvasId,
    setSelectedCanvasId,
    createCanvas,
    renameCanvas,
    deleteCanvas,
    isLoading,
  } = useCanvases();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [canvasToRename, setCanvasToRename] = useState<number | null>(null);

  // Get the initial name for the dialog based on mode
  const getDialogInitialName = () => {
    if (dialogMode === "rename" && canvasToRename !== null) {
      const canvas = canvases.find((c) => c.id === canvasToRename);
      return canvas?.name ?? "";
    }
    return "";
  };

  // Handlers
  const handleCreate = () => {
    setDialogMode("create");
    setCanvasToRename(null);
    setDialogOpen(true);
  };

  const handleRename = (id: number) => {
    setDialogMode("rename");
    setCanvasToRename(id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    // Simple confirmation before delete
    const canvas = canvases.find((c) => c.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${canvas?.name ?? "this canvas"}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteCanvas(id);
      } catch (error) {
        console.error("Failed to delete canvas:", error);
      }
    }
  };

  const handleDialogSave = async (name: string) => {
    try {
      if (dialogMode === "create") {
        await createCanvas(name);
      } else if (dialogMode === "rename" && canvasToRename !== null) {
        await renameCanvas(canvasToRename, name);
      }
    } catch (error) {
      console.error(`Failed to ${dialogMode} canvas:`, error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 items-center border-b px-4">
          <div className="h-9 w-[200px] animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header with canvas selector */}
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <CanvasSelector
          canvases={canvases}
          selectedId={selectedCanvasId}
          onSelect={setSelectedCanvasId}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-hidden">
        {selectedCanvasId !== null ? (
          <AnalyticsCanvas canvasId={selectedCanvasId} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No canvas selected. Create a new canvas to get started.
          </div>
        )}
      </div>

      {/* Name dialog for create/rename */}
      <CanvasNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={getDialogInitialName()}
        onSave={handleDialogSave}
        mode={dialogMode}
      />
    </div>
  );
}
