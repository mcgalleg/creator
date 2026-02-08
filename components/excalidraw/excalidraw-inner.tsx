"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import "@excalidraw/excalidraw/index.css";

import { useEffect, useState } from "react";
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
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidrawComp(() => mod.Excalidraw);
    });
  }, []);

  if (!ExcalidrawComp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initialData = {
    elements: initialElements || [],
    appState: {
      viewBackgroundColor: "#ffffff",
      ...initialAppState,
      theme,
    },
  };

  return (
    <ExcalidrawComp
      excalidrawAPI={onAPIReady}
      initialData={initialData}
      onChange={onChange}
      theme={theme}
      UIOptions={{
        canvasActions: {
          loadScene: false,
        },
      }}
    />
  );
}
