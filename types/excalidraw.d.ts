export type ExcalidrawElement = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type AppState = Record<string, unknown>;

export interface ExcalidrawAPI {
  updateScene: (scene: {
    elements?: readonly ExcalidrawElement[];
    appState?: Partial<AppState>;
  }) => void;
  getSceneElements: () => readonly ExcalidrawElement[];
  getAppState: () => AppState;
  scrollToContent: (
    elements?: readonly ExcalidrawElement[],
    opts?: { fitToContent?: boolean; animate?: boolean; duration?: number }
  ) => void;
  resetScene: () => void;
  history: { clear: () => void };
}
