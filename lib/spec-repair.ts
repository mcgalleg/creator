/**
 * Spec JSONL repair transform.
 *
 * LLMs sometimes produce malformed JSONL patch lines inside ```spec fences:
 *
 * 1. Extra trailing braces — e.g. `..."children":[]}}}`  (one `}` too many)
 * 2. Orphaned element fields — `repeat`, `children`, `on`, `visible` placed
 *    outside the `value` object instead of inside it. The RFC 6902 `add`
 *    operation only reads `op`, `path`, `value`, so these fields are lost.
 *
 * This module exports a TransformStream that sits between the AI SDK's
 * text-delta stream and `pipeJsonRender`, repairing lines inside spec fences
 * before the library's parser sees them.
 */

// Fields that belong on a json-render element (inside `value`), NOT on
// the RFC 6902 patch operation itself.
const ELEMENT_FIELDS = ["children", "repeat", "on", "visible"] as const;

function tryParse(s: string): Record<string, unknown> | null {
  try {
    const obj = JSON.parse(s);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      return obj;
    }
  } catch {
    /* invalid JSON */
  }
  return null;
}

/**
 * Move orphaned element fields from the top-level patch object into `value`.
 * Only applies to `add`/`replace` operations targeting `/elements/*`.
 */
function renestPatch(
  patch: Record<string, unknown>
): Record<string, unknown> {
  if (patch.op !== "add" && patch.op !== "replace") return patch;
  const path = patch.path as string;
  if (!path?.startsWith("/elements/")) return patch;

  const value = patch.value;
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return patch;
  if (!(value as Record<string, unknown>).type) return patch;

  let modified = false;
  const newValue = { ...(value as Record<string, unknown>) };

  for (const field of ELEMENT_FIELDS) {
    if (field in patch) {
      // Top-level field takes precedence (it's what the LLM intended as the
      // element-level field). For `children` this means the repeat-template
      // children override any hardcoded children the LLM put inside value.
      newValue[field] = patch[field];
      modified = true;
    }
  }

  if (!modified) return patch;
  return { op: patch.op, path: patch.path, value: newValue };
}

/**
 * Attempt to repair a single JSONL spec line.
 * Returns the repaired line, or the original if no repair was possible.
 */
function repairSpecJsonLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) return trimmed;

  // 1. Try parsing as-is
  let parsed = tryParse(trimmed);

  // 2. If invalid, progressively strip trailing braces (up to 3)
  if (!parsed) {
    let candidate = trimmed;
    for (let i = 0; i < 3; i++) {
      const ch = candidate[candidate.length - 1];
      if (ch === "}" || ch === "]") {
        candidate = candidate.slice(0, -1);
        parsed = tryParse(candidate);
        if (parsed) break;
      } else {
        break;
      }
    }
  }

  // 3. If still can't parse, return original (pipeJsonRender will skip it)
  if (!parsed || !parsed.op || parsed.path === undefined) return trimmed;

  // 4. Re-nest any orphaned element fields into value
  const fixed = renestPatch(parsed);

  // Only re-serialize if we actually changed something
  if (fixed !== parsed || trimmed !== JSON.stringify(parsed)) {
    return JSON.stringify(fixed);
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Transform stream
// ---------------------------------------------------------------------------

/**
 * Creates a TransformStream that repairs malformed spec JSONL lines in the
 * text-delta stream before they reach `pipeJsonRender`.
 *
 * Usage:
 * ```ts
 * pipeJsonRender(
 *   result.toUIMessageStream().pipeThrough(createSpecRepairTransform())
 * )
 * ```
 */
export function createSpecRepairTransform(): TransformStream {
  let inFence = false;
  let lineBuffer = "";

  return new TransformStream({
    transform(
      chunk: { type: string; delta?: string; [k: string]: unknown },
      controller
    ) {
      // Only intercept text-delta chunks; pass everything else through.
      if (chunk.type !== "text-delta" || typeof chunk.delta !== "string") {
        controller.enqueue(chunk);
        return;
      }

      const text = chunk.delta;
      let output = "";

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inFence) {
          // Inside a ```spec fence — buffer the full line, repair on newline.
          if (ch === "\n") {
            const trimmed = lineBuffer.trim();
            if (trimmed === "```") {
              // Fence close
              inFence = false;
              output += lineBuffer + "\n";
            } else if (trimmed.startsWith("{")) {
              // Spec line — repair it
              output += repairSpecJsonLine(trimmed) + "\n";
            } else {
              // Empty line or non-JSON inside fence
              output += lineBuffer + "\n";
            }
            lineBuffer = "";
          } else {
            lineBuffer += ch;
          }
        } else if (lineBuffer) {
          // Outside fence, buffering to detect fence open
          if (ch === "\n") {
            const trimmed = lineBuffer.trim();
            if (trimmed.startsWith("```spec")) {
              inFence = true;
            }
            output += lineBuffer + "\n";
            lineBuffer = "";
          } else {
            lineBuffer += ch;
          }
        } else {
          // Outside fence, not buffering
          if (ch === "`") {
            // Start buffering — might be a ```spec fence
            lineBuffer = ch;
          } else {
            output += ch;
          }
        }
      }

      if (output) {
        controller.enqueue({ ...chunk, delta: output });
      }
    },

    flush(controller) {
      if (!lineBuffer) return;
      if (inFence) {
        const trimmed = lineBuffer.trim();
        if (trimmed.startsWith("{")) {
          controller.enqueue({
            type: "text-delta",
            delta: repairSpecJsonLine(trimmed) + "\n",
          });
          return;
        }
      }
      controller.enqueue({ type: "text-delta", delta: lineBuffer });
    },
  });
}
