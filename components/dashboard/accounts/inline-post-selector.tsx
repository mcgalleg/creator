"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
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
import { formatNumber } from "./shared-utils";

interface InlinePostSelectorProps {
  accountId: number;
  selectedTiktokIds: Set<string>;
  onSelectionChange: (
    selectedIds: Set<string>,
    commentCounts: Map<string, number>,
    syncedCounts: Map<string, number>
  ) => void;
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

export function InlinePostSelector({
  accountId,
  selectedTiktokIds,
  onSelectionChange,
}: InlinePostSelectorProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "sm";

  const commentCountsRef = useRef<Map<string, number>>(new Map());
  const syncedCountsRef = useRef<Map<string, number>>(new Map());

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
  } = usePostSelection({ accountId, enabled: true });

  // Track comment counts across pages
  useEffect(() => {
    for (const post of posts) {
      commentCountsRef.current.set(post.tiktokId, post.comments);
      syncedCountsRef.current.set(post.tiktokId, post.syncedCommentCount);
    }
  }, [posts]);

  const handleSort = (key: SortBy) => {
    if (sortBy === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const rowSelection: RowSelectionState = useMemo(() => {
    const sel: RowSelectionState = {};
    posts.forEach((post) => {
      if (selectedTiktokIds.has(post.tiktokId)) {
        sel[post.tiktokId] = true;
      }
    });
    return sel;
  }, [posts, selectedTiktokIds]);

  const handleRowSelectionChange = (
    updaterOrValue: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)
  ) => {
    const newRowSelection =
      typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection)
        : updaterOrValue;

    const next = new Set(selectedTiktokIds);
    posts.forEach((post) => {
      if (newRowSelection[post.tiktokId]) {
        next.add(post.tiktokId);
      } else {
        next.delete(post.tiktokId);
      }
    });

    // Build maps for selected posts only
    const selectedComments = new Map<string, number>();
    const selectedSynced = new Map<string, number>();
    for (const tiktokId of next) {
      const count = commentCountsRef.current.get(tiktokId);
      if (count !== undefined) selectedComments.set(tiktokId, count);
      const synced = syncedCountsRef.current.get(tiktokId);
      if (synced !== undefined) selectedSynced.set(tiktokId, synced);
    }

    onSelectionChange(next, selectedComments, selectedSynced);
  };

  const desktopColumns: ColumnDef<Post>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
          <div className="max-w-[200px] truncate text-sm" title={row.original.description ?? undefined}>
            {row.original.description || "No description"}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "plays",
        header: () => <SortHeader label="Plays" columnKey="plays" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />,
        cell: ({ row }) => <span className="text-sm tabular-nums">{formatNumber(row.original.plays)}</span>,
        enableSorting: false,
      },
      {
        accessorKey: "likes",
        header: () => <SortHeader label="Likes" columnKey="likes" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />,
        cell: ({ row }) => <span className="text-sm tabular-nums">{formatNumber(row.original.likes)}</span>,
        enableSorting: false,
      },
      {
        accessorKey: "postedAt",
        header: () => <SortHeader label="Posted" columnKey="postedAt" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {row.original.postedAt
              ? new Date(row.original.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })
              : "\u2014"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "comments",
        header: () => <SortHeader label="Comments" columnKey="comments" currentSortBy={sortBy} currentSortDir={sortDir} onSort={handleSort} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums text-sm">{formatNumber(row.original.comments)}</span>
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

  const mobileColumns: ColumnDef<Post>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
              </span>
              {row.original.postedAt && (
                <span className="tabular-nums">
                  {new Date(row.original.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
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
      const newPag = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(newPag.pageIndex);
      setPageSize(newPag.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowId: (row) => row.tiktokId,
    enableRowSelection: true,
  });

  return (
    <div className="rounded-lg border bg-card mt-3">
      {/* Search + Count */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        {selectedTiktokIds.size > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-medium text-foreground">{selectedTiktokIds.size}</span> post{selectedTiktokIds.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Table */}
      <div className="max-h-[300px] overflow-auto">
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
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Loading posts...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0); }}
          >
            <SelectTrigger className="h-7 w-[60px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">of {total}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-7" onClick={() => setPageIndex(pageIndex - 1)} disabled={pageIndex === 0}>
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="px-1.5 text-muted-foreground">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button variant="outline" size="icon" className="size-7" onClick={() => setPageIndex(pageIndex + 1)} disabled={pageIndex >= pageCount - 1}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
