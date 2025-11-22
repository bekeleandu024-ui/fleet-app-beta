import { randomUUID } from "crypto";

import type {
  CustomsActivity,
  CustomsClearanceDetail,
  CustomsClearanceListItem,
  CustomsDocument,
  CustomsDocumentType,
  CustomsResponse,
} from "@/lib/types";
import {
  customsClearanceDetailSchema,
  customsDocumentTypeSchema,
} from "@/lib/types";

const now = new Date();

const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

const hoursFromNow = (hours: number) =>
  new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

const customsSeedData: CustomsClearanceDetail[] = [
  customsClearanceDetailSchema.parse({
    id: "clr-001",
    tripId: "trip-001",
    orderId: "order-501",
    tripNumber: "TRIP-90455",
    driverName: "Miguel Alvarez",
    unitNumber: "TRK-204",
    status: "PENDING_DOCS",
    priority: "URGENT",
    borderCrossingPoint: "Laredo, TX",
    crossingDirection: "US_TO_MX",
    estimatedCrossingTime: hoursFromNow(5),
    requiredDocuments: [
      "COMMERCIAL_INVOICE",
      "BILL_OF_LADING",
      "ACE_MANIFEST",
      "PACKING_LIST",
    ],
    submittedDocuments: [
      buildDocument({
        documentType: "COMMERCIAL_INVOICE",
        documentName: "Invoice 90455.pdf",
        status: "VERIFIED",
        uploadedBy: "Miguel Alvarez",
        verifiedBy: "Agent Patel",
      }),
      buildDocument({
        documentType: "BILL_OF_LADING",
        documentName: "BOL-90455.pdf",
        status: "UPLOADED",
        uploadedBy: "Dispatcher Ops",
      }),
      buildDocument({
        documentType: "ACE_MANIFEST",
        documentName: "ACE-90455.pdf",
        status: "UPLOADED",
        uploadedBy: "Dispatcher Ops",
      }),
      buildDocument({
        documentType: "PACKING_LIST",
        documentName: "Packing-90455.pdf",
        status: "UPLOADED",
        uploadedBy: "Dispatcher Ops",
      }),
    ],
    assignedAgent: undefined,
    agentName: undefined,
    reviewStartedAt: undefined,
    reviewCompletedAt: undefined,
    reviewNotes: undefined,
    rejectionReason: undefined,
    activityLog: [
      buildActivity({
        action: "TRIP_FLAGGED",
        actor: "System",
        actorType: "SYSTEM",
        notes: "Cold chain shipment flagged for customs",
        createdAt: hoursAgo(6),
      }),
    ],
    flaggedAt: hoursAgo(6),
    docsSubmittedAt: undefined,
    approvedAt: undefined,
    clearedAt: undefined,
  }),
  customsClearanceDetailSchema.parse({
    id: "clr-002",
    tripId: "trip-002",
    orderId: "order-818",
    tripNumber: "TRIP-90412",
    driverName: "Stephanie Redding",
    unitNumber: "TRK-104",
    status: "UNDER_REVIEW",
    priority: "HIGH",
    borderCrossingPoint: "Blaine, WA",
    crossingDirection: "US_TO_CA",
    estimatedCrossingTime: hoursFromNow(2),
    requiredDocuments: [
      "COMMERCIAL_INVOICE",
      "BILL_OF_LADING",
      "PAPS",
      "CUSTOMS_DECLARATION",
    ],
    submittedDocuments: [
      buildDocument({
        documentType: "COMMERCIAL_INVOICE",
        documentName: "Invoice 90412.pdf",
        status: "VERIFIED",
        uploadedBy: "Operations",
        verifiedBy: "Agent Chen",
        verifiedAt: hoursAgo(2),
      }),
      buildDocument({
        documentType: "BILL_OF_LADING",
        documentName: "BOL-90412.pdf",
        status: "VERIFIED",
        uploadedBy: "Operations",
        verifiedBy: "Agent Chen",
        verifiedAt: hoursAgo(2),
      }),
      buildDocument({
        documentType: "PAPS",
        documentName: "PAPS-90412.pdf",
        status: "VERIFIED",
        uploadedBy: "Operations",
        verifiedBy: "Agent Chen",
        verifiedAt: hoursAgo(2),
      }),
      buildDocument({
        documentType: "CUSTOMS_DECLARATION",
        documentName: "Declaration-90412.pdf",
        status: "VERIFIED",
        uploadedBy: "Driver",
        verifiedBy: "Agent Chen",
        verifiedAt: hoursAgo(1),
      }),
    ],
    assignedAgent: "agt-001",
    agentName: "Agent Chen",
    reviewStartedAt: hoursAgo(2),
    reviewCompletedAt: undefined,
    reviewNotes: undefined,
    rejectionReason: undefined,
    activityLog: [
      buildActivity({
        action: "ASSIGNED_AGENT",
        actor: "System",
        actorType: "SYSTEM",
        details: { agentName: "Agent Chen" },
        createdAt: hoursAgo(2),
      }),
      buildActivity({
        action: "DOCS_SUBMITTED",
        actor: "Driver",
        actorType: "DRIVER",
        createdAt: hoursAgo(3),
      }),
    ],
    flaggedAt: hoursAgo(4),
    docsSubmittedAt: hoursAgo(3),
    approvedAt: undefined,
    clearedAt: undefined,
  }),
  customsClearanceDetailSchema.parse({
    id: "clr-003",
    tripId: "trip-003",
    orderId: "order-219",
    tripNumber: "TRIP-90388",
    driverName: "Nathan Torres",
    unitNumber: "TRK-332",
    status: "APPROVED",
    priority: "NORMAL",
    borderCrossingPoint: "Detroit, MI",
    crossingDirection: "CA_TO_US",
    estimatedCrossingTime: hoursAgo(1),
    actualCrossingTime: undefined,
    requiredDocuments: [
      "COMMERCIAL_INVOICE",
      "ACE_MANIFEST",
      "CERTIFICATE_OF_ORIGIN",
    ],
    submittedDocuments: [
      buildDocument({
        documentType: "COMMERCIAL_INVOICE",
        documentName: "Invoice 90388.pdf",
        status: "VERIFIED",
        uploadedBy: "Dispatch",
        verifiedBy: "Agent Rossi",
        verifiedAt: hoursAgo(4),
      }),
      buildDocument({
        documentType: "ACE_MANIFEST",
        documentName: "ACE-90388.pdf",
        status: "VERIFIED",
        uploadedBy: "Dispatch",
        verifiedBy: "Agent Rossi",
        verifiedAt: hoursAgo(4),
      }),
      buildDocument({
        documentType: "CERTIFICATE_OF_ORIGIN",
        documentName: "CO-90388.pdf",
        status: "VERIFIED",
        uploadedBy: "Dispatch",
        verifiedBy: "Agent Rossi",
        verifiedAt: hoursAgo(3),
      }),
    ],
    assignedAgent: "agt-002",
    agentName: "Agent Rossi",
    reviewStartedAt: hoursAgo(4),
    reviewCompletedAt: hoursAgo(2),
    reviewNotes: "Confirmed documentation and refrigeration compliance.",
    rejectionReason: undefined,
    activityLog: [
      buildActivity({
        action: "CLEARED_FOR_ENTRY",
        actor: "Agent Rossi",
        actorType: "AGENT",
        createdAt: hoursAgo(1),
      }),
      buildActivity({
        action: "APPROVED",
        actor: "Agent Rossi",
        actorType: "AGENT",
        createdAt: hoursAgo(2),
      }),
    ],
    flaggedAt: hoursAgo(6),
    docsSubmittedAt: hoursAgo(5),
    approvedAt: hoursAgo(2),
    clearedAt: undefined,
  }),
];

const customsStore = new Map(customsSeedData.map((record) => [record.id, record]));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function buildDocument({
  documentType,
  documentName,
  status,
  uploadedBy,
  verifiedBy,
  verifiedAt,
}: {
  documentType: CustomsDocumentType;
  documentName: string;
  status: CustomsDocument["status"];
  uploadedBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
}): CustomsDocument {
  return {
    id: randomUUID(),
    documentType,
    documentName,
    fileType: "application/pdf",
    fileSizeKb: 420,
    status,
    uploadedBy,
    uploadedAt: hoursAgo(8),
    verifiedBy,
    verifiedAt,
  };
}

function buildActivity({
  action,
  actor,
  actorType,
  createdAt = new Date().toISOString(),
  details,
  notes,
}: Omit<CustomsActivity, "id">): CustomsActivity {
  return {
    id: randomUUID(),
    action,
    actor,
    actorType,
    createdAt,
    details,
    notes,
  };
}

function toListItem(record: CustomsClearanceDetail): CustomsClearanceListItem {
  return {
    id: record.id,
    tripNumber: record.tripNumber,
    driverName: record.driverName,
    unitNumber: record.unitNumber,
    status: record.status,
    priority: record.priority,
    borderCrossingPoint: record.borderCrossingPoint,
    crossingDirection: record.crossingDirection,
    estimatedCrossingTime: record.estimatedCrossingTime,
    assignedAgent: record.agentName,
    flaggedAt: record.flaggedAt,
    docsSubmittedAt: record.docsSubmittedAt,
    requiredDocsCount: record.requiredDocuments.length,
    submittedDocsCount: record.submittedDocuments.length,
  };
}

function requireClearance(id: string): CustomsClearanceDetail {
  const record = customsStore.get(id);
  if (!record) {
    throw new Error(`Customs clearance ${id} not found`);
  }
  return record;
}

function persist(record: CustomsClearanceDetail): CustomsClearanceDetail {
  customsStore.set(record.id, record);
  return clone(record);
}

function addActivity(
  record: CustomsClearanceDetail,
  activity: Omit<CustomsActivity, "id" | "createdAt"> & { createdAt?: string }
) {
  record.activityLog.unshift(
    buildActivity({
      ...activity,
      createdAt: activity.createdAt ?? new Date().toISOString(),
    })
  );
}

export function listCustomsClearances(): CustomsResponse {
  const list = Array.from(customsStore.values()).map(toListItem);

  const stats = {
    pendingDocs: list.filter((item) => item.status === "PENDING_DOCS").length,
    underReview: list.filter((item) => item.status === "UNDER_REVIEW").length,
    approved: list.filter((item) => item.status === "APPROVED").length,
    urgent: list.filter((item) => item.priority === "URGENT").length,
  };

  const filters = {
    statuses: Array.from(new Set(list.map((item) => item.status))).sort(),
    priorities: Array.from(new Set(list.map((item) => item.priority))).sort(),
    crossingPoints: Array.from(new Set(list.map((item) => item.borderCrossingPoint))).sort(),
    agents: Array.from(new Set(list.map((item) => item.assignedAgent).filter((agent): agent is string => Boolean(agent)))).sort(),
  };

  return { stats, filters, data: list };
}

export function getCustomsClearance(id: string): CustomsClearanceDetail | null {
  const record = customsStore.get(id);
  return record ? clone(record) : null;
}

export function submitCustomsDocuments(id: string): CustomsClearanceDetail {
  const record = requireClearance(id);
  record.status = "DOCS_SUBMITTED";
  record.docsSubmittedAt = new Date().toISOString();
  addActivity(record, {
    action: "DOCS_SUBMITTED",
    actor: record.driverName,
    actorType: "DRIVER",
    notes: "Documents submitted via portal",
  });
  return persist(record);
}

export function approveCustomsClearance(
  id: string,
  payload: { agentName: string; notes: string }
): CustomsClearanceDetail {
  const record = requireClearance(id);
  record.status = "APPROVED";
  record.agentName = payload.agentName;
  record.reviewStartedAt = record.reviewStartedAt ?? record.docsSubmittedAt ?? new Date().toISOString();
  record.reviewCompletedAt = new Date().toISOString();
  record.reviewNotes = payload.notes;
  record.approvedAt = record.reviewCompletedAt;
  addActivity(record, {
    action: "APPROVED",
    actor: payload.agentName,
    actorType: "AGENT",
    notes: payload.notes,
  });
  return persist(record);
}

export function rejectCustomsClearance(
  id: string,
  payload: { agentName: string; reason: string }
): CustomsClearanceDetail {
  const record = requireClearance(id);
  record.status = "REJECTED";
  record.agentName = payload.agentName;
  record.reviewCompletedAt = new Date().toISOString();
  record.rejectionReason = payload.reason;
  record.reviewNotes = payload.reason;
  addActivity(record, {
    action: "REJECTED",
    actor: payload.agentName,
    actorType: "AGENT",
    notes: payload.reason,
  });
  return persist(record);
}

export function clearCustomsHold(id: string): CustomsClearanceDetail {
  const record = requireClearance(id);
  record.status = "CLEARED";
  record.clearedAt = new Date().toISOString();
  record.actualCrossingTime = record.clearedAt;
  addActivity(record, {
    action: "CLEARED",
    actor: record.agentName ?? "System",
    actorType: record.agentName ? "AGENT" : "SYSTEM",
    notes: "Released for border crossing",
  });
  return persist(record);
}

export function uploadCustomsDocument(
  id: string,
  payload: { documentType: CustomsDocumentType; documentName: string }
): CustomsClearanceDetail {
  const record = requireClearance(id);
  const documentType = customsDocumentTypeSchema.parse(payload.documentType);
  record.submittedDocuments.push(
    buildDocument({
      documentType,
      documentName: payload.documentName,
      status: "UPLOADED",
      uploadedBy: record.driverName,
    })
  );
  addActivity(record, {
    action: "DOCUMENT_UPLOADED",
    actor: record.driverName,
    actorType: "DRIVER",
    notes: payload.documentName,
  });
  return persist(record);
}

export function assignCustomsAgent(
  id: string,
  payload: { agentName: string }
): CustomsClearanceDetail {
  const record = requireClearance(id);
  record.agentName = payload.agentName;
  addActivity(record, {
    action: "ASSIGNED_AGENT",
    actor: "System",
    actorType: "SYSTEM",
    details: { agentName: payload.agentName },
  });
  return persist(record);
}

