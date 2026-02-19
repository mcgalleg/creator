"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface DataTableColumn {
  key: string
  header: string
  width?: string
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn[]
  data: T[]
  title?: string
  className?: string
}

function DataTable<T extends Record<string, unknown>>({
  columns = [],
  data = [],
  title,
  className,
}: DataTableProps<T>) {
  const tableColumns = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns
        .filter((col) => col && col.key)
        .map((col, index) => ({
          id: col.key || `col-${index}`,
          accessorKey: col.key,
          header: col.header || col.key,
          size: col.width ? parseInt(col.width, 10) : undefined,
          cell: ({ getValue }) => {
            const value = getValue()
            if (typeof value === "number") {
              return value.toLocaleString()
            }
            return String(value ?? "")
          },
        })),
    [columns]
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table API is designed for this pattern
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const content = (
    <Table className={cn(className)}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{
                  width: header.column.getSize()
                    ? `${header.column.getSize()}px`
                    : undefined,
                }}
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
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  if (!title) {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

export { DataTable }
