import {
  defineCatalog,
  type ComponentSchema,
} from "@json-render/core";
import {
  schema,
  standardComponentDefinitions,
  standardTransitionDefinitions,
  standardEffectDefinitions,
} from "@json-render/remotion/server";
import { z } from "zod";

// =============================================================================
// Helper to cast schemas for json-render compatibility
// =============================================================================

function asProps<T extends z.ZodTypeAny>(schema: T): ComponentSchema {
  return schema as unknown as ComponentSchema;
}

// =============================================================================
// Shared Schemas
// =============================================================================

const chartDataPointSchema = z.record(z.string(), z.union([z.string(), z.number()]));

// =============================================================================
// Chart Components
// =============================================================================

const BarChartSchema = z.object({
  data: z.array(chartDataPointSchema),
  xKey: z.string(),
  yKeys: z.array(z.string()).min(1),
  title: z.string().optional(),
});

const LineChartSchema = z.object({
  data: z.array(chartDataPointSchema),
  xKey: z.string(),
  yKeys: z.array(z.string()).min(1),
  title: z.string().optional(),
  curved: z.boolean().optional().default(true),
});

const AreaChartSchema = z.object({
  data: z.array(chartDataPointSchema),
  xKey: z.string(),
  yKeys: z.array(z.string()).min(1),
  title: z.string().optional(),
  gradient: z.boolean().optional().default(true),
});

const PieChartSchema = z.object({
  data: z.array(chartDataPointSchema),
  nameKey: z.string(),
  valueKey: z.string(),
  title: z.string().optional(),
});

const EngagementTimelineSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      likes: z.number(),
      comments: z.number(),
      shares: z.number(),
      plays: z.number(),
    })
  ),
  title: z.string().optional(),
});

// =============================================================================
// Metric & Data Components
// =============================================================================

const MetricCardSchema = z.object({
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      format: z.string().optional(),
      change: z.string().optional(),
    })
  ),
  title: z.string().optional(),
});

const DataTableSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      header: z.string(),
    })
  ),
  data: z.array(z.record(z.string(), z.unknown())),
  title: z.string().optional(),
});

const VideoCardSchema = z.object({
  thumbnailUrl: z.string().optional(),
  postId: z.number().optional(),
  description: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  plays: z.number(),
});

// =============================================================================
// UI Components
// =============================================================================

const BadgeSchema = z.object({
  text: z.string(),
  variant: z
    .enum(["default", "secondary", "destructive", "outline"])
    .optional()
    .default("default"),
});

const ProgressSchema = z.object({
  value: z.number().min(0).max(100),
  label: z.string().optional(),
});

const AlertSchema = z.object({
  title: z.string().optional(),
  description: z.string(),
  variant: z.enum(["default", "destructive"]).optional().default("default"),
});

const SeparatorSchema = z.object({});

const AvatarSchema = z.object({
  src: z.string().optional(),
  username: z.string().optional(),
  fallback: z.string().max(2),
});

const SkeletonSchema = z.object({
  width: z.string().optional(),
  height: z.string().optional(),
});

// =============================================================================
// Catalog Definition
// =============================================================================

export const videoCatalog = defineCatalog(schema, {
  components: {
    ...standardComponentDefinitions,

    // Chart Components
    BarChart: {
      props: asProps(BarChartSchema),
      type: "scene" as const,
      defaultDuration: 120,
      description:
        "Animated bar chart for comparing categorical data. Shows bars growing from zero with staggered animation.",
    },
    LineChart: {
      props: asProps(LineChartSchema),
      type: "scene" as const,
      defaultDuration: 120,
      description:
        "Animated line chart for showing trends over time. Lines draw progressively from left to right.",
    },
    AreaChart: {
      props: asProps(AreaChartSchema),
      type: "scene" as const,
      defaultDuration: 120,
      description:
        "Animated area chart for showing volume over time. Area fills with gradient from bottom up.",
    },
    PieChart: {
      props: asProps(PieChartSchema),
      type: "scene" as const,
      defaultDuration: 90,
      description:
        "Animated pie/donut chart for showing proportions. Segments animate in with rotation.",
    },
    EngagementTimeline: {
      props: asProps(EngagementTimelineSchema),
      type: "scene" as const,
      defaultDuration: 150,
      description:
        "Multi-metric engagement timeline showing likes, comments, shares, and plays over time.",
    },

    // Metric & Data Components
    MetricCard: {
      props: asProps(MetricCardSchema),
      type: "scene" as const,
      defaultDuration: 90,
      description:
        "Animated metric cards displaying key statistics with count-up animation and optional change indicators.",
    },
    DataTable: {
      props: asProps(DataTableSchema),
      type: "scene" as const,
      defaultDuration: 150,
      description:
        "Animated data table with rows appearing sequentially. Shows structured data in columns.",
    },
    VideoCard: {
      props: asProps(VideoCardSchema),
      type: "scene" as const,
      defaultDuration: 90,
      description:
        "TikTok video card showing thumbnail and engagement metrics with animated counters.",
    },

    // UI Components
    Badge: {
      props: asProps(BadgeSchema),
      type: "scene" as const,
      defaultDuration: 60,
      description:
        "Small badge/tag for labels and status indicators in video clips.",
    },
    Progress: {
      props: asProps(ProgressSchema),
      type: "scene" as const,
      defaultDuration: 90,
      description:
        "Animated progress bar filling to the target value with optional label.",
    },
    Alert: {
      props: asProps(AlertSchema),
      type: "scene" as const,
      defaultDuration: 90,
      description:
        "Alert banner for important messages or callouts in video clips.",
    },
    Separator: {
      props: asProps(SeparatorSchema),
      type: "scene" as const,
      defaultDuration: 15,
      description:
        "Visual divider line between video sections. Draws on with animation.",
    },
    Avatar: {
      props: asProps(AvatarSchema),
      type: "scene" as const,
      defaultDuration: 60,
      description:
        "User avatar showing an image with fallback initials. Scales in with spring animation.",
    },
    Skeleton: {
      props: asProps(SkeletonSchema),
      type: "scene" as const,
      defaultDuration: 60,
      description:
        "Animated loading placeholder with pulse effect for video transitions.",
    },
  },

  transitions: standardTransitionDefinitions,
  effects: standardEffectDefinitions,
});

// =============================================================================
// Catalog Prompt Generation
// =============================================================================

export function getVideoCatalogPrompt(): string {
  return `## Video Generation Guide

You generate animated video reports using the \`generateVideo\` tool. The tool accepts a structured JSON spec with composition, tracks, and clips. Do NOT output JSONL patches — use the tool's structured parameters directly.

### Available Video Components

#### Chart Components
- **BarChart** (min 90 frames): Animated bar chart — bars grow from zero with staggered spring animation. Props: { data: [{key: value, ...}], xKey: string, yKeys: string[], title?: string }
- **LineChart** (min 90 frames): Animated line chart — lines draw progressively left to right. Props: { data: [...], xKey: string, yKeys: string[], title?: string, curved?: boolean }
- **AreaChart** (min 120 frames): Animated area chart — area fills with gradient from bottom up. Props: { data: [...], xKey: string, yKeys: string[], title?: string, gradient?: boolean }
- **PieChart** (min 100 frames): Animated pie/donut chart — segments animate in with rotation. Props: { data: [...], nameKey: string, valueKey: string, title?: string }
- **EngagementTimeline** (min 120 frames): Multi-metric timeline (likes, comments, shares, plays). Props: { data: [{ date: string, likes: number, comments: number, shares: number, plays: number }], title?: string }

#### Metric & Data Components
- **MetricCard** (min 120 frames): Animated metric cards with count-up animation (30 frames) + change indicator delay. Props: { metrics: [{ label: string, value: number, format?: string, change?: string }], title?: string }
- **DataTable** (min 90 frames): Rows appear sequentially (8 rows × 3 frame stagger). Props: { columns: [{ key: string, header: string }], data: [{ ... }], title?: string }
- **VideoCard** (min 90 frames): TikTok video card with thumbnail and animated counters. Props: { postId?: number (preferred — auto-fetches thumbnail), thumbnailUrl?: string (direct URL), description: string, likes: number, comments: number, shares: number, plays: number }. Pass \`postId\` from the post data to auto-load the thumbnail.

#### Standard Components (from @json-render/remotion)
- **TitleCard** (min 75 frames): Full-screen title slide. Props: { title: string, subtitle?: string, backgroundColor?: string, textColor?: string }
- **StatCard** (min 75 frames): Large statistic display. Props: { value: string, label: string, prefix?: string, suffix?: string, backgroundColor?: string }
- **QuoteCard** (min 90 frames): Quote with attribution. Props: { quote: string, author?: string, backgroundColor?: string, textColor?: string }
- **TypingText** (min 90 frames): Typewriter text effect. Props: { text: string, fontSize?: number, fontFamily?: "monospace" | "sans-serif" | "serif", showCursor?: boolean, charsPerSecond?: number }
- **SplitScreen** (min 90 frames): Side-by-side comparison. Props: { leftTitle: string, rightTitle: string, leftColor?: string, rightColor?: string }

#### Overlay Components (place on "overlay" track, layered on top of scenes)
- **LowerThird** (min 60 frames): Name/title banner at bottom of screen. Props: { name: string, title?: string, backgroundColor?: string }
- **TextOverlay** (min 60 frames): Text positioned over scene. Props: { text: string, position?: "top" | "center" | "bottom", fontSize?: "small" | "medium" | "large" }

#### UI Components
- **Badge** (min 45 frames): Small label/tag. Props: { text: string, variant?: "default" | "secondary" | "destructive" | "outline" }
- **Progress** (min 75 frames): Animated progress bar. Props: { value: number (0-100), label?: string }
- **Alert** (min 60 frames): Alert banner. Props: { title?: string, description: string, variant?: "default" | "destructive" }
- **Separator** (min 30 frames): Visual divider line. Props: {}
- **Avatar** (min 45 frames): User avatar circle showing a profile image (or fallback initials if image fails). Scales in with spring animation. Props: { username?: string (TikTok username — preferred, auto-fetches their avatar), src?: string (direct image URL), fallback: string (1-2 character initials) }. Pass \`username\` for commenter avatars (the component resolves the image automatically). Use with a LowerThird or TextOverlay on the overlay track to label the person.

### Transition System

Every clip can have \`transitionIn\` and \`transitionOut\` to animate between scenes. Without them, clips hard-cut.

Available transition types: fade, slideLeft, slideRight, slideUp, slideDown, zoom, wipe, none

**Always add transitions between scene clips.** Recommended defaults:
- \`transitionIn: { type: "fade", durationInFrames: 15 }\` — best all-purpose transition
- Use \`slideUp\` for sequential reveals (metrics flowing upward)
- Use \`zoom\` for emphasis moments (key stats, highlights)
- Use \`wipe\` sparingly for dramatic scene changes
- \`slideLeft\`/\`slideRight\` for horizontal progressions (timelines, before/after)

Transition duration is typically 15 frames (0.5s at 30fps). Use 10 for snappy or 20 for smooth.

### Motion System

Every clip can have a \`motion\` object for entrance/exit animations and continuous effects.

#### motion.enter — Animate clip entrance (FROM these values TO neutral)
\`\`\`json
{ "motion": { "enter": { "opacity": 0, "y": 30, "duration": 20 } } }
\`\`\`
Properties: opacity (0-1), scale (e.g. 0.8), x/y (pixels), rotate (degrees), duration (frames, default 20).

Common entrance patterns:
- Fade up: \`{ opacity: 0, y: 30, duration: 20 }\` — best default for most clips
- Scale pop: \`{ opacity: 0, scale: 0.8, duration: 15 }\` — good for stats/badges
- Slide in from left: \`{ opacity: 0, x: -60, duration: 20 }\` — good for sequential items

#### motion.exit — Animate clip exit (FROM neutral TO these values)
Same properties as enter. Example: \`{ opacity: 0, y: -20, duration: 15 }\`

#### motion.spring — Physics tuning for enter/exit
\`\`\`json
{ "motion": { "spring": { "damping": 15, "stiffness": 120, "mass": 1 } } }
\`\`\`
Lower damping = more bounce. Higher stiffness = snappier. Default: { damping: 20, stiffness: 100, mass: 1 }.

#### motion.loop — Continuous animation (pulse, float, spin)
\`\`\`json
{ "motion": { "loop": { "property": "scale", "from": 1, "to": 1.05, "duration": 30, "easing": "ease" } } }
\`\`\`
Use for: pulsing emphasis on key metrics, subtle floating effects on overlay elements.

### Composition Guidelines

**Track layout:** Use 2 tracks:
- \`"main"\` (type: "video") — sequential scene clips (TitleCard, MetricCard, charts, etc.)
- \`"overlay"\` (type: "video") — LowerThird, TextOverlay layered on top of main scenes

**Recommended video flow:**
1. TitleCard (75-90 frames) — introduce the topic
2. MetricCard (120 frames) — show key KPIs with count-up animation
3. Charts (90-120 frames each) — BarChart, LineChart, PieChart for data visualization
4. DataTable (90-120 frames) — detailed breakdown if applicable
5. StatCard or TitleCard (75-90 frames) — summary/outro

**Default clip settings:**
- Every scene clip should have: \`transitionIn: { type: "fade", durationInFrames: 15 }\`
- Every scene clip should have: \`motion: { enter: { opacity: 0, y: 30, duration: 20 } }\`
- Overlay clips use \`motion.enter\` for slide-in effects instead of transitions

**Timing rules:**
- Composition: 1920×1080, 30fps
- Total video length: 15-45 seconds (450-1350 frames)
- Clips on "main" track are placed sequentially (\`from\` = previous clip's \`from + durationInFrames\`)
- Overlay clips set \`from\` to align with the main clip they annotate
- Account for transition overlap: when a clip has transitionIn of 15 frames, it can overlap the previous clip by that amount

### TikTok Analytics Context

The data available for video reports includes:
- Video performance metrics (plays, likes, comments, shares, saves)
- Account growth data (followers over time)
- Engagement rates and trends
- Top performing content rankings
- Posting patterns and timing analysis
- Comment activity and top commenters

Use BarChart for comparisons, LineChart/AreaChart for trends, PieChart for proportions, EngagementTimeline for multi-metric series, MetricCard for KPIs, DataTable for detailed data.

### Composing Clips Together

Components are atomic building blocks. Combine them by placing scene clips on the "main" track and labels on the "overlay" track at the same \`from\` time.

**Example — Fan showcase (Avatar + LowerThird):**
Place an Avatar clip on "main" and a LowerThird on "overlay" at the same \`from\` value:
\`\`\`
main track:    [TitleCard 0-90] [Avatar 90-150] [Avatar 150-210] ...
overlay track:                  [LowerThird 90-150] [LowerThird 150-210] ...
\`\`\`
For commenter avatars, pass \`username\` (e.g. \`{ username: "liliarochel", fallback: "LR" }\`) — the component auto-fetches their profile image. The LowerThird \`name\` is their @username and \`title\` is their stats (e.g. "#1 Super Fan · 57 Comments").`;
}

// =============================================================================
// Type Exports
// =============================================================================

export type VideoCatalog = typeof videoCatalog;

export type VideoBarChartProps = z.infer<typeof BarChartSchema>;
export type VideoLineChartProps = z.infer<typeof LineChartSchema>;
export type VideoAreaChartProps = z.infer<typeof AreaChartSchema>;
export type VideoPieChartProps = z.infer<typeof PieChartSchema>;
export type VideoEngagementTimelineProps = z.infer<typeof EngagementTimelineSchema>;
export type VideoMetricCardProps = z.infer<typeof MetricCardSchema>;
export type VideoDataTableProps = z.infer<typeof DataTableSchema>;
export type VideoVideoCardProps = z.infer<typeof VideoCardSchema>;
export type VideoBadgeProps = z.infer<typeof BadgeSchema>;
export type VideoProgressProps = z.infer<typeof ProgressSchema>;
export type VideoAlertProps = z.infer<typeof AlertSchema>;
export type VideoSeparatorProps = z.infer<typeof SeparatorSchema>;
export type VideoAvatarProps = z.infer<typeof AvatarSchema>;
export type VideoSkeletonProps = z.infer<typeof SkeletonSchema>;
