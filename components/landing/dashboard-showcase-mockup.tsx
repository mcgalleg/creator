"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Individual widget renderers ───

function FollowersKpi() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[9px] text-muted-foreground mb-0.5">Followers</div>
      <div className="text-sm font-bold leading-tight">12.4K</div>
      <div className="text-[9px] font-medium text-green-600 dark:text-green-400">
        +3.2%
      </div>
    </div>
  );
}

function PlaysKpi() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[9px] text-muted-foreground mb-0.5">Total Plays</div>
      <div className="text-sm font-bold leading-tight">847K</div>
      <div className="text-[9px] font-medium text-green-600 dark:text-green-400">
        +8.1%
      </div>
    </div>
  );
}

function EngagementKpi() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[9px] text-muted-foreground mb-0.5">Engagement</div>
      <div className="text-sm font-bold leading-tight">4.2%</div>
      <div className="text-[9px] font-medium text-green-600 dark:text-green-400">
        +0.5%
      </div>
    </div>
  );
}

function AvgViewsKpi() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[9px] text-muted-foreground mb-0.5">Avg Views</div>
      <div className="text-sm font-bold leading-tight">6.8K</div>
      <div className="text-[9px] font-medium text-red-600 dark:text-red-400">
        -2.1%
      </div>
    </div>
  );
}

function EngagementTrends() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-medium">Engagement Trends</div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-primary" />
            <span className="text-[8px] text-muted-foreground">Plays</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-blue-500" />
            <span className="text-[8px] text-muted-foreground">Likes</span>
          </div>
        </div>
      </div>
      <div className="relative h-16">
        <svg
          viewBox="0 0 200 60"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,45 C20,42 40,30 60,35 C80,40 100,20 120,25 C140,30 160,15 180,10 L200,12 L200,60 L0,60Z"
            className="fill-primary/10"
          />
          <path
            d="M0,45 C20,42 40,30 60,35 C80,40 100,20 120,25 C140,30 160,15 180,10 L200,12"
            className="stroke-primary"
            fill="none"
            strokeWidth="1.5"
          />
          <path
            d="M0,50 C20,48 40,40 60,42 C80,44 100,32 120,35 C140,38 160,28 180,22 L200,25 L200,60 L0,60Z"
            className="fill-blue-500/10"
          />
          <path
            d="M0,50 C20,48 40,40 60,42 C80,44 100,32 120,35 C140,38 160,28 180,22 L200,25"
            className="stroke-blue-500"
            fill="none"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

function PostsByDay() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[10px] font-medium mb-1.5">Posts by Day</div>
      <div className="flex items-end gap-1 h-10">
        {[
          { d: "M", h: 40 },
          { d: "T", h: 65 },
          { d: "W", h: 50 },
          { d: "T", h: 80 },
          { d: "F", h: 55 },
          { d: "S", h: 35 },
          { d: "S", h: 25 },
        ].map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-sm bg-primary/40"
              style={{ height: `${bar.h}%` }}
            />
            <span className="text-[7px] text-muted-foreground">{bar.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sentiment() {
  return (
    <div className="rounded-lg border bg-card p-2 h-full">
      <div className="text-[10px] font-medium mb-1.5">Sentiment</div>
      <div className="space-y-1">
        {[
          { label: "Positive", pct: 72, color: "bg-emerald-500" },
          { label: "Neutral", pct: 20, color: "bg-blue-400" },
          { label: "Negative", pct: 8, color: "bg-red-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[7px] text-muted-foreground w-8 shrink-0">
              {s.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color}`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widget registry with grid span info ───

interface WidgetDef {
  id: string;
  colSpan: number; // out of 4 columns
  render: () => React.ReactNode;
}

const WIDGETS: WidgetDef[] = [
  { id: "followers", colSpan: 1, render: FollowersKpi },
  { id: "plays", colSpan: 1, render: PlaysKpi },
  { id: "engagement", colSpan: 1, render: EngagementKpi },
  { id: "avg-views", colSpan: 1, render: AvgViewsKpi },
  { id: "trends", colSpan: 4, render: EngagementTrends },
  { id: "posts-by-day", colSpan: 2, render: PostsByDay },
  { id: "sentiment", colSpan: 2, render: Sentiment },
];

// ─── Sortable widget wrapper ───

function SortableWidget({
  id,
  colSpan,
  children,
}: {
  id: string;
  colSpan: number;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    gridColumn: `span ${colSpan}`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg ${isDragging ? "shadow-lg ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  );
}

// ─── Component ───

export function DashboardShowcaseMockup() {
  const [order, setOrder] = useState(WIDGETS.map((w) => w.id));
  const [hasDragged, setHasDragged] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const widgetMap = new Map(WIDGETS.map((w) => [w.id, w]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIdx, newIdx);
    });
    if (!hasDragged) setHasDragged(true);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden [transform:perspective(1200px)_rotateY(-2deg)] transition-transform hover:[transform:perspective(1200px)_rotateY(0deg)]">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400/60" />
          <div className="size-2.5 rounded-full bg-yellow-400/60" />
          <div className="size-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="text-xs text-muted-foreground ml-2">Dashboard</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-5 w-14 rounded bg-muted text-[9px] flex items-center justify-center text-muted-foreground">
            30d
          </div>
          <div className="size-5 rounded bg-primary/10 flex items-center justify-center">
            <div className="size-2.5 text-primary">+</div>
          </div>
        </div>
      </div>

      <div className="p-3 select-none">
        <DndContext
          id="dashboard-showcase"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-2">
              {order.map((id) => {
                const widget = widgetMap.get(id)!;
                return (
                  <SortableWidget key={id} id={id} colSpan={widget.colSpan}>
                    {widget.render()}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        {!hasDragged && (
          <p className="text-[8px] text-muted-foreground/40 text-center mt-2 animate-pulse">
            try dragging the widgets around
          </p>
        )}
      </div>
    </div>
  );
}
