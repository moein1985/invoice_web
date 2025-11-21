# Invoice API Tests

این فایل شامل نمونه requestهای API برای تست Workflow جدید است.

## متغیرها

```
BASE_URL=http://localhost:3001
```

---

## 1️⃣ Authentication

### Login با Employee

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "username": "employee",
  "password": "employee123"
}
```

**پاسخ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "employee",
    "fullName": "کارمند فروش",
    "role": "employee"
  }
}
```

**Token را ذخیره کنید** → در header های بعدی استفاده می‌شود.

---

### Login با Supervisor

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "username": "supervisor",
  "password": "supervisor123"
}
```

---

### Login با Admin

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

---

## 2️⃣ Customers (برای گرفتن Customer ID)

### لیست مشتریان

```http
GET {{BASE_URL}}/customers
Authorization: Bearer {{employee_token}}
```

**یکی از customer ID ها را یادداشت کنید.**

---

## 3️⃣ ساخت temp_proforma (پیش‌فاکتور موقت)

### ساخت temp_proforma با قیمت خرید و سود

```http
POST {{BASE_URL}}/documents
Authorization: Bearer {{employee_token}}
Content-Type: application/json

{
  "documentType": "temp_proforma",
  "customerId": "{{customer_id}}",
  "issueDate": "2024-11-21",
  "discountAmount": 0,
  "defaultProfitPercentage": 20,
  "requiresApproval": true,
  "notes": "پیش‌فاکتور تست با قیمت خرید و سود",
  "items": [
    {
      "description": "لپ‌تاپ دل XPS 15",
      "quantity": 2,
      "unitPrice": 45000000,
      "purchasePrice": 38000000,
      "profitPercentage": 18.42,
      "isManualPrice": false
    },
    {
      "description": "ماوس بی‌سیم لاجیتک",
      "quantity": 5,
      "unitPrice": 1500000,
      "purchasePrice": 1200000,
      "profitPercentage": 25,
      "isManualPrice": false
    }
  ]
}
```

**مجموع**: (2 × 45M) + (5 × 1.5M) = 90M + 7.5M = **97.5 میلیون تومان**

این مبلغ بیشتر از محدودیت employee (10M) است، پس **نیاز به تأیید** دارد.

**پاسخ:**
```json
{
  "id": "document-uuid-1",
  "documentNumber": "TMP-2024-000001",
  "documentType": "temp_proforma",
  "approvalStatus": "pending",
  "requiresApproval": true,
  "finalAmount": 97500000,
  "totalPurchaseAmount": 82000000,
  "totalProfitAmount": 15500000,
  ...
}
```

**Document ID را یادداشت کنید.**

---

## 4️⃣ Approval Workflow

### درخواست تأیید (اگر هنوز pending نیست)

```http
POST {{BASE_URL}}/documents/{{document_id}}/request-approval
Authorization: Bearer {{employee_token}}
```

---

### مشاهده اسناد منتظر تأیید (با Supervisor)

```http
GET {{BASE_URL}}/documents/approvals/pending
Authorization: Bearer {{supervisor_token}}
```

**پاسخ:**
```json
{
  "data": [
    {
      "id": "document-uuid-1",
      "documentNumber": "TMP-2024-000001",
      "documentType": "temp_proforma",
      "finalAmount": 97500000,
      "approvalStatus": "pending",
      "createdByName": "کارمند فروش",
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### تأیید سند (با Supervisor)

```http
POST {{BASE_URL}}/documents/{{document_id}}/approve
Authorization: Bearer {{supervisor_token}}
```

**پاسخ:**
```json
{
  "id": "document-uuid-1",
  "approvalStatus": "approved",
  "approvedBy": "supervisor-uuid",
  "approvedByName": "سرپرست فروش",
  "approvedAt": "2024-11-21T12:34:56.789Z",
  ...
}
```

---

### یا رد سند (با Supervisor)

```http
POST {{BASE_URL}}/documents/{{document_id}}/reject
Authorization: Bearer {{supervisor_token}}
Content-Type: application/json

{
  "reason": "قیمت‌های پیشنهادی بیش از حد بالا هستند. لطفاً بازبینی و قیمت‌گذاری مجدد انجام دهید."
}
```

**پاسخ:**
```json
{
  "id": "document-uuid-1",
  "approvalStatus": "rejected",
  "approvedBy": "supervisor-uuid",
  "approvedByName": "سرپرست فروش",
  "rejectionReason": "قیمت‌های پیشنهادی بیش از حد بالا هستند...",
  ...
}
```

---

## 5️⃣ Conversion Workflow (فقط اگر Approved شد)

### تبدیل temp_proforma به proforma

```http
POST {{BASE_URL}}/documents/{{temp_proforma_id}}/convert
Authorization: Bearer {{employee_token}}
```

**پاسخ:**
```json
{
  "id": "document-uuid-2",
  "documentNumber": "PRF-2024-000001",
  "documentType": "proforma",
  "convertedFromId": "document-uuid-1",
  "finalAmount": 97500000,
  "totalPurchaseAmount": null,
  "totalProfitAmount": null,
  "items": [
    {
      "description": "لپ‌تاپ دل XPS 15",
      "quantity": 2,
      "unitPrice": 45000000,
      "purchasePrice": 38000000,
      "profitAmount": null,
      "profitPercentage": null
    },
    ...
  ]
}
```

**نکته**: قیمت خرید در آیتم‌ها هنوز هست ولی `totalPurchaseAmount` و فیلدهای profit در item ها null شدند.

**Proforma ID را یادداشت کنید.**

---

### تبدیل proforma به invoice (فاکتور نهایی)

```http
POST {{BASE_URL}}/documents/{{proforma_id}}/convert
Authorization: Bearer {{employee_token}}
```

**پاسخ:**
```json
{
  "id": "document-uuid-3",
  "documentNumber": "INV-2024-000001",
  "documentType": "invoice",
  "convertedFromId": "document-uuid-2",
  "finalAmount": 97500000,
  ...
}
```

**نکته**: شماره سند جدید دریافت کرد (INV prefix).

---

### مشاهده زنجیره تبدیل

```http
GET {{BASE_URL}}/documents/{{any_document_id}}/conversion-chain
Authorization: Bearer {{employee_token}}
```

**پاسخ:**
```json
[
  {
    "id": "document-uuid-1",
    "documentNumber": "TMP-2024-000001",
    "documentType": "temp_proforma",
    "createdAt": "2024-11-21T10:00:00.000Z"
  },
  {
    "id": "document-uuid-2",
    "documentNumber": "PRF-2024-000001",
    "documentType": "proforma",
    "createdAt": "2024-11-21T12:00:00.000Z",
    "convertedFromId": "document-uuid-1"
  },
  {
    "id": "document-uuid-3",
    "documentNumber": "INV-2024-000001",
    "documentType": "invoice",
    "createdAt": "2024-11-21T13:00:00.000Z",
    "convertedFromId": "document-uuid-2"
  }
]
```

---

## 6️⃣ لیست اسناد با فیلتر

### فیلتر بر اساس نوع سند

```http
GET {{BASE_URL}}/documents?documentType=temp_proforma
Authorization: Bearer {{employee_token}}
```

```http
GET {{BASE_URL}}/documents?documentType=invoice
Authorization: Bearer {{employee_token}}
```

---

### فیلتر بر اساس وضعیت تأیید

```http
GET {{BASE_URL}}/documents?approvalStatus=pending
Authorization: Bearer {{supervisor_token}}
```

```http
GET {{BASE_URL}}/documents?approvalStatus=approved
Authorization: Bearer {{employee_token}}
```

---

## 7️⃣ تاریخچه تأییدات

### مشاهده تأییدات من (برای Supervisor)

```http
GET {{BASE_URL}}/documents/approvals/history
Authorization: Bearer {{supervisor_token}}
```

**پاسخ:**
```json
{
  "data": [
    {
      "id": "document-uuid-1",
      "documentNumber": "TMP-2024-000001",
      "approvalStatus": "approved",
      "approvedAt": "2024-11-21T12:34:56.789Z",
      "finalAmount": 97500000,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 🧪 سناریوهای تست اضافی

### ❌ تست محدودیت تأیید

Employee تلاش می‌کند مبلغ بالا را تأیید کند:

```http
POST {{BASE_URL}}/documents/{{large_amount_document_id}}/approve
Authorization: Bearer {{employee_token}}
```

**پاسخ خطا:**
```json
{
  "statusCode": 403,
  "message": "شما مجاز به تأیید مبلغ 97,500,000 تومان نیستید. حداکثر مبلغ قابل تأیید شما: 10,000,000 تومان",
  "error": "Forbidden"
}
```

---

### ❌ تست تبدیل بدون تأیید

تلاش برای تبدیل temp_proforma که هنوز تأیید نشده:

```http
POST {{BASE_URL}}/documents/{{pending_document_id}}/convert
Authorization: Bearer {{employee_token}}
```

**پاسخ خطا:**
```json
{
  "statusCode": 400,
  "message": "این سند هنوز تأیید نشده است",
  "error": "Bad Request"
}
```

---

## 📋 خلاصه کاربران تست

| Username   | Password      | Role       | Max Approval     |
|------------|---------------|------------|------------------|
| admin      | admin123      | admin      | نامحدود          |
| manager    | manager123    | manager    | 500,000,000      |
| supervisor | supervisor123 | supervisor | 100,000,000      |
| employee   | employee123   | employee   | 10,000,000       |
| user       | user123       | user       | -                |

---

## 🔧 ابزارهای توصیه شده

1. **Postman**: import این فایل به عنوان Collection
2. **REST Client (VS Code Extension)**: مستقیم از این فایل request بزنید
3. **curl**: از command line تست کنید
4. **Thunder Client**: در VS Code

---

## 💡 نکات مهم

1. **Token Expiry**: اگر token منقضی شد، دوباره login کنید
2. **Customer ID**: از endpoint `/customers` یک customer_id بگیرید
3. **Approval Chain**: temp_proforma → approve → proforma → invoice
4. **Purchase Price**: فقط در temp_proforma نمایش داده می‌شود
5. **Document Numbers**: خودکار generate می‌شوند (TMP/PRF/INV-YEAR-NNNNNN)
