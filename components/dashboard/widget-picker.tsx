"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  widgetRegistry,
  type WidgetCategory,
  type WidgetDefinition,
} from "@/lib/widgets";
import {
  Search,
  LayoutGrid,
  BarChart3,
  FileText,
  Heart,
  MessageCircle,
  Plus,
} from "lucide-react";

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetSelect: (widgetId: string) => void;
}

const CATEGORY_CONFIG: Record<
  WidgetCategory | "all",
  { label: string; icon: typeof LayoutGrid }
> = {
  all: { label: "All", icon: LayoutGrid },
  kpi: { label: "KPIs", icon: LayoutGrid },
  chart: { label: "Charts", icon: BarChart3 },
  content: { label: "Content", icon: FileText },
  engagement: { label: "Engagement", icon: Heart },
  comments: { label: "Comments", icon: MessageCircle },
};

function WidgetCard({
  widget,
  onSelect,
}: {
  widget: WidgetDefinition;
  onSelect: () => void;
}) {
  const IconComponent = widget.icon;

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted">
          <IconComponent className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight truncate">
            {widget.name}
          </h3>
          <span className="text-xs text-muted-foreground capitalize">
            {widget.category}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
        {widget.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {widget.defaultSize.w}x{widget.defaultSize.h}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onSelect}
          className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function WidgetPicker({
  isOpen,
  onClose,
  onWidgetSelect,
}: WidgetPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    WidgetCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWidgets = useMemo(() => {
    let widgets: WidgetDefinition[];

    if (selectedCategory === "all") {
      widgets = widgetRegistry.getAll();
    } else {
      widgets = widgetRegistry.getByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      widgets = widgets.filter(
        (widget) =>
          widget.name.toLowerCase().includes(query) ||
          widget.description.toLowerCase().includes(query)
      );
    }

    return widgets;
  }, [selectedCategory, searchQuery]);

  const handleWidgetSelect = (widgetId: string) => {
    onWidgetSelect(widgetId);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state when closing
      setSearchQuery("");
      setSelectedCategory("all");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs
          value={selectedCategory}
          onValueChange={(value) =>
            setSelectedCategory(value as WidgetCategory | "all")
          }
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="w-full justify-start">
            {(
              Object.entries(CATEGORY_CONFIG) as [
                WidgetCategory | "all",
                (typeof CATEGORY_CONFIG)[WidgetCategory | "all"],
              ][]
            ).map(([key, { label, icon: Icon }]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <Icon className="size-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="flex-1 min-h-0 mt-4">
            <div className="overflow-y-auto max-h-[400px] pr-1">
              {filteredWidgets.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredWidgets.map((widget) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      onSelect={() => handleWidgetSelect(widget.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LayoutGrid className="size-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No widgets match your search"
                      : "No widgets available in this category"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
