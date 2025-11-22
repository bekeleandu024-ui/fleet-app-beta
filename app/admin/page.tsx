"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAdminCustomer,
  createAdminDriver,
  createAdminEvent,
  createAdminLane,
  createAdminOrder,
  createAdminRule,
  createAdminTrip,
  createAdminUnit,
  deleteAdminCustomer,
  deleteAdminDriver,
  deleteAdminEvent,
  deleteAdminLane,
  deleteAdminOrder,
  deleteAdminRule,
  deleteAdminTrip,
  deleteAdminUnit,
  fetchAdminCustomers,
  fetchAdminDrivers,
  fetchAdminEvents,
  fetchAdminLanes,
  fetchAdminOrders,
  fetchAdminRules,
  fetchAdminTrips,
  fetchAdminUnits,
  updateAdminCustomer,
  updateAdminDriver,
  updateAdminEvent,
  updateAdminLane,
  updateAdminOrder,
  updateAdminRule,
  updateAdminTrip,
  updateAdminUnit,
} from "@/lib/api";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type {
  CustomerAdminCreate,
  CustomerAdminRecord,
  CustomerAdminUpdate,
  DriverAdminCreate,
  DriverAdminRecord,
  DriverAdminUpdate,
  EventAdminCreate,
  EventAdminRecord,
  EventAdminUpdate,
  LaneAdminCreate,
  LaneAdminRecord,
  LaneAdminUpdate,
  OrderAdminCreate,
  OrderAdminRecord,
  OrderAdminUpdate,
  RuleAdminCreate,
  RuleAdminRecord,
  RuleAdminUpdate,
  TripAdminCreate,
  TripAdminRecord,
  TripAdminUpdate,
  UnitAdminCreate,
  UnitAdminRecord,
  UnitAdminUpdate,
} from "@/lib/types";

const laneColumns: DataTableColumn<LaneAdminRecord>[] = [
  { key: "lane", header: "Lane", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "origin", header: "Origin", accessor: (row) => row.origin, widthClass: "min-w-[140px]" },
  { key: "destination", header: "Destination", accessor: (row) => row.destination, widthClass: "min-w-[140px]" },
  {
    key: "miles",
    header: "Miles",
    accessor: (row) => formatNumber(row.miles),
    widthClass: "min-w-[100px]",
    align: "right",
  },
  {
    key: "transitDays",
    header: "Transit Days",
    accessor: (row) => formatNumber(row.transitDays),
    widthClass: "min-w-[120px]",
    align: "right",
  },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const orderColumns: DataTableColumn<OrderAdminRecord>[] = [
  { key: "order", header: "Order", accessor: (row) => row.id, widthClass: "min-w-[140px]" },
  { key: "reference", header: "Reference", accessor: (row) => row.reference, widthClass: "min-w-[140px]" },
  { key: "customer", header: "Customer", accessor: (row) => row.customer, widthClass: "min-w-[180px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "lane", header: "Lane", accessor: (row) => row.lane, widthClass: "min-w-[200px]" },
  {
    key: "serviceLevel",
    header: "Service Level",
    accessor: (row) => row.serviceLevel,
    widthClass: "min-w-[160px]",
  },
  { key: "commodity", header: "Commodity", accessor: (row) => row.commodity, widthClass: "min-w-[160px]" },
  {
    key: "cost",
    header: "Cost",
    accessor: (row) => (row.cost !== undefined ? formatCurrency(row.cost) : "—"),
    widthClass: "min-w-[120px]",
    align: "right",
  },
  {
    key: "laneMiles",
    header: "Lane Miles",
    accessor: (row) => formatNumber(row.laneMiles),
    widthClass: "min-w-[120px]",
    align: "right",
  },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const driverColumns: DataTableColumn<DriverAdminRecord>[] = [
  { key: "id", header: "Driver ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[160px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "region", header: "Region", accessor: (row) => row.region, widthClass: "min-w-[140px]" },
  {
    key: "hoursAvailable",
    header: "Hours Available",
    accessor: (row) => formatNumber(row.hoursAvailable),
    widthClass: "min-w-[140px]",
    align: "right",
  },
  { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[180px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const unitColumns: DataTableColumn<UnitAdminRecord>[] = [
  { key: "id", header: "Unit ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "type", header: "Type", accessor: (row) => row.type, widthClass: "min-w-[140px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "location", header: "Location", accessor: (row) => row.location, widthClass: "min-w-[160px]" },
  { key: "region", header: "Region", accessor: (row) => row.region, widthClass: "min-w-[140px]" },
  { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[180px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const ruleColumns: DataTableColumn<RuleAdminRecord>[] = [
  { key: "id", header: "Rule", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[200px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "region", header: "Region", accessor: (row) => row.region, widthClass: "min-w-[140px]" },
  { key: "owner", header: "Owner", accessor: (row) => row.owner, widthClass: "min-w-[160px]" },
  { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[180px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const eventColumns: DataTableColumn<EventAdminRecord>[] = [
  { key: "id", header: "Event", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[200px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "region", header: "Region", accessor: (row) => row.region, widthClass: "min-w-[140px]" },
  { key: "severity", header: "Severity", accessor: (row) => row.severity, widthClass: "min-w-[120px]" },
  { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[180px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const tripColumns: DataTableColumn<TripAdminRecord>[] = [
  { key: "id", header: "Trip", accessor: (row) => row.tripNumber, widthClass: "min-w-[120px]" },
  { key: "order", header: "Order", accessor: (row) => row.orderId, widthClass: "min-w-[120px]" },
  { key: "driver", header: "Driver", accessor: (row) => row.driver, widthClass: "min-w-[160px]" },
  { key: "unit", header: "Unit", accessor: (row) => row.unit, widthClass: "min-w-[120px]" },
  { key: "status", header: "Status", accessor: (row) => row.status, widthClass: "min-w-[120px]" },
  { key: "eta", header: "ETA", accessor: (row) => formatDateTime(row.eta), widthClass: "min-w-[180px]" },
  { key: "exceptions", header: "Exceptions", accessor: (row) => formatNumber(row.exceptions), align: "right" },
  { key: "lastPing", header: "Last Ping", accessor: (row) => formatDateTime(row.lastPing), widthClass: "min-w-[180px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

const customerColumns: DataTableColumn<CustomerAdminRecord>[] = [
  { key: "id", header: "Customer ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
  { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[200px]" },
  { key: "status", header: "Status", accessor: (row) => row.status },
  { key: "contact", header: "Primary Contact", accessor: (row) => row.primaryContact, widthClass: "min-w-[200px]" },
  { key: "lane", header: "Primary Lane", accessor: (row) => row.primaryLane, widthClass: "min-w-[160px]" },
  { key: "actions", header: "Actions", widthClass: "min-w-[180px]" },
];

type FieldKind = "text" | "number" | "select" | "email";

type FieldConfig<TRecord> = {
  name: keyof TRecord | string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  readOnlyOnEdit?: boolean;
};

const driverFields: FieldConfig<DriverAdminRecord>[] = [
  { name: "id", label: "Driver ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "name", label: "Name", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "Ready", value: "Ready" },
      { label: "Booked", value: "Booked" },
      { label: "Off Duty", value: "Off Duty" },
      { label: "Leave", value: "Leave" },
    ],
  },
  { name: "region", label: "Region", kind: "text" },
  { name: "hoursAvailable", label: "Hours Available", kind: "number" },
];

const unitFields: FieldConfig<UnitAdminRecord>[] = [
  { name: "id", label: "Unit ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "type", label: "Unit Type", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "Available", value: "Available" },
      { label: "In-use", value: "In-use" },
      { label: "Maintenance", value: "Maintenance" },
      { label: "Out of Service", value: "Out of Service" },
    ],
  },
  { name: "location", label: "Location", kind: "text" },
  { name: "region", label: "Region", kind: "text" },
];

const ruleFields: FieldConfig<RuleAdminRecord>[] = [
  { name: "id", label: "Rule ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "name", label: "Name", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Draft", value: "Draft" },
      { label: "Deprecated", value: "Deprecated" },
    ],
  },
  { name: "region", label: "Region", kind: "text" },
  { name: "owner", label: "Owner", kind: "text" },
];

const eventFields: FieldConfig<EventAdminRecord>[] = [
  { name: "id", label: "Event ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "name", label: "Name", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "Open", value: "Open" },
      { label: "Investigating", value: "Investigating" },
      { label: "Resolved", value: "Resolved" },
    ],
  },
  { name: "region", label: "Region", kind: "text" },
  {
    name: "severity",
    label: "Severity",
    kind: "select",
    options: [
      { label: "Low", value: "Low" },
      { label: "Medium", value: "Medium" },
      { label: "High", value: "High" },
    ],
  },
];

const laneFields: FieldConfig<LaneAdminRecord>[] = [
  { name: "id", label: "Lane ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "origin", label: "Origin", kind: "text" },
  { name: "destination", label: "Destination", kind: "text" },
  { name: "miles", label: "Miles", kind: "number" },
  { name: "transitDays", label: "Transit Days", kind: "number" },
];

const orderFields: FieldConfig<OrderAdminRecord>[] = [
  { name: "id", label: "Order ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "reference", label: "Reference", kind: "text" },
  { name: "customer", label: "Customer", kind: "text" },
  { name: "pickup", label: "Pickup", kind: "text" },
  { name: "delivery", label: "Delivery", kind: "text" },
  { name: "window", label: "Service Window", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "New", value: "New" },
      { label: "Planning", value: "Planning" },
      { label: "In Transit", value: "In Transit" },
      { label: "At Risk", value: "At Risk" },
      { label: "Delivered", value: "Delivered" },
      { label: "Exception", value: "Exception" },
    ],
  },
  { name: "ageHours", label: "Age (hours)", kind: "number" },
  { name: "cost", label: "Cost", kind: "number", required: false },
  { name: "lane", label: "Lane", kind: "text" },
  { name: "serviceLevel", label: "Service Level", kind: "text" },
  { name: "commodity", label: "Commodity", kind: "text" },
  { name: "laneMiles", label: "Lane Miles", kind: "number" },
];

const tripFields: FieldConfig<TripAdminRecord>[] = [
  { name: "id", label: "Trip ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "tripNumber", label: "Trip Number", kind: "text", required: false, placeholder: "Defaults to Trip ID" },
  { name: "orderId", label: "Order ID", kind: "text" },
  { name: "driverId", label: "Driver ID", kind: "text" },
  { name: "unitId", label: "Unit ID", kind: "text" },
  { name: "driver", label: "Driver Name", kind: "text" },
  { name: "unit", label: "Unit", kind: "text" },
  { name: "pickup", label: "Pickup", kind: "text" },
  { name: "delivery", label: "Delivery", kind: "text" },
  { name: "eta", label: "ETA (ISO)", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "On Time", value: "On Time" },
      { label: "Running Late", value: "Running Late" },
      { label: "Exception", value: "Exception" },
      { label: "Delivered", value: "Delivered" },
    ],
  },
  { name: "exceptions", label: "Exceptions", kind: "number" },
  { name: "lastPing", label: "Last Ping (ISO)", kind: "text" },
];

const customerFields: FieldConfig<CustomerAdminRecord>[] = [
  { name: "id", label: "Customer ID", kind: "text", required: false, placeholder: "Auto-generated if blank", readOnlyOnEdit: true },
  { name: "name", label: "Name", kind: "text" },
  {
    name: "status",
    label: "Status",
    kind: "select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Paused", value: "Paused" },
      { label: "Prospect", value: "Prospect" },
    ],
  },
  { name: "primaryContact", label: "Primary Contact", kind: "email" },
  { name: "primaryLane", label: "Primary Lane", kind: "text" },
];

type DialogMode = "create" | "edit" | "view" | "delete";

type DialogState<TRecord> = {
  mode: DialogMode;
  record?: TRecord;
};

type FormValues = Record<string, string>;

function toErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response;
    if (response?.data?.error && typeof response.data.error === "string") {
      return response.data.error;
    }
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Unable to complete the request.";
}

function mapRecordToValues<TRecord extends { id: string }>(record: TRecord, fields: FieldConfig<TRecord>[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const key = String(field.name);
    const raw = (record as Record<string, unknown>)[key];
    values[key] = raw === undefined || raw === null ? "" : String(raw);
  }
  return values;
}

function createEmptyValues<TRecord>(fields: FieldConfig<TRecord>[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    values[String(field.name)] = "";
  }
  return values;
}

function parseFormValues<TRecord>(fields: FieldConfig<TRecord>[], values: FormValues): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const key = String(field.name);
    const rawValue = values[key]?.toString() ?? "";
    const required = field.required ?? true;

    if (!rawValue.trim() && !required) {
      result[key] = undefined;
      continue;
    }

    if (!rawValue.trim() && required) {
      throw new Error(`${field.label} is required`);
    }

    switch (field.kind) {
      case "number": {
        const numeric = Number(rawValue);
        if (Number.isNaN(numeric)) {
          throw new Error(`${field.label} must be a number`);
        }
        result[key] = numeric;
        break;
      }
      case "email": {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawValue)) {
          throw new Error(`${field.label} must be a valid email`);
        }
        result[key] = rawValue.trim();
        break;
      }
      default: {
        result[key] = rawValue.trim();
      }
    }
  }
  return result;
}

interface AdminSectionProps<TRecord extends { id: string }, TCreate, TUpdate> {
  title: string;
  subtitle: string;
  addLabel: string;
  entityName: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TRecord[]>;
  columns: DataTableColumn<TRecord>[];
  fields: FieldConfig<TRecord>[];
  createMutationFn: (payload: TCreate) => Promise<TRecord>;
  updateMutationFn: (payload: TUpdate) => Promise<TRecord>;
  deleteMutationFn: (id: string) => Promise<void>;
  createTransformer: (values: FormValues) => TCreate;
  updateTransformer: (values: FormValues, record: TRecord) => TUpdate;
  getRecordLabel?: (record: TRecord) => string;
}

function AdminSection<TRecord extends { id: string }, TCreate, TUpdate>({
  title,
  subtitle,
  addLabel,
  entityName,
  queryKey,
  queryFn,
  columns,
  fields,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
  createTransformer,
  updateTransformer,
  getRecordLabel = (record) => record.id,
}: AdminSectionProps<TRecord, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey, queryFn });

  const [dialogState, setDialogState] = useState<DialogState<TRecord> | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(() => createEmptyValues(fields));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogState) {
      setFormValues(createEmptyValues(fields));
      setFormError(null);
      return;
    }

    if (dialogState.record) {
      setFormValues(mapRecordToValues(dialogState.record, fields));
    } else {
      setFormValues(createEmptyValues(fields));
    }
    setFormError(null);
  }, [dialogState, fields]);

  const createMutation = useMutation({
    mutationFn: createMutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setDialogState(null);
    },
    onError: (error) => {
      setFormError(toErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setDialogState(null);
    },
    onError: (error) => {
      setFormError(toErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setDialogState(null);
    },
    onError: (error) => {
      setFormError(toErrorMessage(error));
    },
  });

  const records = data ?? [];

  const busy = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const recordLabel = dialogState?.record ? getRecordLabel(dialogState.record) : "";

  const dialogTitle = dialogState
    ? dialogState.mode === "create"
      ? addLabel
      : dialogState.mode === "edit" && dialogState.record
        ? `Edit ${recordLabel || entityName}`
        : dialogState.mode === "view" && dialogState.record
          ? `Details for ${recordLabel || entityName}`
          : `Delete ${entityName}?`
    : "";

  const dialogDescription = dialogState
    ? dialogState.mode === "delete"
      ? `Are you sure you want to delete ${recordLabel || "this record"}? This action cannot be undone.`
      : "Manage the underlying data record."
    : "";

  const handleChange = (key: string, value: string) => {
    setFormValues((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!dialogState) return;
    try {
      if (dialogState.mode === "create") {
        const payload = createTransformer(formValues);
        await createMutation.mutateAsync(payload);
      } else if (dialogState.mode === "edit" && dialogState.record) {
        const payload = updateTransformer(formValues, dialogState.record);
        await updateMutation.mutateAsync(payload);
      }
    } catch (error) {
      setFormError(toErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!dialogState?.record) return;
    try {
      await deleteMutation.mutateAsync(dialogState.record.id);
    } catch (error) {
      setFormError(toErrorMessage(error));
    }
  };

  return (
    <SectionBanner
      title={title}
      subtitle={subtitle}
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setFormError(null);
            setDialogState({ mode: "create" });
          }}
        >
          {addLabel}
        </Button>
      }
    >
      <div className="space-y-4">
        {isError ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            Unable to load data. Refresh the page to try again.
          </div>
        ) : null}
        <div className="relative">
          <DataTable
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]"
            columns={columns}
            data={records}
            busy={busy}
            getRowId={(row) => row.id}
            emptyMessage="No records available."
            rowActions={(row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="plain"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFormError(null);
                    setDialogState({ mode: "edit", record: row });
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="plain"
                  className="text-rose-400 hover:text-rose-300"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFormError(null);
                    setDialogState({ mode: "delete", record: row });
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Delete
                </Button>
              </div>
            )}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-lg bg-gradient-to-l from-[var(--surface-1)] to-transparent"
          />
        </div>
      </div>
      <Dialog open={dialogState !== null} onOpenChange={(open) => (!open ? setDialogState(null) : undefined)}>
        {dialogState ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              {dialogDescription ? <DialogDescription>{dialogDescription}</DialogDescription> : null}
            </DialogHeader>
            {dialogState.mode === "delete" ? (
              <div className="space-y-4 text-sm">
                {formError ? (
                  <div className="rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-rose-200">{formError}</div>
                ) : null}
                <DialogFooter>
                  <Button variant="subtle" onClick={() => setDialogState(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="border-rose-400/70 bg-rose-500 text-white hover:bg-rose-400"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </div>
            ) : dialogState.mode === "view" && dialogState.record ? (
              <div className="space-y-4 text-sm">
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={String(field.name)} className="grid gap-1">
                      <span className="text-xs uppercase tracking-wide text-neutral-500">{field.label}</span>
                      <span className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100">
                        {String((dialogState.record as Record<string, unknown>)[String(field.name)] ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="plain" onClick={() => setDialogState(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                {fields.map((field) => {
                  const key = String(field.name);
                  const value = formValues[key] ?? "";
                  const disabled = dialogState.mode === "edit" && field.readOnlyOnEdit;
                  return (
                    <label key={key} className="grid gap-2 text-sm">
                      <span className="text-xs uppercase tracking-wide text-neutral-500">{field.label}</span>
                      {field.kind === "select" && field.options ? (
                        <Select
                          value={value}
                          onChange={(event) => handleChange(key, event.target.value)}
                          disabled={disabled}
                          placeholder="Select option"
                        >
                          <option value="" disabled>
                            Select option
                          </option>
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type={field.kind === "number" ? "number" : field.kind === "email" ? "email" : "text"}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(event) => handleChange(key, event.target.value)}
                          disabled={disabled}
                        />
                      )}
                    </label>
                  );
                })}
                {formError ? (
                  <div className="rounded-md border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-rose-200">{formError}</div>
                ) : null}
                <DialogFooter>
                  <Button variant="plain" onClick={() => setDialogState(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        ) : null}
      </Dialog>
    </SectionBanner>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
        <strong className="font-semibold">Admin area:</strong> changes affect live operations. Review entries carefully before
        saving updates.
      </div>
      <Tabs defaultValue="master" className="space-y-6">
        <TabsList>
          <TabsTrigger value="master">Master Data</TabsTrigger>
          <TabsTrigger value="operational">Operational Data</TabsTrigger>
        </TabsList>
        <TabsContent value="master" className="space-y-6">
          <AdminSection
            title="Drivers"
            subtitle="Manage driver profiles and availability."
            addLabel="Add Driver"
            entityName="Driver"
            getRecordLabel={(record) => (record.name ? `${record.name} (${record.id})` : record.id)}
            queryKey={queryKeys.admin.drivers}
            queryFn={fetchAdminDrivers}
            columns={driverColumns}
            fields={driverFields}
            createMutationFn={createAdminDriver}
            updateMutationFn={updateAdminDriver}
            deleteMutationFn={deleteAdminDriver}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(driverFields, values) as Record<string, unknown>),
              }) as DriverAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(driverFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as DriverAdminUpdate
            }
          />
          <AdminSection
            title="Units"
            subtitle="Track fleet assets and maintenance availability."
            addLabel="Add Unit"
            entityName="Unit"
            queryKey={queryKeys.admin.units}
            queryFn={fetchAdminUnits}
            columns={unitColumns}
            fields={unitFields}
            createMutationFn={createAdminUnit}
            updateMutationFn={updateAdminUnit}
            deleteMutationFn={deleteAdminUnit}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(unitFields, values) as Record<string, unknown>),
              }) as UnitAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(unitFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as UnitAdminUpdate
            }
          />
          <AdminSection
            title="Costing Rules"
            subtitle="Maintain business rules for pricing and compliance."
            addLabel="Add Rule"
            entityName="Rule"
            getRecordLabel={(record) => (record.name ? `${record.name} (${record.id})` : record.id)}
            queryKey={queryKeys.admin.rules}
            queryFn={fetchAdminRules}
            columns={ruleColumns}
            fields={ruleFields}
            createMutationFn={createAdminRule}
            updateMutationFn={updateAdminRule}
            deleteMutationFn={deleteAdminRule}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(ruleFields, values) as Record<string, unknown>),
              }) as RuleAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(ruleFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as RuleAdminUpdate
            }
          />
          <AdminSection
            title="Event Types"
            subtitle="Control operational event classifications and severity."
            addLabel="Add Event"
            entityName="Event"
            getRecordLabel={(record) => (record.name ? `${record.name} (${record.id})` : record.id)}
            queryKey={queryKeys.admin.events}
            queryFn={fetchAdminEvents}
            columns={eventColumns}
            fields={eventFields}
            createMutationFn={createAdminEvent}
            updateMutationFn={updateAdminEvent}
            deleteMutationFn={deleteAdminEvent}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(eventFields, values) as Record<string, unknown>),
              }) as EventAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(eventFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as EventAdminUpdate
            }
          />
        </TabsContent>
        <TabsContent value="operational" className="space-y-6">
          <AdminSection
            title="Lanes"
            subtitle="Define standard lanes for pricing and planning."
            addLabel="Add Lane"
            entityName="Lane"
            getRecordLabel={(record) => `${record.origin} → ${record.destination} (${record.id})`}
            queryKey={queryKeys.admin.lanes}
            queryFn={fetchAdminLanes}
            columns={laneColumns}
            fields={laneFields}
            createMutationFn={createAdminLane}
            updateMutationFn={updateAdminLane}
            deleteMutationFn={deleteAdminLane}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(laneFields, values) as Record<string, unknown>),
              }) as LaneAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(laneFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as LaneAdminUpdate
            }
          />
          <AdminSection
            title="Orders"
            subtitle="Review and curate order master data used downstream."
            addLabel="Add Order"
            entityName="Order"
            getRecordLabel={(record) => (record.reference ? `${record.id} (${record.reference})` : record.id)}
            queryKey={queryKeys.admin.orders}
            queryFn={fetchAdminOrders}
            columns={orderColumns}
            fields={orderFields}
            createMutationFn={createAdminOrder}
            updateMutationFn={updateAdminOrder}
            deleteMutationFn={deleteAdminOrder}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(orderFields, values) as Record<string, unknown>),
              }) as OrderAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(orderFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as OrderAdminUpdate
            }
          />
          <AdminSection
            title="Trips"
            subtitle="Administer trip assignments and telemetry anchors."
            addLabel="Add Trip"
            entityName="Trip"
            getRecordLabel={(record) => record.tripNumber ?? record.id}
            queryKey={queryKeys.admin.trips}
            queryFn={fetchAdminTrips}
            columns={tripColumns}
            fields={tripFields}
            createMutationFn={createAdminTrip}
            updateMutationFn={updateAdminTrip}
            deleteMutationFn={deleteAdminTrip}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(tripFields, values) as Record<string, unknown>),
              }) as TripAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(tripFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as TripAdminUpdate
            }
          />
          <AdminSection
            title="Customers"
            subtitle="Maintain account master data and routing preferences."
            addLabel="Add Customer"
            entityName="Customer"
            getRecordLabel={(record) => (record.name ? `${record.name} (${record.id})` : record.id)}
            queryKey={queryKeys.admin.customers}
            queryFn={fetchAdminCustomers}
            columns={customerColumns}
            fields={customerFields}
            createMutationFn={createAdminCustomer}
            updateMutationFn={updateAdminCustomer}
            deleteMutationFn={deleteAdminCustomer}
            createTransformer={(values) =>
              ({
                ...(parseFormValues(customerFields, values) as Record<string, unknown>),
              }) as CustomerAdminCreate
            }
            updateTransformer={(values, record) =>
              ({
                id: record.id,
                ...(parseFormValues(customerFields.filter((field) => field.name !== "id"), values) as Record<string, unknown>),
              }) as CustomerAdminUpdate
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

