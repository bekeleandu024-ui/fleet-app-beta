"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerProfile } from "../../mockData";
import { Badge } from "@/components/ui/badge";

interface ProfileTabProps {
  customerId: string;
}

export function ProfileTab({ customerId }: ProfileTabProps) {
  const profile = getCustomerProfile(customerId);

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Legal Name</div>
              <div className="font-medium">{profile.companyInfo.legalName}</div>
            </div>
            {profile.companyInfo.dba && (
              <div>
                <div className="text-sm text-muted-foreground">DBA</div>
                <div className="font-medium">{profile.companyInfo.dba}</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Industry</div>
              <div className="font-medium">{profile.companyInfo.industry}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Customer Since</div>
              <div className="font-medium">{new Date(profile.companyInfo.since).toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.contacts.map((contact) => (
              <div key={contact.id} className="flex items-start justify-between pb-4 border-b last:border-b-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.name}</span>
                    {contact.isPrimary && (
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{contact.title}</div>
                  <div className="text-sm mt-1">{contact.email}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>{profile.billingAddress.street}</div>
              <div>
                {profile.billingAddress.city}, {profile.billingAddress.state} {profile.billingAddress.zip}
              </div>
              <div>{profile.billingAddress.country}</div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms & Credit */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Payment Terms</div>
              <div className="font-medium">{profile.paymentTerms}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Credit Limit</div>
              <div className="font-medium text-lg">${profile.creditLimit.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
