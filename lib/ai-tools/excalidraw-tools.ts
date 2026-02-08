import { tool } from "ai";
import { z } from "zod";

/**
 * Excalidraw element format reference for the AI system prompt.
 * This tells Claude how to generate valid Excalidraw element JSON.
 */
export const EXCALIDRAW_FORMAT_REFERENCE = `
## Excalidraw Diagram Tool

You have a \`createDiagram\` tool that renders hand-drawn Excalidraw diagrams in the user's Draw tab.

### When to use createDiagram vs generateUI:
- **createDiagram**: flowcharts, diagrams, visual breakdowns, architecture diagrams, process flows, mind maps, storyboards. Use when the user says "draw", "diagram", "visualize", "map out", "flowchart", etc.
- **generateUI**: interactive data charts (bar, line, pie), metric cards, data tables, video grids. Use for analytics data display.

### Color Palette
| Fill Color | Hex | Use |
|------------|-----|-----|
| Light Blue | #a5d8ff | Input, sources, primary nodes |
| Light Green | #b2f2bb | Success, output, completed |
| Light Orange | #ffd8a8 | Warning, pending, external |
| Light Purple | #d0bfff | Processing, middleware, special |
| Light Red | #ffc9c9 | Error, critical, alerts |
| Light Yellow | #fff3bf | Notes, decisions, planning |
| Light Teal | #c3fae8 | Storage, data, memory |
| Light Pink | #eebefa | Analytics, metrics |

### Element Types
- **Rectangle**: \`{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 100 }\`
  - Add \`roundness: { "type": 3 }\` for rounded corners
  - Add \`backgroundColor: "#a5d8ff", fillStyle: "solid"\` for filled
- **Ellipse**: \`{ "type": "ellipse", "id": "e1", "x": 100, "y": 100, "width": 150, "height": 150 }\`
- **Diamond**: \`{ "type": "diamond", "id": "d1", "x": 100, "y": 100, "width": 150, "height": 150 }\`
- **Labeled shape** (PREFERRED): Add \`label\` to any shape for auto-centered text.
  \`{ "type": "rectangle", "id": "r1", "x": 100, "y": 100, "width": 200, "height": 80, "label": { "text": "Hello", "fontSize": 20 } }\`
- **Standalone text**: \`{ "type": "text", "id": "t1", "x": 150, "y": 138, "text": "Hello", "fontSize": 20 }\`
- **Arrow**: \`{ "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 200, "height": 0, "points": [[0,0],[200,0]], "endArrowhead": "arrow" }\`
  - Arrow bindings: \`"startBinding": { "elementId": "r1", "fixedPoint": [1, 0.5] }\`
  - fixedPoint: top=[0.5,0], bottom=[0.5,1], left=[0,0.5], right=[1,0.5]
  - Labeled arrow: \`"label": { "text": "connects" }\`

### Camera (REQUIRED as first element)
Always start with: \`{ "type": "cameraUpdate", "width": 800, "height": 600, "x": 0, "y": 0 }\`
Sizes (4:3 only): S=400x300, M=600x450, L=800x600 (default), XL=1200x900

### Rules
- Minimum fontSize: 16 for body, 20 for titles
- Minimum shape size: 120x60 for labeled shapes
- Leave 20-30px gaps between elements
- Draw progressively: background → shape → its label → its arrows → next shape
- Do NOT use emoji in text

### Example: Two connected boxes
\`\`\`json
[
  { "type": "cameraUpdate", "width": 800, "height": 600, "x": 50, "y": 50 },
  { "type": "rectangle", "id": "b1", "x": 100, "y": 100, "width": 200, "height": 100, "roundness": { "type": 3 }, "backgroundColor": "#a5d8ff", "fillStyle": "solid", "label": { "text": "Start", "fontSize": 20 } },
  { "type": "rectangle", "id": "b2", "x": 450, "y": 100, "width": 200, "height": 100, "roundness": { "type": 3 }, "backgroundColor": "#b2f2bb", "fillStyle": "solid", "label": { "text": "End", "fontSize": 20 } },
  { "type": "arrow", "id": "a1", "x": 300, "y": 150, "width": 150, "height": 0, "points": [[0,0],[150,0]], "endArrowhead": "arrow", "startBinding": { "elementId": "b1", "fixedPoint": [1, 0.5] }, "endBinding": { "elementId": "b2", "fixedPoint": [0, 0.5] } }
]
\`\`\`
`;

/**
 * Excalidraw diagram tool for the AI SDK.
 * Returns the elements JSON which the client extracts and renders in the Excalidraw editor.
 */
export const createDiagramTool = tool({
  description:
    "Create a hand-drawn Excalidraw diagram. Use for flowcharts, architecture diagrams, process flows, visual breakdowns, mind maps. The diagram appears in the user's Draw tab. Always start elements with a cameraUpdate element.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("A short descriptive title for the diagram (e.g., 'Content Pipeline Flow')"),
    elements: z
      .string()
      .describe(
        "JSON array string of Excalidraw elements. Must be valid JSON. Start with a cameraUpdate element, then shapes, arrows, and text. Follow the element format from the system prompt."
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
