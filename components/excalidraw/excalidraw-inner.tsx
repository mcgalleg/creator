"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import "@excalidraw/excalidraw/index.css";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";

export default function ExcalidrawInner({
  initialElements,
  initialAppState,
  onChange,
  onAPIReady,
  theme,
}: {
  initialElements: any;
  initialAppState: any;
  onChange: any;
  onAPIReady: (api: any) => void;
  theme: string;
}) {
  const [excalidrawModule, setExcalidrawModule] = useState<any>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Use the shared loader that suppresses the Worker constructor to avoid
    // SecurityError with Turbopack's file:// import.meta.url resolution.
    import("@/lib/excalidraw-loader").then(({ loadExcalidraw }) =>
      loadExcalidraw().then((mod) => setExcalidrawModule(mod))
    );
  }, []);

  const handleAPIReady = useCallback(
    (api: any) => {
      apiRef.current = api;
      onAPIReady(api);
    },
    [onAPIReady]
  );

  const handleResetCanvas = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const confirmed = window.confirm(
      "This will clear the whole canvas. Are you sure?"
    );
    if (confirmed) {
      const currentAppState = api.getAppState();
      api.resetScene();
      api.history.clear();
      // Explicitly notify the parent to persist the empty state.
      // resetScene may not trigger the onChange callback reliably,
      // and we need to ensure the empty state is saved before any
      // subsequent onChange from Excalidraw can overwrite it.
      onChange?.([], currentAppState);
    }
  }, [onChange]);

  // Memoize the custom menu to prevent infinite re-render loop.
  // Excalidraw's tunnel pattern detects children changes and triggers state
  // updates — unstable JSX references cause an update cycle.
  const menu = useMemo(() => {
    if (!excalidrawModule) return null;
    const Menu = excalidrawModule.MainMenu;
    return (
      <Menu>
        <Menu.DefaultItems.SaveAsImage />
        <Menu.DefaultItems.SearchMenu />
        <Menu.DefaultItems.Help />
        <Menu.Item onSelect={handleResetCanvas}>
          Reset the canvas
        </Menu.Item>
        <Menu.DefaultItems.ChangeCanvasBackground />
      </Menu>
    );
  }, [excalidrawModule, handleResetCanvas]);

  if (!excalidrawModule) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ExcalidrawComp = excalidrawModule.Excalidraw;

  // Convert zoom from DB format (plain number) to Excalidraw format ({ value: number }).
  // Also guard against NaN/Infinity that may have been persisted.
  const rawZoom = initialAppState?.zoom;
  const zoomNumber = typeof rawZoom === "object" && rawZoom !== null
    ? (rawZoom as { value?: number }).value
    : rawZoom;
  const safeZoom =
    typeof zoomNumber === "number" && isFinite(zoomNumber) && zoomNumber > 0
      ? { value: zoomNumber }
      : undefined;

  const initialData = {
    elements: initialElements || [],
    appState: {
      viewBackgroundColor: "#ffffff",
      ...initialAppState,
      ...(safeZoom ? { zoom: safeZoom } : {}),
      theme,
    },
  };

  return (
    <ExcalidrawComp
      excalidrawAPI={handleAPIReady}
      initialData={initialData}
      onChange={onChange}
      theme={theme}
      UIOptions={{
        canvasActions: {
          loadScene: false,
        },
      }}
    >
      {menu}
    </ExcalidrawComp>
  );
}
