import { tool } from "ai";
import { z } from "zod";

/**
 * Excalidraw diagram tool for the AI SDK.
 * Returns the elements JSON which the client extracts and renders inline.
 */
export const createDiagramTool = tool({
  description: `Create a hand-drawn Excalidraw diagram. Use for flowcharts, architecture diagrams, process flows, visual breakdowns, mind maps.

Element types:
- Rectangle: { type: "rectangle", id, x, y, width, height, roundness?: { type: 3 }, backgroundColor?: "#a5d8ff", fillStyle?: "solid", label?: { text, fontSize } }
- Ellipse: { type: "ellipse", id, x, y, width, height }
- Diamond: { type: "diamond", id, x, y, width, height }
- Arrow: { type: "arrow", id, x, y, width, height, points: [[0,0],[dx,dy]], endArrowhead: "arrow", startBinding?: { elementId, fixedPoint: [x,y] }, endBinding?: { elementId, fixedPoint: [x,y] }, label?: { text } }
  - fixedPoint: top=[0.5,0], bottom=[0.5,1], left=[0,0.5], right=[1,0.5]
- Text: { type: "text", id, x, y, text, fontSize }

Color palette: Light Blue #a5d8ff, Light Green #b2f2bb, Light Orange #ffd8a8, Light Purple #d0bfff, Light Red #ffc9c9, Light Yellow #fff3bf, Light Teal #c3fae8, Light Pink #eebefa

Rules:
- REQUIRED first element: { type: "cameraUpdate", width: 800, height: 600, x: 0, y: 0 }
- Prefer labeled shapes (add label property) over separate text elements
- Min fontSize: 16 body, 20 titles. Min shape: 120x60 for labeled shapes. 20-30px gaps.
- No emoji in text.`,
  inputSchema: z.object({
    title: z
      .string()
      .describe("A short descriptive title for the diagram (e.g., 'Content Pipeline Flow')"),
    elements: z
      .string()
      .describe(
        "JSON array string of Excalidraw elements. Must be valid JSON. Start with a cameraUpdate element, then shapes, arrows, and text."
      ),
  }),
  execute: async ({ title, elements }) => {
    try {
      const parsed = JSON.parse(elements);
      if (!Array.isArray(parsed)) {
        return {
          error: "Elements must be a JSON array",
          title,
        };
      }
      return {
        title,
        elements: parsed,
        elementCount: parsed.length,
      };
    } catch (e) {
      return {
        error: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
        title,
      };
    }
  },
});
