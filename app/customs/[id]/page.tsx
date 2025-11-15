"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileText, Upload, XCircle } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { CustomsClearanceDetail } from "@/lib/types";

async function fetchCustomsDetail(id: string): Promise<CustomsClearanceDetail> {
  const response = await fetch(`/api/customs/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch customs detail");
  }
  return response.json();
}

async function submitDocuments(id: string) {
  const response = await fetch(`/api/customs/${id}/submit`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to submit documents");
  }
  return response.json();
}

async function approveCustoms(id: string, payload: { agentName: string; notes: string }) {
  const response = await fetch(`/api/customs/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to approve customs");
  }
  return response.json();
}

async function rejectCustoms(id: string, payload: { agentName: string; reason: string }) {
  const response = await fetch(`/api/customs/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to reject customs");
  }
  return response.json();
}

async function clearForBorder(id: string) {
  const response = await fetch(`/api/customs/${id}/clear`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to clear truck");
  }
  return response.json();
}

const formatMaybeDate = (value?: string | null) => (value ? formatDateTime(value) : "—");

export default function CustomsDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customsDetail(params.id),
    queryFn: () => fetchCustomsDetail(params.id),
    refetchInterval: 15_000,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customs() });
    queryClient.invalidateQueries({ queryKey: queryKeys.customsDetail(params.id) });
  };

  const submitMutation = useMutation({
    mutationFn: () => submitDocuments(params.id),
    onSuccess: invalidateQueries,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveCustoms(params.id, { agentName: "Agent Smith", notes: approvalNotes }),
    onSuccess: () => {
      setApprovalNotes("");
      invalidateQueries();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectCustoms(params.id, { agentName: "Agent Smith", reason: rejectionReason }),
    onSuccess: () => {
      setRejectionReason("");
      invalidateQueries();
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearForBorder(params.id),
    onSuccess: () => {
      invalidateQueries();
      router.push("/trips");
    },
  });

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-neutral-400">Loading customs clearance...</div>;
  }

  const statusColors = {
    PENDING_DOCS: "warn",
    DOCS_SUBMITTED: "default",
    UNDER_REVIEW: "default",
    APPROVED: "ok",
    REJECTED: "alert",
    CLEARED: "ok",
  } as const;

  return (
    <SectionBanner
      title={`Customs Clearance: ${data.tripNumber}`}
      subtitle={`${data.driverName} • ${data.unitNumber}`}
      actions={
        <div className="flex gap-2">
          <Chip tone={statusColors[data.status] ?? "default"} className="text-sm">
            {data.status.replace(/_/g, " ")}
          </Chip>
          <Button size="sm" variant="plain" onClick={() => router.push("/customs")}>
            Back to Customs
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-neutral-200">Border Crossing Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem label="Crossing Point" value={data.borderCrossingPoint} />
                <InfoItem label="Direction" value={data.crossingDirection.replace("_TO_", " → ").replace(/_/g, " ")} />
                <InfoItem label="Est. Crossing Time" value={formatMaybeDate(data.estimatedCrossingTime)} />
                <InfoItem
                  label="Priority"
                  value={
                    <Chip tone={data.priority === "URGENT" ? "alert" : "default"} className="text-xs">
                      {data.priority}
                    </Chip>
                  }
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-200">Documents</h3>
                <Button size="sm" variant="primary" disabled={data.status !== "PENDING_DOCS"}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </div>

              <div className="space-y-3">
                {data.requiredDocuments.map((docType) => {
                  const submitted = data.submittedDocuments.find((doc) => doc.documentType === docType);
                  return (
                    <div key={docType} className="flex items-center justify-between rounded-lg bg-neutral-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="text-sm font-medium text-neutral-200">{docType.replace(/_/g, " ")}</p>
                          {submitted ? (
                            <p className="text-xs text-neutral-500">
                              {submitted.documentName} • {formatMaybeDate(submitted.uploadedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {submitted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                  );
                })}
              </div>

              {data.status === "PENDING_DOCS" && (
                <Button
                  className="mt-4 w-full"
                  variant="primary"
                  onClick={() => submitMutation.mutate()}
                  disabled={data.submittedDocuments.length < data.requiredDocuments.length}
                >
                  Submit for Review
                </Button>
              )}
            </div>
          </Card>

          {(data.status === "UNDER_REVIEW" || data.status === "DOCS_SUBMITTED") && (
            <Card>
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-neutral-200">Border Agent Review</h3>
                <p className="mb-4 text-sm text-neutral-400">
                  Assigned to: <span className="text-neutral-200">{data.agentName ?? "Pending assignment"}</span>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-300">Approval Notes</label>
                    <textarea
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-neutral-200"
                      rows={3}
                      value={approvalNotes}
                      onChange={(event) => setApprovalNotes(event.target.value)}
                      placeholder="Enter approval notes..."
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => approveMutation.mutate()}
                    disabled={!approvalNotes.trim()}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Clearance
                  </Button>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-300">Rejection Reason</label>
                    <textarea
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-neutral-200"
                      rows={2}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>

                  <Button
                    variant="plain"
                    className="w-full text-rose-300 hover:text-rose-200"
                    onClick={() => rejectMutation.mutate()}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject Clearance
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {data.status === "APPROVED" && (
            <Card>
              <div className="p-6 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
                <h3 className="mb-2 text-lg font-semibold text-neutral-200">Clearance Approved</h3>
                <p className="mb-6 text-sm text-neutral-400">
                  All documents verified. Ready to clear truck for border crossing.
                </p>
                <Button variant="primary" size="lg" onClick={() => clearMutation.mutate()}>
                  Clear Truck for Border Cross
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-neutral-200">Activity Timeline</h3>
              <div className="space-y-4">
                {data.activityLog.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{activity.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-neutral-500">
                        {activity.actor} • {formatMaybeDate(activity.createdAt)}
                      </p>
                      {activity.notes ? (
                        <p className="mt-1 text-xs text-neutral-400">{activity.notes}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SectionBanner>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-200">{typeof value === "string" ? value : value}</p>
    </div>
  );
}
