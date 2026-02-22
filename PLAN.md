# Plan: Integrate @json-render/remotion into Astriq

## Overview

Add `@json-render/remotion` to create a **video catalog** (parallel to the existing UI catalog) that lets the AI generate shareable video recaps from TikTok analytics data, and eventually replaces the hardcoded landing page demo with a spec-driven composition.

The project already uses `@json-render/core` + `@json-render/react` for the chat UI. This plan extends that same pattern to Remotion video, using the same catalog-driven architecture.

---

## Phase 1: Foundation — Video Catalog & Custom Components

### 1.1 Install `@json-render/remotion` and upgrade core

- `npm install @json-render/remotion@latest`
- This will also upgrade `@json-render/core` to 0.8.0 (currently 0.3.0)
- Verify the existing UI catalog (`lib/catalog.ts`) and registry (`lib/registry.tsx`) still work after the upgrade — the `createCatalog` → `defineCatalog` API may have changed
- Fix any breaking changes in `@json-render/react` (upgrade to match core)

### 1.2 Create the video catalog (`lib/video-catalog.ts`)

Define a `videoCatalog` using `defineCatalog` from `@json-render/core` with the `schema` from `@json-render/remotion`. This registers all available video clip types:

**Standard clips** (from `@json-render/remotion`):
- `TitleCard` — full-screen title + subtitle (for intros, section headers)
- `TypingText` — terminal-style typing animation (for hook/copy lines)
- `StatCard` — animated statistic with count-up (for KPI highlights)
- `QuoteCard` — quote with attribution (for testimonials, insights)
- `SplitScreen` — two-panel comparison (for before/after, A vs B)
- `TextOverlay` / `LowerThird` — overlays (for labels during app footage)

**Custom Astriq clips** (registered alongside standard ones):
| Clip Name | Based On | Props (Zod) | Purpose |
|---|---|---|---|
| `KpiBar` | SimulatedDashboard KPIs | `{ metrics: { label, value, change, format }[] }` | Animated row of 3-5 KPI cards counting up |
| `BarChartClip` | SimulatedChat bar chart | `{ data: { label, value }[], title?, unit? }` | Animated bar chart with staggered bars |
| `LineChartClip` | (new) | `{ data: { date, value }[], title?, color? }` | Animated line chart draw-in |
| `EngagementBreakdown` | (new) | `{ breakdown: { type, value, pct }[] }` | Animated pie/donut chart |
| `MindMapClip` | SimulatedCanvas | `{ nodes: { label, children }[] }` | Animated mind map build-out |
| `LogoIntro` | LogoScene | `{ logoSrc?, tagline? }` | Spring-animated logo entrance |
| `CtaCard` | CtaScene | `{ headline, buttonText, logoSrc? }` | CTA with breathing glow |

### 1.3 Build custom Remotion clip components (`components/remotion/clips/`)

Create each custom clip as a standalone Remotion component that receives props and uses `useCurrentFrame()`/`useVideoConfig()` — extracting the animation logic from the existing hardcoded scene components:

- `clips/KpiBar.tsx` — extract from `SimulatedDashboard.tsx` (the 4 KPI cards)
- `clips/BarChartClip.tsx` — extract from `SimulatedChat.tsx` (the 5-bar chart)
- `clips/LineChartClip.tsx` — new, simple animated line chart
- `clips/EngagementBreakdown.tsx` — new, animated donut
- `clips/MindMapClip.tsx` — extract from `SimulatedCanvas.tsx` (simplified)
- `clips/LogoIntro.tsx` — extract from `LogoScene.tsx`
- `clips/CtaCard.tsx` — extract from `CtaScene.tsx`

Each clip should:
- Accept props matching its Zod schema
- Be self-contained (no dependency on `constants.ts` scene timings)
- Use `useCurrentFrame()` relative to its own sequence start (frame 0 = clip start)
- Have a sensible `defaultDuration` in the catalog definition

### 1.4 Create the video component registry (`lib/video-registry.ts`)

Map catalog clip names to actual Remotion components:

```ts
import { KpiBar } from "@/components/remotion/clips/KpiBar";
import { BarChartClip } from "@/components/remotion/clips/BarChartClip";
// ...

export const videoComponents = {
  KpiBar,
  BarChartClip,
  LineChartClip,
  EngagementBreakdown,
  MindMapClip,
  LogoIntro,
  CtaCard,
};
```

### 1.5 Create the spec-driven VideoPlayer component (`components/remotion/SpecPlayer.tsx`)

A reusable player that accepts a `TimelineSpec` and renders it:

```tsx
import { Player } from "@remotion/player";
import { Renderer } from "@json-render/remotion";
import { videoComponents } from "@/lib/video-registry";

export function SpecPlayer({ spec }: { spec: TimelineSpec }) {
  return (
    <Player
      component={Renderer}
      inputProps={{ spec, components: videoComponents }}
      durationInFrames={spec.composition.durationInFrames}
      fps={spec.composition.fps}
      compositionWidth={spec.composition.width}
      compositionHeight={spec.composition.height}
      controls
    />
  );
}
```

---

## Phase 2: AI Chat Integration — `generateVideo` Tool

### 2.1 Generate the video catalog prompt (`lib/video-catalog.ts`)

Add a `getVideoCatalogPrompt()` function (mirroring `getAnalyticsCatalogPrompt()`) that generates a system prompt describing all available video clips, their props schemas, and usage guidance.

### 2.2 Add `generateVideo` tool to the chat API (`app/api/chat/route.ts`)

Add a new tool alongside `generateUI` and `createDiagram`:

```ts
generateVideo: tool({
  description: "Generate a video recap of analytics data. Produces a JSON timeline spec that renders as an animated video. Use when the user asks for a video summary, recap, shareable clip, or animated report.",
  inputSchema: z.object({
    title: z.string().describe("Video title"),
    clips: z.array(z.object({
      component: z.string().describe("Clip type from the video catalog"),
      props: z.record(z.any()).describe("Props for the clip"),
      durationInFrames: z.number().optional().describe("Duration in frames (default from catalog)"),
    })),
    fps: z.number().optional().default(30),
    width: z.number().optional().default(1920),
    height: z.number().optional().default(1080),
  }),
  execute: async ({ title, clips, fps, width, height }) => {
    // Assemble a TimelineSpec from the clips array
    // Calculate total duration, assign frame offsets, create tracks
    return { spec: assembledTimelineSpec };
  },
}),
```

### 2.3 Add video catalog prompt to the AI system message

In `route.ts`, append the video catalog prompt to the static system prompt:

```ts
const staticSystemPrompt =
  getAnalyticsCatalogPrompt() +
  additionalInstructions +
  EXCALIDRAW_FORMAT_REFERENCE +
  getVideoCatalogPrompt();
```

Add instructions guiding when to use `generateVideo` vs `generateUI`:
- `generateUI` → interactive dashboard visualizations (default)
- `generateVideo` → when user says "video", "recap", "shareable", "animate", "clip"

### 2.4 Extract video specs in `use-analytics-chat.ts`

Add `videoSpecs` tracking (parallel to `uiTrees` and `diagramResults`):

- Extract `tool-generateVideo` parts from messages
- Parse the `TimelineSpec` from tool output
- Expose `videoSpecs`, `latestVideoSpec`, `onVideoGenerated` callback

### 2.5 Render videos in the chat message list

In `components/chat/message-list.tsx`:

- Detect `tool-generateVideo` parts (same pattern as `tool-generateUI` and `tool-createDiagram`)
- Render a `VideoRecapCard` component that shows an inline `SpecPlayer` with the spec
- Include a "View Full Screen" button that opens the video in a larger modal/dialog

Create `components/chat/video-recap-card.tsx`:
- Inline `SpecPlayer` at a compact size
- Play/pause controls
- "Download" button (future — Phase 4)
- Title from the spec

---

## Phase 3: Landing Page Demo Refactor

### 3.1 Express the current demo as a TimelineSpec

Convert the current hardcoded `DemoVideo.tsx` choreography into a JSON timeline spec using the custom clips from Phase 1. The spec would look roughly like:

```json
{
  "composition": { "id": "demo", "fps": 30, "width": 1920, "height": 1080, "durationInFrames": 1545 },
  "tracks": [
    { "id": "main", "type": "video", "enabled": true },
    { "id": "overlay", "type": "video", "enabled": true }
  ],
  "clips": [
    { "id": "logo", "trackId": "main", "component": "LogoIntro", "from": 0, "durationInFrames": 50, "props": { "logoSrc": "/astriq-logo-dark.svg" } },
    { "id": "hook", "trackId": "overlay", "component": "TypingText", "from": 50, "durationInFrames": 156, "props": { "lines": ["Know exactly what's working", "And why."] } },
    ...
  ],
  "audio": { "tracks": [{ "src": "/music.mp3", "volume": 0.5 }] }
}
```

### 3.2 Create a `DemoVideoSpec` component

Replace the current `DemoVideo` with a spec-driven renderer that uses the same `Renderer` + `videoComponents`:

- The spec lives in a static JSON file or TypeScript constant
- The `SimulatedApp` scene (dashboard + chat + canvas) becomes a custom clip
- The `AnimatedCursor` overlay becomes a custom overlay clip
- Audio tracks are defined in the spec

**Important**: The existing `PlayerInner.tsx` (custom controls, mute button, error boundary) stays — only the inner `component` prop changes from `DemoVideo` to `Renderer`.

### 3.3 Deprecate and remove hardcoded scene orchestration

Once the spec-driven demo matches the hardcoded one:
- Remove `DemoVideo.tsx` (the orchestrator)
- Keep the individual scene components since they're now registered as clips
- Remove `constants.ts` scene timing definitions (timings now live in the spec)

---

## Phase 4: Enhanced Features (Future)

### 4.1 Video export/download
- Add `@remotion/renderer` for server-side rendering
- API route to render a spec to MP4
- "Download Video" button on `VideoRecapCard`

### 4.2 Video sharing
- Save specs to DB (they're just JSON)
- Shareable URL that renders the spec
- OG image generation from first frame

### 4.3 Streaming video generation
- As the AI streams the `generateVideo` tool output, progressively render the spec
- Video builds itself in real-time as clips are added

### 4.4 A/B test landing page demos
- Multiple demo specs with different copy/ordering
- Choose spec based on UTM params or user segment

---

## File Changes Summary

### New Files
| File | Purpose |
|---|---|
| `lib/video-catalog.ts` | Video catalog definition + prompt generation |
| `lib/video-registry.ts` | Maps clip names → Remotion components |
| `components/remotion/clips/KpiBar.tsx` | KPI row clip |
| `components/remotion/clips/BarChartClip.tsx` | Animated bar chart clip |
| `components/remotion/clips/LineChartClip.tsx` | Animated line chart clip |
| `components/remotion/clips/EngagementBreakdown.tsx` | Animated donut clip |
| `components/remotion/clips/MindMapClip.tsx` | Animated mind map clip |
| `components/remotion/clips/LogoIntro.tsx` | Logo entrance clip |
| `components/remotion/clips/CtaCard.tsx` | CTA card clip |
| `components/remotion/SpecPlayer.tsx` | Reusable spec-driven player |
| `components/chat/video-recap-card.tsx` | Video display in chat |

### Modified Files
| File | Changes |
|---|---|
| `package.json` | Add `@json-render/remotion`, upgrade `@json-render/core` + `@json-render/react` |
| `lib/catalog.ts` | Adapt to any API changes from core upgrade |
| `lib/registry.tsx` | Adapt to any API changes from react upgrade |
| `app/api/chat/route.ts` | Add `generateVideo` tool, video catalog prompt |
| `hooks/use-analytics-chat.ts` | Extract video specs from messages |
| `components/chat/message-list.tsx` | Render `VideoRecapCard` for video tool results |
| `components/remotion/PlayerInner.tsx` | Swap `DemoVideo` → `Renderer` with spec (Phase 3) |

### Eventually Removed (Phase 3)
| File | Reason |
|---|---|
| `components/remotion/DemoVideo.tsx` | Replaced by spec-driven renderer |
| Scene timing constants in `constants.ts` | Timings move into the spec |

---

## Implementation Order

1. **Phase 1.1** — Install packages and fix any upgrade breakage
2. **Phase 1.2–1.4** — Video catalog, clip components, and registry
3. **Phase 1.5** — SpecPlayer component
4. **Phase 2.1–2.3** — AI tool + prompt (backend)
5. **Phase 2.4–2.5** — Chat UI integration (frontend)
6. **Phase 3** — Landing page refactor (can be deferred)
7. **Phase 4** — Export, sharing, streaming (future)

Phases 1–2 are the core deliverable. Phase 3 is a polish pass. Phase 4 is future roadmap.
