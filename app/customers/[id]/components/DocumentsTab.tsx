"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCustomerDocuments } from "../../mockData";
import { FileText, Download } from "lucide-react";

interface DocumentsTabProps {
  customerId: string;
}

const docTypeLabels: Record<string, string> = {
  contract: 'Contract',
  'rate-confirmation': 'Rate Confirmation',
  insurance: 'Insurance',
  invoice: 'Invoice',
};

const docTypeColors: Record<string, string> = {
  contract: 'bg-purple-500',
  'rate-confirmation': 'bg-blue-500',
  insurance: 'bg-emerald-500',
  invoice: 'bg-amber-500',
};

export function DocumentsTab({ customerId }: DocumentsTabProps) {
  const documents = getCustomerDocuments(customerId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Uploaded {new Date(doc.uploadDate).toLocaleDateString()} · {doc.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={docTypeColors[doc.type]}>
                    {docTypeLabels[doc.type]}
                  </Badge>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
