# Complete TMS Implementation Guide
## Phase 1: Electronic Proof of Delivery (ePOD) & Customer Portal

**Implementation Date:** December 25, 2025  
**Status:** Phase 1 Features Implemented  
**Next Steps:** Driver Mobile App, Invoicing, Exceptions Management

---

## 📦 FEATURE 1: ELECTRONIC PROOF OF DELIVERY (ePOD) SYSTEM

### ✅ Completed Components

#### 1. Database Schema (`migrations/006_create_epod_tables.sql`)

**Tables Created:**
- `documents` - Store all trip-related documents (BOL, POD, receipts, etc.)
  - Supports multiple document types with file metadata
  - Soft delete functionality
  - Verification tracking
  
- `signatures` - Digital signature captures
  - Multiple signature types (pickup, delivery, witness, inspector)
  - Geolocation and device tracking
  - Base64 signature data storage
  
- `delivery_photos` - Photo documentation
  - Multiple photo types (cargo, damage, seal, condition, location)
  - EXIF data preservation
  - Geolocation tagging
  
- `pod_verification` - Verification workflow
  - Checklist tracking (POD, BOL, signatures, photos)
  - Discrepancy management
  - Approval/rejection workflow
  
- `document_templates` - Reusable document templates
- `pod_offline_queue` - Mobile app offline support
- `pod_audit_log` - Complete audit trail

**Views Created:**
- `pod_completion_status` - Real-time POD status overview

#### 2. API Endpoints

**Document Management:**
- `GET /api/trips/[id]/documents` - List all documents for a trip
- `POST /api/trips/[id]/documents` - Upload new document
- `DELETE /api/trips/[id]/documents?documentId=[id]` - Delete document

**Signature Capture:**
- `GET /api/trips/[id]/signature` - Get all signatures
- `POST /api/trips/[id]/signature` - Capture new signature

**Photo Management:**
- `GET /api/trips/[id]/photos?type=[type]` - Get delivery photos
- `POST /api/trips/[id]/photos` - Upload photos

**POD Package:**
- `GET /api/trips/[id]/pod` - Get complete POD package
- `POST /api/trips/[id]/pod/verify` - Verify and approve/reject POD

**Features:**
- Automatic checklist updates
- Audit logging on all actions
- Geolocation and device tracking
- File validation
- Error handling with Zod schema validation

#### 3. React UI Components

**Created Components:**

1. **`SignatureCapture`** (`components/epod/signature-capture.tsx`)
   - Touch and mouse-based signature drawing
   - Canvas-based implementation
   - Clear and save functionality
   - Mobile-friendly

2. **`PhotoCapture`** (`components/epod/photo-capture.tsx`)
   - Camera access for mobile devices
   - File upload support
   - Multiple photo management
   - Preview and delete functionality

3. **`DocumentUploader`** (`components/epod/document-uploader.tsx`)
   - Drag-and-drop interface
   - Multi-file upload support
   - Progress tracking
   - File type validation (PDF, images, Word docs)
   - Upload queue management

4. **`PODPackageViewer`** (`components/epod/pod-package-viewer.tsx`)
   - Complete POD overview
   - Tabbed interface (overview, documents, signatures, photos)
   - Status indicators
   - Completeness checklist
   - PDF download capability (ready to implement)

### 🚀 How to Use ePOD System

#### For Drivers (Mobile/Web):

```typescript
// 1. Upload a document
POST /api/trips/[tripId]/documents
{
  "documentType": "POD",
  "fileUrl": "https://storage.../pod.pdf",
  "fileName": "POD_12345.pdf",
  "uploadedBy": "driver-uuid",
  "uploadedByType": "driver"
}

// 2. Capture signature
POST /api/trips/[tripId]/signature
{
  "signatureType": "delivery",
  "signerName": "John Receiver",
  "signerRole": "receiver",
  "signatureData": "data:image/png;base64,...",
  "geolocation": { "lat": 43.6532, "lng": -79.3832 }
}

// 3. Upload photos
POST /api/trips/[tripId]/photos
{
  "photoType": "cargo_unloaded",
  "photoUrl": "https://storage.../photo.jpg",
  "caption": "Cargo delivered in good condition",
  "uploadedBy": "driver-uuid"
}
```

#### For Dispatchers (Review POD):

```typescript
// 1. View complete POD package
GET /api/trips/[tripId]/pod

// 2. Verify and approve
POST /api/trips/[tripId]/pod/verify
{
  "verificationStatus": "approved",
  "verifiedBy": "dispatcher-uuid",
  "verifiedByName": "Jane Dispatcher",
  "notes": "All documents received and verified",
  "notifyCustomer": true
}
```

---

## 📦 FEATURE 2: CUSTOMER PORTAL

### ✅ Completed Components

#### 1. Database Schema (`migrations/007_create_customer_portal_tables.sql`)

**Tables Created:**
- `customer_users` - Portal user accounts
  - Role-based access (admin, viewer, billing, dispatcher)
  - Account security (failed attempts, account locking)
  - Email verification support
  
- `customer_notifications` - Notification system
  - Multiple channels (email, SMS, push, portal)
  - Priority levels
  - Delivery status tracking
  
- `tracking_shares` - Shareable tracking links
  - Public, password-protected, or single-use links
  - Expiration dates
  - View count tracking
  
- `customer_preferences` - User preferences
  - Notification settings (granular control)
  - Default values (pickup instructions, commodity)
  - Contact preferences
  - Theme and timezone settings
  
- `customer_api_keys` - API access
  - Programmatic integration support
  - Rate limiting
  - Permission management
  
- `customer_sessions` - Session management
  - JWT token storage
  - Refresh token support
  - Device tracking
  
- `customer_saved_filters` - Custom filters
- `customer_audit_log` - Complete audit trail

**Views Created:**
- `customer_dashboard_stats` - Real-time dashboard metrics

#### 2. API Endpoints

**Authentication:**
- `POST /api/portal/auth/login` - Customer login with JWT
  - Failed attempt tracking
  - Account locking after 5 failed attempts
  - Session creation
  - Audit logging

**Order Management:**
- `GET /api/portal/orders` - List customer orders
  - Filtering (status, date range)
  - Pagination support
  - Trip information included
  
- `POST /api/portal/orders` - Create new order (quote request)
  - Automatic notification creation

**Tracking:**
- `GET /api/portal/orders/[orderId]/tracking?token=[shareToken]` - Real-time tracking
  - Works with authentication or share token
  - Location history
  - Event timeline
  - ETA calculation

**Features:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Audit logging on all actions
- Session management
- Share token validation

#### 3. Helper Libraries

**`lib/customer-auth.ts`** - Authentication utilities
- Token verification
- Role checking
- Auth middleware
- Session validation

### 🚀 How to Use Customer Portal

#### Customer Registration:

```typescript
POST /api/portal/auth/login
{
  "action": "register",
  "customerId": "ACME-CORP",
  "email": "john@acmecorp.com",
  "password": "SecurePass123!",
  "name": "John Smith",
  "role": "admin"
}
```

#### Customer Login:

```typescript
POST /api/portal/auth/login
{
  "email": "john@acmecorp.com",
  "password": "SecurePass123!"
}

// Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "customerId": "ACME-CORP",
    "email": "john@acmecorp.com",
    "name": "John Smith",
    "role": "admin"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### View Orders:

```typescript
GET /api/portal/orders?status=In Transit&limit=20&offset=0
Headers: {
  "Authorization": "Bearer jwt-token"
}
```

#### Track Order:

```typescript
// With authentication
GET /api/portal/orders/[orderId]/tracking
Headers: {
  "Authorization": "Bearer jwt-token"
}

// Or with share token (public access)
GET /api/portal/orders/[orderId]/tracking?token=share-token-here
```

---

## 🗄️ DATABASE MIGRATION INSTRUCTIONS

### Step 1: Run Migrations

```bash
# Connect to PostgreSQL
psql -U postgres -d fleet

# Run ePOD migration
\i migrations/006_create_epod_tables.sql

# Run Customer Portal migration
\i migrations/007_create_customer_portal_tables.sql
```

### Step 2: Verify Tables Created

```sql
-- Check ePOD tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('documents', 'signatures', 'delivery_photos', 'pod_verification');

-- Check Customer Portal tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('customer_users', 'customer_notifications', 'tracking_shares');
```

### Step 3: Add Trigger to Trips Table

```sql
-- Connect POD verification to trips
CREATE TRIGGER trigger_create_pod_verification
    AFTER INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION create_pod_verification_record();
```

---

## 📦 NPM DEPENDENCIES TO INSTALL

```bash
# Add these to package.json
npm install bcrypt jsonwebtoken
npm install react-dropzone  # For DocumentUploader component

# TypeScript types
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

---

## 🔐 ENVIRONMENT VARIABLES

Add to `.env` or `.env.local`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (for documents and photos)
# Option 1: AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=fleet-documents
AWS_REGION=us-east-1

# Option 2: Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=fleet-documents

# Notification Services (for customer notifications)
SENDGRID_API_KEY=your-sendgrid-key  # For email
TWILIO_ACCOUNT_SID=your-twilio-sid  # For SMS
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🎨 USAGE EXAMPLES

### Example 1: Complete ePOD Flow

```typescript
// In a Trip Detail Page
import { PODPackageViewer } from "@/components/epod/pod-package-viewer";

export default function TripDetailPage({ tripId }: { tripId: string }) {
  return (
    <div>
      <h1>Trip Details</h1>
      <PODPackageViewer tripId={tripId} />
    </div>
  );
}
```

### Example 2: Driver Signature Capture

```typescript
import { SignatureCapture } from "@/components/epod/signature-capture";

export default function DeliveryPage({ tripId }: { tripId: string }) {
  const handleSignatureSave = async (signatureData: string) => {
    await fetch(`/api/trips/${tripId}/signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureType: 'delivery',
        signerName: 'John Receiver',
        signerRole: 'receiver',
        signatureData,
      }),
    });
  };

  return (
    <div>
      <h2>Receiver Signature</h2>
      <SignatureCapture onSave={handleSignatureSave} />
    </div>
  );
}
```

### Example 3: Customer Portal Login

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/portal/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.success) {
    // Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Redirect to dashboard
    router.push('/portal/dashboard');
  }
};
```

---

## 🔄 NEXT FEATURES TO IMPLEMENT

### Phase 1 Remaining:

3. **Driver Mobile App**
   - Native mobile app or PWA
   - GPS tracking
   - HOS logging
   - Trip management
   - Offline support

4. **Invoicing & Billing System**
   - Automated invoice generation
   - Payment tracking
   - Accessorial charges
   - QuickBooks integration

5. **Exception Management & Alerts**
   - Real-time alerts
   - SMS/Email/Push notifications
   - Escalation workflows
   - Weather integration

### Phase 2 (Advanced):

6. Advanced Analytics Dashboard
7. Predictive Forecasting (ML)
8. Integration Hub (EDI/API)
9. AI-Powered Optimization

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     TMS Application                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   ePOD       │  │   Customer   │  │    Driver    │     │
│  │   System     │  │    Portal    │  │  Mobile App  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Layer (Next.js)                     │   │
│  │  - Authentication & Authorization                    │   │
│  │  - Business Logic                                    │   │
│  │  - Validation & Error Handling                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database                        │   │
│  │  - Orders, Trips, Drivers, Units                     │   │
│  │  - ePOD (documents, signatures, photos)              │   │
│  │  - Customer Portal (users, sessions, tracking)       │   │
│  │  - Audit Logs                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ TESTING CHECKLIST

### ePOD System:
- [ ] Upload document to trip
- [ ] Capture signature (touch and mouse)
- [ ] Upload multiple photos
- [ ] View complete POD package
- [ ] Verify and approve POD
- [ ] Test audit logging
- [ ] Test offline queue (mobile)

### Customer Portal:
- [ ] User registration
- [ ] User login (success and failure)
- [ ] Account locking after 5 failed attempts
- [ ] View order list with filters
- [ ] Create new order
- [ ] Track order with authentication
- [ ] Track order with share token
- [ ] Test session expiration
- [ ] Test role-based access

---

## 📝 NOTES

- All passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours (configurable)
- Refresh tokens expire after 7 days
- Failed login attempts lock account for 15 minutes after 5 attempts
- All sensitive actions are logged in audit tables
- Soft delete is used for documents (deleted_at column)
- Geolocation is captured for signatures and photos when available

---

## 🐛 KNOWN LIMITATIONS & TODOs

1. **File Upload**: Currently using temporary URLs. Need to implement actual S3/R2 upload in `DocumentUploader` component
2. **PDF Generation**: POD package PDF generation not yet implemented
3. **Email/SMS**: Notification sending needs integration with SendGrid/Twilio
4. **WebSockets**: Real-time tracking updates need WebSocket implementation
5. **Mobile App**: Driver mobile app (React Native/PWA) needs to be built
6. **Rate Limiting**: API rate limiting needs to be implemented
7. **CORS**: Configure CORS for customer portal domain

---

## 📞 SUPPORT & MAINTENANCE

- **Database Backups**: Ensure regular backups of `documents`, `signatures`, and `delivery_photos` tables
- **Storage Cleanup**: Implement job to clean up orphaned files
- **Session Cleanup**: Implement job to remove expired sessions
- **Audit Log Archival**: Consider archiving old audit logs

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0  
**Status:** Phase 1 (Features 1-2) Complete ✅
