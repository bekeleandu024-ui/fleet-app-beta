"use client";

import { useState, useEffect } from "react";
import { FileText, Image, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PODPackage {
  trip: any;
  documents: any[];
  signatures: any[];
  photos: any[];
  verification: any;
  completeness: {
    hasDocuments: boolean;
    hasSignatures: boolean;
    hasPhotos: boolean;
    isPODComplete: boolean;
    isBOLComplete: boolean;
    hasDiscrepancies: boolean;
    verificationStatus: string;
  };
}

interface PODPackageViewerProps {
  tripId: string;
}

export function PODPackageViewer({ tripId }: PODPackageViewerProps) {
  const [podPackage, setPodPackage] = useState<PODPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'signatures' | 'photos'>('overview');

  useEffect(() => {
    loadPODPackage();
  }, [tripId]);

  const loadPODPackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trips/${tripId}/pod`);
      
      if (!response.ok) throw new Error('Failed to load POD package');
      
      const data = await response.json();
      setPodPackage(data.podPackage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'needs_review':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadPDF = async () => {
    // TODO: Implement PDF generation
    alert('PDF generation not yet implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!podPackage) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No POD data available</p>
      </div>
    );
  }

  const { completeness, documents, signatures, photos, verification } = podPackage;

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Proof of Delivery</h2>
              {getStatusIcon(completeness.verificationStatus)}
            </div>
            <p className="text-gray-600">Trip ID: {tripId}</p>
          </div>
          
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(completeness.verificationStatus)}`}>
              {completeness.verificationStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Completeness Checklist */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <ChecklistItem
            label="BOL"
            completed={completeness.isBOLComplete}
          />
          <ChecklistItem
            label="POD"
            completed={completeness.isPODComplete}
          />
          <ChecklistItem
            label="Signature"
            completed={completeness.hasSignatures}
          />
          <ChecklistItem
            label="Photos"
            completed={completeness.hasPhotos}
          />
        </div>

        {completeness.hasDiscrepancies && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ This delivery has discrepancies that need review
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            {(['overview', 'documents', 'signatures', 'photos'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'documents' && ` (${documents.length})`}
                {tab === 'signatures' && ` (${signatures.length})`}
                {tab === 'photos' && ` (${photos.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              verification={verification}
              documents={documents}
              signatures={signatures}
              photos={photos}
            />
          )}
          
          {activeTab === 'documents' && (
            <DocumentsTab documents={documents} />
          )}
          
          {activeTab === 'signatures' && (
            <SignaturesTab signatures={signatures} />
          )}
          
          {activeTab === 'photos' && (
            <PhotosTab photos={photos} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={downloadPDF} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={loadPODPackage} variant="outline">
          Refresh
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
      )}
      <span className={completed ? 'text-gray-900' : 'text-gray-400'}>
        {label}
      </span>
    </div>
  );
}

function OverviewTab({ verification, documents, signatures, photos }: any) {
  return (
    <div className="space-y-6">
      {verification?.notes && (
        <div>
          <h3 className="font-medium mb-2">Notes</h3>
          <p className="text-gray-700">{verification.notes}</p>
        </div>
      )}
      
      {verification?.discrepancies && verification.discrepancies.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 text-red-700">Discrepancies</h3>
          <ul className="space-y-2">
            {verification.discrepancies.map((disc: any, idx: number) => (
              <li key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-medium">{disc.type}</div>
                <div className="text-sm text-gray-700">{disc.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Severity: {disc.severity}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-sm text-gray-600">Documents</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold">{signatures.length}</div>
          <div className="text-sm text-gray-600">Signatures</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold">{photos.length}</div>
          <div className="text-sm text-gray-600">Photos</div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ documents }: { documents: any[] }) {
  if (documents.length === 0) {
    return <p className="text-gray-500">No documents uploaded</p>;
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium">{doc.file_name}</div>
              <div className="text-sm text-gray-500">
                {doc.document_type} • {new Date(doc.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, '_blank')}>
            View
          </Button>
        </div>
      ))}
    </div>
  );
}

function SignaturesTab({ signatures }: { signatures: any[] }) {
  if (signatures.length === 0) {
    return <p className="text-gray-500">No signatures captured</p>;
  }

  return (
    <div className="space-y-4">
      {signatures.map((sig) => (
        <div key={sig.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-medium">{sig.signer_name}</div>
              <div className="text-sm text-gray-500">
                {sig.signer_role} • {new Date(sig.timestamp).toLocaleString()}
              </div>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {sig.signature_type}
            </span>
          </div>
          <img
            src={sig.signature_data}
            alt={`Signature by ${sig.signer_name}`}
            className="max-w-md border rounded"
          />
        </div>
      ))}
    </div>
  );
}

function PhotosTab({ photos }: { photos: any[] }) {
  if (photos.length === 0) {
    return <p className="text-gray-500">No photos uploaded</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="border rounded-lg overflow-hidden">
          <img
            src={photo.photo_url}
            alt={photo.caption || 'Delivery photo'}
            className="w-full h-48 object-cover"
          />
          <div className="p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">
              {photo.photo_type.replace('_', ' ').toUpperCase()}
            </div>
            {photo.caption && (
              <div className="text-sm text-gray-700">{photo.caption}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(photo.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
