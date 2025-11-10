import { Fragment, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => ReactNode;
  cell?: (row: T) => ReactNode;
  widthClass?: string;
  align?: "left" | "center" | "right";
  ariaSort?: "none" | "ascending" | "descending";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  busy?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  rowActions,
  busy = false,
  emptyMessage = "No records available.",
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("col-span-12 overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-soft", className)}>
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full border-collapse text-sm" role="grid">
          <thead className="sticky top-0 z-20 bg-surface-3 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.ariaSort ?? "none"}
                  className={cn(
                    "border-b border-subtle px-3 py-3 font-semibold",
                    column.widthClass,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? (
                <th scope="col" className="border-b border-subtle px-3 py-3 text-right">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <Fragment>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="border-b border-subtle/80 last:border-0">
                    <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-3 py-4">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-3 py-8 text-center text-sm text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId?.(row, index) ?? `row-${index}`;
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowId}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : -1}
                    onClick={clickable ? () => onRowClick?.(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick?.(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "border-b border-subtle/80 last:border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
                      clickable
                        ? "cursor-pointer hover:bg-surface-2/70 focus-visible:bg-surface-2/70"
                        : "hover:bg-surface-2/40"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${rowId}-${column.key}`}
                        className={cn(
                          "px-3 py-3 align-middle text-sm text-[var(--text)]",
                          column.widthClass,
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.cell ? column.cell(row) : column.accessor ? column.accessor(row) : null}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-3 py-3 text-right align-middle text-sm text-muted">
                        {rowActions(row)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
