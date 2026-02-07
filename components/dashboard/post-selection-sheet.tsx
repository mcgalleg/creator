"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import {
  usePostSelection,
  type Post,
  type SortBy,
} from "@/hooks/use-post-selection";

interface PostSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  selectedTiktokIds: Set<string>;
  onConfirm: (selectedIds: Set<string>, commentCounts: Map<string, number>, syncedCounts: Map<string, number>) => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function SortHeader({
  label,
  columnKey,
  currentSortBy,
  currentSortDir,
  onSort,
}: {
  label: string;
  columnKey: SortBy;
  currentSortBy: SortBy;
  currentSortDir: "asc" | "desc";
  onSort: (key: SortBy) => void;
}) {
  const isActive = currentSortBy === columnKey;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => onSort(columnKey)}
    >
      {label}
      {isActive ? (
        currentSortDir === "asc" ? (
          <ArrowUp className="ml-1 size-3.5" />
        ) : (
          <ArrowDown className="ml-1 size-3.5" />
        )
      ) : (
        <ArrowUpDown className="ml-1 size-3.5 opacity-50" />
      )}
    </Button>
  );
}

export function PostSelectionSheet({
  open,
  onOpenChange,
  accountId,
  selectedTiktokIds,
  onConfirm,
}: PostSelectionSheetProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "sm";

  // Local copy of selection that we commit on confirm
  const [localSelection, setLocalSelection] = useState<Set<string>>(
    () => new Set(selectedTiktokIds)
  );

  // Accumulate comment counts and synced counts as we see posts across pages
  const commentCountsRef = useRef<Map<string, number>>(new Map());
  const syncedCountsRef = useRef<Map<string, number>>(new Map());

  // Sync external selection when the sheet opens
  useEffect(() => {
    if (open) {
      setLocalSelection(new Set(selectedTiktokIds));
      commentCountsRef.current = new Map();
      syncedCountsRef.current = new Map();
    }
  }, [open, selectedTiktokIds]);

  const {
    posts,
    total,
    pageCount,
    isLoading,
    pageIndex,
    pageSize,
    search,
    sortBy,
    sortDir,
    setPageIndex,
    setPageSize,
    setSearch,
    setSortBy,
    setSortDir,
  } = usePostSelection({ accountId, enabled: open });

  // Update comment counts and synced counts whenever posts load (tracks across pages)
  useEffect(() => {
    for (const post of posts) {
      commentCountsRef.current.set(post.tiktokId, post.comments);
      syncedCountsRef.current.set(post.tiktokId, post.syncedCommentCount);
    }
  }, [posts]);

  // Handle sort toggle
  const handleSort = (key: SortBy) => {
    if (sortBy === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  // Convert localSelection Set to tanstack rowSelection record for current page
  // Keys must be tiktokIds since getRowId returns tiktokId
  const rowSelection: RowSelectionState = useMemo(() => {
    const sel: RowSelectionState = {};
    posts.forEach((post) => {
      if (localSelection.has(post.tiktokId)) {
        sel[post.tiktokId] = true;
      }
    });
    return sel;
  }, [posts, localSelection]);

  // Handle row selection changes from tanstack
  const handleRowSelectionChange = (
    updaterOrValue: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)
  ) => {
    const newRowSelection =
      typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection)
        : updaterOrValue;

    setLocalSelection((prev) => {
      const next = new Set(prev);
      // Update selection based on current page rows using tiktokId as key
      posts.forEach((post) => {
        if (newRowSelection[post.tiktokId]) {
          next.add(post.tiktokId);
        } else {
          next.delete(post.tiktokId);
        }
      });
      return next;
    });
  };

  // Desktop columns
  const desktopColumns: ColumnDef<Post>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate" title={row.original.description ?? undefined}>
            {row.original.description || "No description"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "plays",
        header: () => (
          <SortHeader
            label="Plays"
            columnKey="plays"
            currentSortBy={sortBy}
            currentSortDir={sortDir}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => formatNumber(row.original.plays),
        enableSorting: false,
      },
      {
        accessorKey: "likes",
        header: () => (
          <SortHeader
            label="Likes"
            columnKey="likes"
            currentSortBy={sortBy}
            currentSortDir={sortDir}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => formatNumber(row.original.likes),
        enableSorting: false,
      },
      {
        accessorKey: "comments",
        header: () => (
          <SortHeader
            label="Comments"
            columnKey="comments"
            currentSortBy={sortBy}
            currentSortDir={sortDir}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums">{formatNumber(row.original.comments)}</span>
            {row.original.syncedCommentCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                {formatNumber(row.original.syncedCommentCount)} synced
              </Badge>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "postedAt",
        header: () => (
          <SortHeader
            label="Posted"
            columnKey="postedAt"
            currentSortBy={sortBy}
            currentSortDir={sortDir}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => formatDate(row.original.postedAt),
        enableSorting: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSort uses sortBy/sortDir
    [sortBy, sortDir]
  );

  // Mobile columns — compact with inline stats
  const mobileColumns: ColumnDef<Post>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "description",
        header: "Post",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate text-sm" title={row.original.description ?? undefined}>
              {row.original.description || "No description"}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Play className="size-3" />
                {formatNumber(row.original.plays)}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart className="size-3" />
                {formatNumber(row.original.likes)}
              </span>
              <span className="flex items-center gap-0.5">
                <MessageCircle className="size-3" />
                {formatNumber(row.original.comments)}
                {row.original.syncedCommentCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 ml-0.5">
                    {formatNumber(row.original.syncedCommentCount)} synced
                  </Badge>
                )}
              </span>
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "comments",
        header: () => (
          <SortHeader
            label="Comments"
            columnKey="comments"
            currentSortBy={sortBy}
            currentSortDir={sortDir}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums">{formatNumber(row.original.comments)}</span>
            {row.original.syncedCommentCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                {formatNumber(row.original.syncedCommentCount)} synced
              </Badge>
            )}
          </div>
        ),
        enableSorting: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortDir]
  );

  const columns = isMobile ? mobileColumns : desktopColumns;

  const table = useReactTable({
    data: posts,
    columns,
    pageCount,
    state: {
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: (updater) => {
      const newPag =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPag.pageIndex);
      setPageSize(newPag.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowId: (row) => row.tiktokId,
    enableRowSelection: true,
  });

  const handleConfirm = () => {
    // Build comment counts and synced counts maps for only the selected posts
    const selectedCommentCounts = new Map<string, number>();
    const selectedSyncedCounts = new Map<string, number>();
    for (const tiktokId of localSelection) {
      const count = commentCountsRef.current.get(tiktokId);
      if (count !== undefined) {
        selectedCommentCounts.set(tiktokId, count);
      }
      const syncedCount = syncedCountsRef.current.get(tiktokId);
      if (syncedCount !== undefined) {
        selectedSyncedCounts.set(tiktokId, syncedCount);
      }
    }
    onConfirm(localSelection, selectedCommentCounts, selectedSyncedCounts);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[95vh] flex flex-col"
            : "sm:max-w-3xl w-full flex flex-col"
        }
        showCloseButton={false}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Select Posts</SheetTitle>
          <SheetDescription>
            Choose posts to sync comments for. {localSelection.size > 0 && (
              <span className="font-medium text-foreground">
                {localSelection.size} selected
              </span>
            )}
          </SheetDescription>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </SheetHeader>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading posts...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center text-muted-foreground"
                  >
                    {search ? "No posts match your search." : "No posts found."}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => row.toggleSelected(!row.getIsSelected())}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="shrink-0 flex items-center justify-between border-t px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">
              of {total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-muted-foreground">
              {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="shrink-0 flex-row justify-between border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {localSelection.size > 0 && (
              <Badge variant="secondary">
                {localSelection.size} post{localSelection.size !== 1 ? "s" : ""} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Selection
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
