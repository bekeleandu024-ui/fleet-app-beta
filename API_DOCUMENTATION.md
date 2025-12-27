# TMS API Documentation
## Complete API Reference for ePOD System & Customer Portal

**Version:** 1.0.0  
**Last Updated:** December 25, 2025  
**Base URL:** `http://localhost:3000/api`

---

## 📖 TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [ePOD System APIs](#epod-system-apis)
3. [Customer Portal APIs](#customer-portal-apis)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)

---

## 🔐 AUTHENTICATION

### Customer Portal Authentication

All Customer Portal endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Public Endpoints

Some endpoints support public access via share tokens:
- Order Tracking (with valid share token)

---

## 📦 EPOD SYSTEM APIS

### 1. Upload Document

Upload a document (BOL, POD, receipt, etc.) to a trip.

**Endpoint:** `POST /api/trips/:id/documents`

**Authentication:** Required

**Request Body:**
```json
{
  "documentType": "POD",
  "fileUrl": "https://storage.example.com/documents/pod_12345.pdf",
  "fileName": "POD_12345.pdf",
  "fileSize": 102400,
  "mimeType": "application/pdf",
  "uploadedBy": "uuid",
  "uploadedByType": "driver",
  "metadata": {
    "notes": "Delivered in good condition"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentType | enum | Yes | `BOL`, `POD`, `lumper_receipt`, `weight_ticket`, `inspection`, `customs`, `other` |
| fileUrl | string | Yes | URL to the uploaded file |
| fileName | string | Yes | Original file name |
| fileSize | number | No | File size in bytes |
| mimeType | string | No | MIME type of the file |
| uploadedBy | uuid | Yes | User/Driver ID |
| uploadedByType | enum | Yes | `driver`, `dispatcher`, `customer`, `system` |
| metadata | object | No | Additional metadata |

**Response:** `200 OK`
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "trip_id": "uuid",
    "document_type": "POD",
    "file_url": "https://...",
    "file_name": "POD_12345.pdf",
    "uploaded_by": "uuid",
    "uploaded_by_type": "driver",
    "created_at": "2025-12-25T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `404` - Trip not found
- `500` - Server error

---

### 2. Get Trip Documents

Retrieve all documents for a trip.

**Endpoint:** `GET /api/trips/:id/documents`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "document_type": "POD",
      "file_name": "POD_12345.pdf",
      "signature_count": 2,
      "created_at": "2025-12-25T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Delete Document

Soft delete a document.

**Endpoint:** `DELETE /api/trips/:id/documents?documentId=<uuid>`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| documentId | uuid | Yes | Document ID to delete |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Document deleted"
}
```

---

### 4. Capture Signature

Capture a digital signature for a trip.

**Endpoint:** `POST /api/trips/:id/signature`

**Authentication:** Required (or public with trip token)

**Request Body:**
```json
{
  "documentId": "uuid",
  "signatureType": "delivery",
  "signerName": "John Receiver",
  "signerRole": "receiver",
  "signerTitle": "Warehouse Manager",
  "signerCompany": "ACME Logistics",
  "signatureData": "data:image/png;base64,iVBORw0KGgo...",
  "signatureFormat": "png",
  "geolocation": {
    "lat": 43.6532,
    "lng": -79.3832,
    "accuracy": 10
  },
  "deviceInfo": {
    "deviceType": "mobile",
    "os": "iOS 17",
    "browser": "Safari"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documentId | uuid | No | Associated document ID |
| signatureType | enum | Yes | `pickup`, `delivery`, `witness`, `inspector` |
| signerName | string | Yes | Name of person signing |
| signerRole | enum | Yes | `driver`, `receiver`, `shipper`, `warehouse`, `inspector`, `customs` |
| signerTitle | string | No | Job title |
| signerCompany | string | No | Company name |
| signatureData | string | Yes | Base64 encoded signature image |
| signatureFormat | string | No | Image format (default: `png`) |
| geolocation | object | No | GPS coordinates |
| deviceInfo | object | No | Device metadata |

**Response:** `200 OK`
```json
{
  "success": true,
  "signature": {
    "id": "uuid",
    "trip_id": "uuid",
    "signature_type": "delivery",
    "signer_name": "John Receiver",
    "signer_role": "receiver",
    "timestamp": "2025-12-25T10:30:00Z"
  }
}
```

---

### 5. Get Signatures

Get all signatures for a trip.

**Endpoint:** `GET /api/trips/:id/signature`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "signatures": [
    {
      "id": "uuid",
      "signature_type": "delivery",
      "signer_name": "John Receiver",
      "signer_role": "receiver",
      "timestamp": "2025-12-25T10:30:00Z",
      "document_type": "POD"
    }
  ],
  "count": 1
}
```

---

### 6. Upload Photos

Upload delivery photos.

**Endpoint:** `POST /api/trips/:id/photos`

**Authentication:** Required

**Request Body:**
```json
{
  "documentId": "uuid",
  "photoUrl": "https://storage.example.com/photos/delivery_001.jpg",
  "photoType": "cargo_unloaded",
  "caption": "Cargo delivered in excellent condition",
  "sequence": 1,
  "geolocation": {
    "lat": 43.6532,
    "lng": -79.3832,
    "accuracy": 5,
    "address": "123 Main St, Toronto, ON"
  },
  "exifData": {
    "camera": "iPhone 14 Pro",
    "timestamp": "2025-12-25T10:30:00Z"
  },
  "uploadedBy": "uuid"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photoUrl | string | Yes | URL to uploaded photo |
| photoType | enum | Yes | `cargo_loaded`, `cargo_unloaded`, `damage`, `seal`, `condition`, `location`, `odometer`, `other` |
| caption | string | No | Photo description |
| sequence | number | No | Display order (default: 0) |
| geolocation | object | No | GPS location |
| exifData | object | No | Camera metadata |
| uploadedBy | uuid | Yes | User/Driver ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "photo": {
    "id": "uuid",
    "trip_id": "uuid",
    "photo_type": "cargo_unloaded",
    "caption": "Cargo delivered...",
    "timestamp": "2025-12-25T10:30:00Z"
  }
}
```

---

### 7. Get Photos

Get all photos for a trip.

**Endpoint:** `GET /api/trips/:id/photos?type=<photoType>`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by photo type |

**Response:** `200 OK`
```json
{
  "success": true,
  "photos": [
    {
      "id": "uuid",
      "photo_type": "cargo_unloaded",
      "photo_url": "https://...",
      "caption": "Delivered",
      "timestamp": "2025-12-25T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 8. Get POD Package

Get complete POD package (all documents, signatures, photos, verification status).

**Endpoint:** `GET /api/trips/:id/pod`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "podPackage": {
    "trip": {
      "id": "uuid",
      "status": "delivered",
      "pickup_location": "Toronto, ON",
      "dropoff_location": "Montreal, QC"
    },
    "documents": [...],
    "signatures": [...],
    "photos": [...],
    "verification": {
      "verification_status": "approved",
      "has_pod": true,
      "has_bol": true,
      "has_signature": true,
      "has_photos": true,
      "verified_by_name": "Jane Dispatcher",
      "verified_at": "2025-12-25T12:00:00Z"
    },
    "completeness": {
      "hasDocuments": true,
      "hasSignatures": true,
      "hasPhotos": true,
      "isPODComplete": true,
      "isBOLComplete": true,
      "hasDiscrepancies": false,
      "verificationStatus": "approved"
    }
  }
}
```

---

### 9. Verify POD

Verify and approve/reject POD package.

**Endpoint:** `POST /api/trips/:id/pod/verify`

**Authentication:** Required (Dispatcher role)

**Request Body:**
```json
{
  "verificationStatus": "approved",
  "verifiedBy": "uuid",
  "verifiedByName": "Jane Dispatcher",
  "discrepancies": [
    {
      "type": "quantity_mismatch",
      "description": "Received 9 pallets instead of 10",
      "severity": "high"
    }
  ],
  "notes": "Contacted customer about missing pallet",
  "internalNotes": "Filed insurance claim #12345",
  "notifyCustomer": true
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| verificationStatus | enum | Yes | `approved`, `rejected`, `needs_review`, `incomplete` |
| verifiedBy | uuid | Yes | Dispatcher ID |
| verifiedByName | string | Yes | Dispatcher name |
| discrepancies | array | No | List of discrepancies found |
| notes | string | No | Customer-visible notes |
| internalNotes | string | No | Internal notes only |
| notifyCustomer | boolean | No | Send notification (default: false) |

**Response:** `200 OK`
```json
{
  "success": true,
  "verification": {
    "trip_id": "uuid",
    "verification_status": "approved",
    "verified_by_name": "Jane Dispatcher",
    "verified_at": "2025-12-25T12:00:00Z",
    "has_discrepancies": false
  }
}
```

---

## 👤 CUSTOMER PORTAL APIS

### 1. Customer Registration

Register a new customer portal user.

**Endpoint:** `POST /api/portal/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "action": "register",
  "customerId": "ACME-CORP",
  "email": "john@acmecorp.com",
  "password": "SecurePass123!",
  "name": "John Smith",
  "phone": "+1-416-555-0123",
  "role": "admin"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | Must be `"register"` |
| customerId | string | Yes | Customer/Company ID |
| email | string | Yes | Email address |
| password | string | Yes | Password (min 8 characters) |
| name | string | Yes | Full name |
| phone | string | No | Phone number |
| role | enum | No | `admin`, `viewer`, `billing`, `dispatcher` (default: `viewer`) |

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "customerId": "ACME-CORP",
    "email": "john@acmecorp.com",
    "name": "John Smith",
    "role": "admin"
  },
  "message": "Registration successful. Please log in."
}
```

**Errors:**
- `400` - Validation error (weak password, invalid email)
- `409` - Email already registered

---

### 2. Customer Login

Authenticate and get access token.

**Endpoint:** `POST /api/portal/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@acmecorp.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "customerId": "ACME-CORP",
    "email": "john@acmecorp.com",
    "name": "John Smith",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Token Expiration:**
- Access Token: 24 hours
- Refresh Token: 7 days

**Security Features:**
- Failed attempts tracked
- Account locked for 15 minutes after 5 failed attempts
- Session tracking with IP and User-Agent
- Audit logging

**Errors:**
- `401` - Invalid credentials
- `403` - Account locked

---

### 3. Get Customer Orders

List all orders for authenticated customer.

**Endpoint:** `GET /api/portal/orders`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| startDate | date | No | Filter from date |
| endDate | date | No | Filter to date |
| limit | number | No | Results per page (default: 50) |
| offset | number | No | Pagination offset (default: 0) |

**Example:**
```http
GET /api/portal/orders?status=In Transit&limit=20&offset=0
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-12345",
      "status": "In Transit",
      "pickup_location": "Toronto, ON",
      "dropoff_location": "Montreal, QC",
      "created_at": "2025-12-25T08:00:00Z",
      "trip_id": "uuid",
      "trip_status": "en_route",
      "driver_name": "Mike Wilson",
      "unit_number": "734401"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 4. Create Order (Quote Request)

Create a new order or quote request.

**Endpoint:** `POST /api/portal/orders`

**Authentication:** Required

**Request Body:**
```json
{
  "orderType": "standard",
  "pickupLocation": "123 Main St, Toronto, ON M5V 1A1",
  "dropoffLocation": "456 Queen St, Montreal, QC H3A 1B2",
  "pickupTime": "2025-12-26T08:00:00Z",
  "dropoffTime": "2025-12-27T17:00:00Z",
  "specialInstructions": "Tailgate delivery required"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "customer_id": "ACME-CORP",
    "status": "New",
    "pickup_location": "123 Main St...",
    "dropoff_location": "456 Queen St...",
    "created_at": "2025-12-25T10:30:00Z"
  }
}
```

---

### 5. Track Order

Get real-time tracking for an order.

**Endpoint:** `GET /api/portal/orders/:orderId/tracking?token=<shareToken>`

**Authentication:** Required OR valid share token

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | No | Share token for public access |

**Response:** `200 OK`
```json
{
  "success": true,
  "tracking": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-12345",
      "status": "In Transit",
      "pickupLocation": "Toronto, ON",
      "dropoffLocation": "Montreal, QC"
    },
    "trip": {
      "id": "uuid",
      "status": "en_route",
      "driver": "Mike Wilson",
      "unit": "734401",
      "currentLocation": {
        "lat": 45.5017,
        "lng": -73.5673,
        "lastUpdate": "2025-12-25T10:25:00Z"
      },
      "timeline": {
        "pickupArrival": "2025-12-25T08:15:00Z",
        "pickupDeparture": "2025-12-25T08:45:00Z",
        "deliveryArrival": null,
        "deliveryDeparture": null,
        "estimatedDelivery": "2025-12-25T14:00:00Z"
      }
    },
    "locationHistory": [
      {
        "latitude": 45.5017,
        "longitude": -73.5673,
        "recorded_at": "2025-12-25T10:25:00Z"
      }
    ],
    "events": [
      {
        "event_type": "departure",
        "status": "departed_pickup",
        "occurred_at": "2025-12-25T08:45:00Z"
      }
    ],
    "lastUpdated": "2025-12-25T10:30:00Z"
  }
}
```

---

## ⚠️ ERROR HANDLING

All endpoints return consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "error description"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Common Errors

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "error": "Trip not found"
}
```

---

## 🚦 RATE LIMITING

**Default Limits:**
- Public endpoints: 100 requests per 15 minutes per IP
- Authenticated endpoints: 1000 requests per hour per user
- API keys: Configurable per key

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640430000
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## 🔔 WEBHOOKS

Webhooks can be configured to receive real-time notifications for events.

### Webhook Configuration

**Table:** `webhooks`

**Endpoint:** `/api/webhooks` (to be implemented)

### Webhook Events

| Event | Trigger |
|-------|---------|
| `order.created` | New order created |
| `order.dispatched` | Order assigned to driver |
| `trip.started` | Trip started |
| `trip.arrived_pickup` | Arrived at pickup |
| `trip.departed_pickup` | Departed pickup |
| `trip.arrived_delivery` | Arrived at delivery |
| `trip.delivered` | Delivery completed |
| `pod.uploaded` | POD document uploaded |
| `pod.verified` | POD verified |
| `exception.created` | Exception reported |

### Webhook Payload Example

```json
{
  "event": "trip.delivered",
  "timestamp": "2025-12-25T12:00:00Z",
  "data": {
    "trip_id": "uuid",
    "order_id": "uuid",
    "delivered_at": "2025-12-25T12:00:00Z"
  }
}
```

### Webhook Security

Webhooks include an HMAC signature for verification:

```http
X-Webhook-Signature: sha256=abc123...
```

---

## 📚 SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Upload document
const uploadDocument = async (tripId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // First upload file to storage (S3/R2)
  const uploadResponse = await uploadToStorage(formData);
  
  // Then save metadata
  return api.post(`/trips/${tripId}/documents`, {
    documentType: 'POD',
    fileUrl: uploadResponse.url,
    fileName: file.name,
    fileSize: file.size,
    uploadedBy: userId,
    uploadedByType: 'driver',
  });
};
```

### Python

```python
import requests

class TMSClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
    
    def get_orders(self, status=None, limit=50):
        params = {'limit': limit}
        if status:
            params['status'] = status
        
        response = self.session.get(
            f'{self.base_url}/portal/orders',
            params=params
        )
        return response.json()

# Usage
client = TMSClient('http://localhost:3000/api', 'your-token')
orders = client.get_orders(status='In Transit')
```

---

## 🔍 TESTING

### Postman Collection

Import this collection for testing:

```json
{
  "info": {
    "name": "TMS API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Customer Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/portal/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@customer.com\",\"password\":\"TestPass123!\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    }
  ]
}
```

---

**For more examples and implementation details, see:**
- `TMS_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `QUICK_START_GUIDE.md` - Quick setup and testing

**Version History:**
- v1.0.0 (2025-12-25) - Initial release with ePOD and Customer Portal APIs
