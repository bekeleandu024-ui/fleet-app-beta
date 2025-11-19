"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, RefreshCw, AlertTriangle, Upload, DollarSign, FileText, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Trip {
  id: string;
  tripNumber: string;
  driver: string;
  unit: string;
  status: string;
  pickup: string;
  delivery: string;
  orderId?: string;
}

interface CloseoutData {
  actualRevenue: number;
  finalCost: number;
  finalMargin: number;
  finalMarginPercent: number;
  podUploaded: boolean;
  invoiceGenerated: boolean;
  notes: string;
}

interface Document {
  id: string;
  type: "POD" | "BOL" | "INVOICE" | "OTHER";
  name: string;
  uploadedAt: string;
  url?: string;
}

export default function TripClosePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [closeoutData, setCloseoutData] = useState<CloseoutData>({
    actualRevenue: 3200.00,
    finalCost: 2685.00,
    finalMargin: 515.00,
    finalMarginPercent: 16.09,
    podUploaded: false,
    invoiceGenerated: false,
    notes: "",
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [actualRevenue, setActualRevenue] = useState(3200.00);
  const [accessorialCharges, setAccessorialCharges] = useState(0.00);
  const [deductions, setDeductions] = useState(0.00);
  const [notes, setNotes] = useState("");

  const fetchTripData = async () => {
    try {
      const tripResponse = await fetch(`/api/trips/${tripId}`);
      
      if (tripResponse.ok) {
        const tripData = await tripResponse.json();
        setTrip(tripData);
        
        // Mock documents
        setDocuments([
          {
            id: "doc1",
            type: "BOL",
            name: "Bill of Lading - Trip #" + tripData.tripNumber,
            uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinalRevenue = () => {
    return actualRevenue + accessorialCharges - deductions;
  };

  const calculateFinalMargin = () => {
    const finalRev = calculateFinalRevenue();
    const margin = finalRev - closeoutData.finalCost;
    const marginPercent = (margin / finalRev) * 100;
    return { margin, marginPercent };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: Document["type"]) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      type,
      name: file.name,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments(prev => [...prev, newDoc]);

    if (type === "POD") {
      setCloseoutData(prev => ({ ...prev, podUploaded: true }));
    }

    setMessage({ type: "success", text: `${type} uploaded successfully` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleGenerateInvoice = () => {
    // Mock invoice generation
    const invoice: Document = {
      id: `inv-${Date.now()}`,
      type: "INVOICE",
      name: `Invoice-${trip?.tripNumber || tripId}.pdf`,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments(prev => [...prev, invoice]);
    setCloseoutData(prev => ({ ...prev, invoiceGenerated: true }));
    setMessage({ type: "success", text: "Invoice generated successfully" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCloseTrip = async () => {
    if (!closeoutData.podUploaded) {
      setMessage({ type: "error", text: "Please upload Proof of Delivery before closing" });
      return;
    }

    if (!closeoutData.invoiceGenerated) {
      setMessage({ type: "error", text: "Please generate invoice before closing" });
      return;
    }

    setIsClosing(true);
    setMessage(null);

    try {
      const { margin, marginPercent } = calculateFinalMargin();
      const finalRevenue = calculateFinalRevenue();

      const response = await fetch(`/api/trips/${tripId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualRevenue: finalRevenue,
          accessorialCharges,
          deductions,
          finalCost: closeoutData.finalCost,
          finalMargin: margin,
          finalMarginPercent: marginPercent,
          documents: documents.map(d => ({ type: d.type, name: d.name })),
          notes,
          closedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to close trip");

      setMessage({ type: "success", text: "Trip closed successfully!" });
      
      setTimeout(() => {
        router.push("/trips");
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to close trip" 
      });
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  useEffect(() => {
    const { margin, marginPercent } = calculateFinalMargin();
    setCloseoutData(prev => ({
      ...prev,
      actualRevenue: calculateFinalRevenue(),
      finalMargin: margin,
      finalMarginPercent: marginPercent,
    }));
  }, [actualRevenue, accessorialCharges, deductions]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-sm text-gray-400">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-2 text-sm text-gray-400">Trip not found</p>
          <Button onClick={() => router.push("/trips")} className="mt-4">
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  const { margin, marginPercent } = calculateFinalMargin();
  const canClose = closeoutData.podUploaded && closeoutData.invoiceGenerated;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-linear-to-r from-gray-900 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/trips")}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Close Trip</h1>
                <p className="text-sm text-gray-400">Trip #{trip.tripNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Trip Info & Financial Summary */}
          <div className="col-span-5 space-y-6">
            {/* Trip Details */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Trip Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Driver</span>
                  <span className="text-sm text-white font-medium">{trip.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Unit</span>
                  <span className="text-sm text-white font-medium">{trip.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Route</span>
                  <span className="text-sm text-white font-medium text-right">
                    {trip.pickup} → {trip.delivery}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="text-sm text-amber-400 font-medium">{trip.status}</span>
                </div>
              </div>
            </Card>

            {/* Revenue Adjustments */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue Reconciliation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Base Revenue</label>
                  <input
                    type="number"
                    value={actualRevenue}
                    onChange={(e) => setActualRevenue(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Accessorial Charges</label>
                  <input
                    type="number"
                    value={accessorialCharges}
                    onChange={(e) => setAccessorialCharges(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., detention, extra stops"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Deductions</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., damage claims, short pay"
                  />
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Final Revenue</span>
                    <span className="text-lg text-white font-bold">
                      ${calculateFinalRevenue().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Final Cost</span>
                    <span className="text-sm text-white font-medium">
                      ${closeoutData.finalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Final Margin */}
            <Card className="p-6 bg-linear-to-r from-emerald-900/20 to-blue-900/20 backdrop-blur border-emerald-500/30">
              <h3 className="text-sm font-semibold text-emerald-300 mb-4">Final Trip Margin</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  ${margin.toFixed(2)}
                </div>
                <div className={`text-lg font-semibold ${
                  marginPercent >= 20 ? "text-emerald-400" :
                  marginPercent >= 15 ? "text-blue-400" :
                  marginPercent >= 10 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {marginPercent.toFixed(2)}% Margin
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {marginPercent >= 20 ? "Excellent profitability" :
                   marginPercent >= 15 ? "Good margin" :
                   marginPercent >= 10 ? "Below target" : "Loss or minimal profit"}
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Documents & Closeout */}
          <div className="col-span-7 space-y-6">
            {/* Document Upload */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Required Documents</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* POD Upload */}
                <div className={`p-4 rounded-lg border-2 border-dashed ${
                  closeoutData.podUploaded 
                    ? "border-emerald-500/30 bg-emerald-500/10" 
                    : "border-gray-700 bg-gray-800/30"
                }`}>
                  <div className="text-center">
                    <Upload className={`mx-auto h-8 w-8 mb-2 ${
                      closeoutData.podUploaded ? "text-emerald-400" : "text-gray-500"
                    }`} />
                    <p className="text-sm font-medium text-white mb-1">Proof of Delivery</p>
                    {closeoutData.podUploaded ? (
                      <CheckCircle className="mx-auto h-5 w-5 text-emerald-400 mt-2" />
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, "POD")}
                          className="hidden"
                        />
                        <span className="text-xs text-blue-400 hover:text-blue-300">Upload POD</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Invoice Generation */}
                <div className={`p-4 rounded-lg border-2 border-dashed ${
                  closeoutData.invoiceGenerated 
                    ? "border-emerald-500/30 bg-emerald-500/10" 
                    : "border-gray-700 bg-gray-800/30"
                }`}>
                  <div className="text-center">
                    <FileText className={`mx-auto h-8 w-8 mb-2 ${
                      closeoutData.invoiceGenerated ? "text-emerald-400" : "text-gray-500"
                    }`} />
                    <p className="text-sm font-medium text-white mb-1">Invoice</p>
                    {closeoutData.invoiceGenerated ? (
                      <CheckCircle className="mx-auto h-5 w-5 text-emerald-400 mt-2" />
                    ) : (
                      <Button
                        onClick={handleGenerateInvoice}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white mt-2"
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Documents */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">Additional Documents (Optional)</label>
                <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 bg-gray-800/30">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "OTHER")}
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-400">Upload BOL, receipts, or other documents</span>
                </label>
              </div>

              {/* Document List */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Uploaded Documents:</p>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-sm text-white">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                        {doc.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Closeout Notes */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Closeout Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 min-h-[120px] resize-none"
                placeholder="Add any final notes about this trip (delays, issues, customer feedback, etc.)"
              />
            </Card>

            {/* Close Trip Button */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <Button
                onClick={handleCloseTrip}
                disabled={!canClose || isClosing}
                className={`w-full font-semibold py-3 ${
                  canClose 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isClosing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Closing Trip...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Close & Lock Trip
                  </>
                )}
              </Button>

              {!canClose && (
                <div className="mt-3 text-xs text-amber-400 text-center">
                  {!closeoutData.podUploaded && "⚠️ POD required "}
                  {!closeoutData.invoiceGenerated && "⚠️ Invoice required"}
                </div>
              )}

              {message && (
                <div className={`mt-4 rounded-lg border p-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                  {message.text}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                Closing will lock the trip and prevent further modifications
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
