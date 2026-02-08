"use client";

import { useState } from "react";
import { useDrawings } from "@/hooks/use-drawings";
import { useDrawingState } from "@/hooks/use-drawing-state";
import { DrawingSelector } from "./drawing-selector";
import { DrawingNameDialog } from "./drawing-name-dialog";
import { ExcalidrawWrapper } from "./excalidraw-wrapper";
import { Loader2 } from "lucide-react";

export function ExcalidrawView() {
  const {
    drawings,
    selectedDrawingId,
    setSelectedDrawingId,
    createDrawing,
    renameDrawing,
    deleteDrawing,
    isLoading: isLoadingList,
  } = useDrawings();

  const {
    elements,
    appState,
    onElementsChange,
    isLoading: isLoadingState,
  } = useDrawingState(selectedDrawingId);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [drawingToRename, setDrawingToRename] = useState<number | null>(null);

  const getDialogInitialName = () => {
    if (dialogMode === "rename" && drawingToRename !== null) {
      const drawing = drawings.find((d) => d.id === drawingToRename);
      return drawing?.name ?? "";
    }
    return "";
  };

  const handleCreate = () => {
    setDialogMode("create");
    setDrawingToRename(null);
    setDialogOpen(true);
  };

  const handleRename = (id: number) => {
    setDialogMode("rename");
    setDrawingToRename(id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const drawing = drawings.find((d) => d.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${drawing?.name ?? "this drawing"}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteDrawing(id);
      } catch (error) {
        console.error("Failed to delete drawing:", error);
      }
    }
  };

  const handleDialogSave = async (name: string) => {
    try {
      if (dialogMode === "create") {
        await createDrawing(name);
      } else if (dialogMode === "rename" && drawingToRename !== null) {
        await renameDrawing(drawingToRename, name);
      }
    } catch (error) {
      console.error(`Failed to ${dialogMode} drawing:`, error);
    }
  };

  if (isLoadingList) {
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
      {/* Header with drawing selector */}
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <DrawingSelector
          drawings={drawings}
          selectedId={selectedDrawingId}
          onSelect={setSelectedDrawingId}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      {/* Excalidraw area */}
      <div className="flex-1 overflow-hidden">
        {selectedDrawingId !== null ? (
          isLoadingState ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ExcalidrawWrapper
              key={selectedDrawingId}
              initialElements={elements}
              initialAppState={appState as Record<string, unknown> | null}
              onChange={onElementsChange}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No drawing selected. Create a new drawing to get started.
          </div>
        )}
      </div>

      {/* Name dialog for create/rename */}
      <DrawingNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={getDialogInitialName()}
        onSave={handleDialogSave}
        mode={dialogMode}
      />
    </div>
  );
}
