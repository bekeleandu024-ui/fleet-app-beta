import { demoServiceHealth, resolveDemoResponse } from "@/lib/demo-data";

const ORDERS_SERVICE = process.env.ORDERS_SERVICE ?? "http://localhost:4002";
const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE ?? "http://localhost:4001";
const DISPATCH_SERVICE = process.env.DISPATCH_SERVICE ?? "http://localhost:4003";
const TRACKING_SERVICE = process.env.TRACKING_SERVICE ?? "http://localhost:4004";

type ServiceName = "orders" | "masterData" | "dispatch" | "tracking";

const BASE_URLS: Record<ServiceName, string> = {
  orders: ORDERS_SERVICE,
  masterData: MASTER_DATA_SERVICE,
  dispatch: DISPATCH_SERVICE,
  tracking: TRACKING_SERVICE,
};

export class ServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ServiceError";
  }
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  silent?: boolean; // Don't log warnings if service unavailable
}

export async function serviceFetch<T>(service: ServiceName, path: string, options: FetchOptions = {}): Promise<T> {
  const baseUrl = BASE_URLS[service];
  const url = `${baseUrl}${path}`;
  const init: RequestInit = {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    // Add timeout to fail fast if service is down
    signal: AbortSignal.timeout(10000), // Increased to 10 seconds
  };

  if (options.body !== undefined) {
    init.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    init.headers = {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    };
  }

  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const message = await safeReadErrorMessage(response);
      throw new ServiceError(message, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Try to use demo data as fallback
    const fallback = resolveDemoResponse(service, path, options.method, options.body);
    if (fallback !== undefined) {
      if (!options.silent) {
        console.warn(`⚠️  [${service}] Using demo data: ${path} (Backend service unavailable)`);
      }
      return fallback as T;
    }
    // If no demo data available, throw the error (only log if not silent)
    if (!options.silent) {
      console.error(`❌ [${service}] No demo data available: ${path}`, error);
    }
    throw error;
  }
}

async function safeReadErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload?.error === "string") {
      return payload.error;
    }
    if (typeof payload?.message === "string") {
      return payload.message;
    }
    return `Request failed with status ${response.status}`;
  } catch (error) {
    return `Request failed with status ${response.status}`;
  }
}

export const serviceUrls = {
  ORDERS_SERVICE,
  MASTER_DATA_SERVICE,
  DISPATCH_SERVICE,
  TRACKING_SERVICE,
  SERVICE_HEALTH: demoServiceHealth,
};

