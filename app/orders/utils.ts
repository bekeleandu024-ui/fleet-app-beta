import { OrderStatus } from "./types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function marginColor(marginPct: number): string {
  if (marginPct >= 0.15) return "text-fleet-success bg-fleet-success/10 border-fleet-success/20";
  if (marginPct >= 0.05) return "text-fleet-warning bg-fleet-warning/10 border-fleet-warning/20";
  return "text-fleet-danger bg-fleet-danger/10 border-fleet-danger/20";
}

export function riskColor(risk: number): string {
  if (risk <= 30) return "text-fleet-success bg-fleet-success/10 border-fleet-success/20";
  if (risk <= 70) return "text-fleet-warning bg-fleet-warning/10 border-fleet-warning/20";
  return "text-fleet-danger bg-fleet-danger/10 border-fleet-danger/20";
}

export function statusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "text-fleet-secondary bg-fleet-muted/10 border-fleet-muted/20";
    case "assigned":
      return "text-fleet-accent bg-fleet-accent/10 border-fleet-accent/20";
    case "in_progress":
      return "text-fleet-info bg-fleet-info/10 border-fleet-info/20";
    case "completed":
      return "text-fleet-success bg-fleet-success/10 border-fleet-success/20";
    case "canceled":
      return "text-fleet-danger bg-fleet-danger/10 border-fleet-danger/20";
  }
}

export function statusLabel(status: OrderStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function getOrderTypeIcon(type: "pickup" | "delivery" | "round_trip"): string {
  switch (type) {
    case "pickup":
      return "package";
    case "delivery":
      return "truck";
    case "round_trip":
      return "repeat";
  }
}
