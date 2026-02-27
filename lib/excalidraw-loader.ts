/**
 * Safe loader for @excalidraw/excalidraw that prevents the SecurityError
 * caused by Excalidraw 0.18's Web Worker font subsetting under Turbopack.
 *
 * Turbopack resolves `import.meta.url` to a file:// path, which browsers
 * block when passed to `new Worker()`. Excalidraw checks
 * `typeof Worker !== "undefined"` at module evaluation time and falls back
 * to main-thread subsetting when it's absent. We temporarily hide the
 * Worker constructor so the fallback path is taken.
 *
 * Use `loadExcalidraw()` instead of `import("@excalidraw/excalidraw")`
 * everywhere in the codebase.
 */

let cached: Promise<typeof import("@excalidraw/excalidraw")> | null = null;

export function loadExcalidraw(): Promise<typeof import("@excalidraw/excalidraw")> {
  if (cached) return cached;

  const RealWorker = globalThis.Worker;
  // @ts-expect-error — intentional temporary removal
  delete globalThis.Worker;

  cached = import("@excalidraw/excalidraw").finally(() => {
    globalThis.Worker = RealWorker;
  });

  return cached;
}
