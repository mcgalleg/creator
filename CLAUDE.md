# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server (Next.js on port 3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS, CSS variables for theming (light/dark modes)
- **UI Components**: Shadcn/ui (configured via components.json), Lucide React icons
- **Fonts**: Geist (Sans and Mono) via next/font

## Architecture

This is a Next.js App Router project using React Server Components by default.

**Path aliases**: Use `@/` to import from the project root (e.g., `@/lib/utils`, `@/components/ui`)

**Key directories**:
- `app/` - Next.js App Router pages and layouts
- `lib/` - Utility functions (includes `cn()` for className merging)
- `components/` - React components (Shadcn/ui components go in `components/ui/`)

## Shadcn/ui

Components are added via the shadcn CLI. The project uses:
- Style: New York
- Base color: neutral
- CSS variables for theming
