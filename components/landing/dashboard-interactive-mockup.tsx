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

// ─── Widget definitions ───

function ViewsWidget() {
  return (
    <div className="h-full p-2 flex flex-col justify-between">
      <div className="text-[8px] text-muted-foreground">Total Views</div>
      <div className="text-sm font-bold leading-none">847K</div>
      <svg viewBox="0 0 60 20" className="w-full h-3 mt-1">
        <polyline
          points="0,18 8,14 16,16 24,8 32,12 40,6 48,4 60,7"
          fill="none"
          className="stroke-primary"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-[8px] font-medium text-emerald-500">+8.1%</div>
    </div>
  );
}

function EngagementWidget() {
  return (
    <div className="h-full p-2 flex flex-col justify-between">
      <div className="text-[8px] text-muted-foreground">Engagement</div>
      <div className="text-sm font-bold leading-none">4.2%</div>
      <svg viewBox="0 0 60 20" className="w-full h-3 mt-1">
        <polyline
          points="0,15 10,12 20,14 30,10 40,8 50,6 60,9"
          fill="none"
          className="stroke-blue-500"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-[8px] font-medium text-emerald-500">+0.5%</div>
    </div>
  );
}

function PostsByDayWidget() {
  return (
    <div className="h-full p-2 flex flex-col">
      <div className="text-[8px] text-muted-foreground mb-1">Posts by Day</div>
      <div className="flex-1 flex items-end gap-0.5">
        {[40, 65, 50, 80, 55, 35, 25].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-px">
            <div
              className="w-full rounded-[1px] bg-primary/50"
              style={{ height: `${h}%` }}
            />
            <span className="text-[6px] text-muted-foreground/60">
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentWidget() {
  return (
    <div className="h-full p-2 flex flex-col">
      <div className="text-[8px] text-muted-foreground mb-1.5">Sentiment</div>
      <div className="flex-1 flex flex-col justify-center space-y-1">
        {[
          { pct: 72, color: "bg-emerald-500" },
          { pct: 20, color: "bg-blue-400" },
          { pct: 8, color: "bg-red-400" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1">
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

const WIDGETS = [
  { id: "views", render: ViewsWidget },
  { id: "engagement", render: EngagementWidget },
  { id: "posts", render: PostsByDayWidget },
  { id: "sentiment", render: SentimentWidget },
];

// ─── Sortable item ───

function SortableWidget({
  id,
  children,
}: {
  id: string;
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
      className={`
        h-[72px] rounded-lg border bg-card overflow-hidden
        ${isDragging ? "shadow-lg ring-1 ring-primary/30" : ""}
      `}
    >
      {children}
    </div>
  );
}

// ─── Component ───

export function DashboardInteractiveMockup() {
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
    <div className="mt-4 relative select-none">
      <DndContext
        id="dashboard-interactive"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-2">
            {order.map((id) => {
              const widget = widgetMap.get(id)!;
              return (
                <SortableWidget key={id} id={id}>
                  {widget.render()}
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      {!hasDragged && (
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2 animate-pulse">
          drag widgets to reorder
        </p>
      )}
    </div>
  );
}
