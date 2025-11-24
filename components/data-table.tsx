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
  const dataColumns = rowActions
    ? columns.filter((column) => column.key !== "actions")
    : columns;
  const actionsColumn = rowActions
    ? columns.find((column) => column.key === "actions")
    : undefined;

  return (
    <div
      className={cn(
        "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent",
        className
      )}
    >
      <div className="inline-block min-w-full align-middle">
        <table
          className="min-w-full table-auto divide-y divide-border text-sm"
          role="grid"
        >
          <thead className="bg-slate-900/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              {dataColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.ariaSort ?? "none"}
                  className={cn(
                    "px-4 py-3 whitespace-nowrap",
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
                  className={cn(
                    "px-4 py-3 text-right whitespace-nowrap",
                    actionsColumn?.widthClass
                  )}
                >
                  {actionsColumn?.header ?? "Actions"}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-950/70">
            {busy ? (
              <Fragment>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="transition-colors">
                    <td
                      colSpan={dataColumns.length + (rowActions ? 1 : 0)}
                      className="px-4 py-4"
                    >
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/50" />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={dataColumns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const original = row as Record<string, unknown>;
                const preferredId = getRowId?.(row, index);
                const rowKey =
                  (typeof preferredId === "string" && preferredId.trim() !== ""
                    ? preferredId
                    : undefined) ??
                  (typeof original?.id === "string" && original.id.trim() !== ""
                    ? original.id
                    : undefined) ??
                  (typeof original?.ruleId === "string" && original.ruleId.trim() !== ""
                    ? original.ruleId
                    : undefined) ??
                  (typeof original?.tripId === "string" && original.tripId.trim() !== ""
                    ? original.tripId
                    : undefined) ??
                  (typeof row === "object" && row !== null && "id" in row
                    ? String((row as { id?: string | number }).id)
                    : undefined) ??
                  `row-${index}`;
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey}
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
                      "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600/50 focus-visible:ring-offset-0",
                      clickable
                        ? "cursor-pointer hover:bg-slate-900/70 focus-visible:bg-slate-900/70"
                        : "hover:bg-slate-900/40"
                  )}
                >
                  {dataColumns.map((column) => (
                    <td
                      key={`${rowKey}-${column.key}`}
                      className={cn(
                        "px-4 py-3 align-middle text-sm text-slate-300 whitespace-nowrap",
                        column.widthClass,
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                      >
                        {column.cell ? column.cell(row) : column.accessor ? column.accessor(row) : null}
                      </td>
                    ))}
                    {rowActions ? (
                      <td
                        className={cn(
                          "px-4 py-3 text-right align-middle text-sm text-slate-300 whitespace-nowrap",
                          actionsColumn?.widthClass
                        )}
                      >
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

