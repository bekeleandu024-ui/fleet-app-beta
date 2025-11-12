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
    <div
      className={cn(
        "col-span-12 w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-lg shadow-black/40",
        className
      )}
    >
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm" role="grid">
          <thead className="sticky top-0 z-20 bg-neutral-950/60 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.ariaSort ?? "none"}
                  className={cn(
                    "border-b border-neutral-800 px-4 py-3 whitespace-nowrap",
                    column.widthClass,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? (
                <th
                  scope="col"
                  className="border-b border-neutral-800 px-4 py-3 text-right whitespace-nowrap"
                >
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {busy ? (
              <Fragment>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="border-b border-neutral-800/70 last:border-0">
                    <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-3 py-4">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-neutral-400"
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
                      "border-b border-neutral-800/70 last:border-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0",
                      clickable
                        ? "cursor-pointer hover:bg-neutral-900/70 focus-visible:bg-neutral-900/70"
                        : "hover:bg-neutral-900/50"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${rowId}-${column.key}`}
                        className={cn(
                          "px-4 py-3 align-middle text-sm text-neutral-200 whitespace-nowrap",
                          column.widthClass,
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.cell ? column.cell(row) : column.accessor ? column.accessor(row) : null}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-4 py-3 text-right align-middle text-sm text-neutral-400 whitespace-nowrap">
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
