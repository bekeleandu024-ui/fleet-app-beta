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
  if (marginPct >= 0.15) return "text-[#24D67B] bg-[#24D67B]/10 border-[#24D67B]/20";
  if (marginPct >= 0.05) return "text-[#FFC857] bg-[#FFC857]/10 border-[#FFC857]/20";
  return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20";
}

export function riskColor(risk: number): string {
  if (risk <= 30) return "text-[#24D67B] bg-[#24D67B]/10 border-[#24D67B]/20";
  if (risk <= 70) return "text-[#FFC857] bg-[#FFC857]/10 border-[#FFC857]/20";
  return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20";
}

export function statusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "text-[#9AA4B2] bg-[#9AA4B2]/10 border-[#9AA4B2]/20";
    case "assigned":
      return "text-[#60A5FA] bg-[#60A5FA]/10 border-[#60A5FA]/20";
    case "in_progress":
      return "text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20";
    case "completed":
      return "text-[#24D67B] bg-[#24D67B]/10 border-[#24D67B]/20";
    case "canceled":
      return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20";
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
