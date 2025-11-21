# راهنمای اجرا و تست پروژه Invoice

## 📋 پیش‌نیازها

- Docker Desktop نصب شده باشد
- Port های 3000، 3001، 5432 و 6379 آزاد باشند

## 🚀 روش اول: اجرا با Docker (توصیه می‌شود)

### 1. بالا آوردن تمام سرویس‌ها

```powershell
cd C:\Users\Administrator\Desktop\codes\invoice_on_web
docker-compose up -d
```

این دستور 4 سرویس را اجرا می‌کند:
- **postgres**: دیتابیس PostgreSQL (پورت 5432)
- **redis**: کش Redis (پورت 6379)
- **api**: Backend NestJS (پورت 3001)
- **web**: Frontend Next.js (پورت 3000)

### 2. چک کردن وضعیت سرویس‌ها

```powershell
docker-compose ps
```

باید همه سرویس‌ها `Up` باشند.

### 3. مشاهده لاگ‌ها

```powershell
# همه سرویس‌ها
docker-compose logs -f

# فقط API
docker-compose logs -f api

# فقط Web
docker-compose logs -f web
```

### 4. اجرای Migration و Seed

اولین بار که پروژه را اجرا می‌کنید، باید دیتابیس را مقداردهی کنید:

```powershell
# ورود به کانتینر database
docker exec -it invoice_postgres psql -U invoice_user -d invoice_db

# در psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# اعمال schema
cd packages\database
npx prisma db push --accept-data-loss

# اجرای seed
npx ts-node prisma/seed.ts
```

### 5. دسترسی به برنامه

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### 6. توقف سرویس‌ها

```powershell
# توقف
docker-compose stop

# توقف و حذف کانتینرها
docker-compose down

# توقف و حذف کانتینرها + حذف volumes (دیتا پاک می‌شود)
docker-compose down -v
```

---

## 🛠️ روش دوم: اجرای Local (برای Development)

### 1. نصب Dependencies

```powershell
cd C:\Users\Administrator\Desktop\codes\invoice_on_web
pnpm install
```

### 2. بالا آوردن فقط دیتابیس و Redis

```powershell
docker-compose up -d postgres redis
```

### 3. تنظیم Environment Variables

فایل `.env` را در `packages/database` ایجاد کنید:

```env
DATABASE_URL="postgresql://invoice_user:secure_password@localhost:5432/invoice_db"
```

### 4. Generate Prisma Client

```powershell
cd packages\database
npx prisma generate
```

### 5. اعمال Schema و Seed

```powershell
# پاک کردن دیتابیس قبلی (اختیاری)
docker exec -it invoice_postgres psql -U invoice_user -d invoice_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# اعمال schema
npx prisma db push --accept-data-loss

# seed داده‌ها
npx ts-node prisma/seed.ts
```

### 6. اجرای Backend (API)

```powershell
cd apps\api
pnpm start:dev
```

API روی پورت 3001 اجرا می‌شود.

### 7. اجرای Frontend (Web)

ترمینال جدید باز کنید:

```powershell
cd apps\web
pnpm dev
```

Frontend روی پورت 3000 اجرا می‌شود.

---

## 🧪 تست کردن Workflow جدید

### کاربران Test (از Seed)

```
1. admin@example.com / password123
   - نقش: admin
   - محدودیت تأیید: نامحدود

2. manager@example.com / password123
   - نقش: manager
   - محدودیت تأیید: 500,000,000 تومان

3. supervisor@example.com / password123
   - نقش: supervisor
   - محدودیت تأیید: 100,000,000 تومان

4. employee@example.com / password123
   - نقش: employee
   - محدودیت تأیید: 10,000,000 تومان

5. user@example.com / password123
   - نقش: user
   - محدودیت تأیید: ندارد
```

### سناریوی تست Approval Workflow

#### 1. ورود به سیستم با employee

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "employee@example.com",
  "password": "password123"
}
```

Token دریافتی را ذخیره کنید.

#### 2. ساخت temp_proforma

```bash
POST http://localhost:3001/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentType": "temp_proforma",
  "customerId": "{customer_id_from_seed}",
  "issueDate": "2024-11-21",
  "discountAmount": 0,
  "defaultProfitPercentage": 20,
  "items": [
    {
      "description": "محصول تست",
      "quantity": 10,
      "unitPrice": 5000000,
      "purchasePrice": 4000000,
      "profitPercentage": 25
    }
  ],
  "notes": "این یک پیش‌فاکتور تستی است",
  "requiresApproval": true
}
```

#### 3. درخواست تأیید

```bash
POST http://localhost:3001/documents/{document_id}/request-approval
Authorization: Bearer {token}
```

#### 4. ورود با supervisor و مشاهده اسناد منتظر تأیید

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "supervisor@example.com",
  "password": "password123"
}
```

دریافت لیست اسناد منتظر:

```bash
GET http://localhost:3001/documents/approvals/pending
Authorization: Bearer {supervisor_token}
```

#### 5. تأیید سند

```bash
POST http://localhost:3001/documents/{document_id}/approve
Authorization: Bearer {supervisor_token}
```

یا رد سند:

```bash
POST http://localhost:3001/documents/{document_id}/reject
Authorization: Bearer {supervisor_token}
Content-Type: application/json

{
  "reason": "قیمت‌ها نیاز به بازبینی دارند"
}
```

#### 6. تبدیل به proforma (پس از تأیید)

```bash
POST http://localhost:3001/documents/{document_id}/convert
Authorization: Bearer {employee_token}
```

این سند temp_proforma را به proforma تبدیل می‌کند (بدون قیمت خرید و سود).

#### 7. تبدیل به invoice

```bash
POST http://localhost:3001/documents/{proforma_id}/convert
Authorization: Bearer {employee_token}
```

#### 8. مشاهده زنجیره تبدیل

```bash
GET http://localhost:3001/documents/{any_document_id}/conversion-chain
Authorization: Bearer {token}
```

---

## 📊 دسترسی به دیتابیس

### با psql

```powershell
docker exec -it invoice_postgres psql -U invoice_user -d invoice_db
```

### Query های مفید

```sql
-- مشاهده همه کاربران با سطح دسترسی
SELECT id, email, role, "maxApprovalAmount" FROM "User";

-- مشاهده اسناد منتظر تأیید
SELECT "documentNumber", "documentType", "finalAmount", "approvalStatus" 
FROM "Document" 
WHERE "approvalStatus" = 'pending';

-- مشاهده زنجیره تبدیل
SELECT d1."documentNumber" as original, d2."documentNumber" as converted
FROM "Document" d1
LEFT JOIN "Document" d2 ON d2."convertedFromId" = d1.id;
```

---

## 🐛 عیب‌یابی

### مشکل: کانتینر API خطا می‌دهد

```powershell
docker-compose logs api
```

احتمالا Prisma Client generate نشده. دستور زیر را اجرا کنید:

```powershell
docker-compose exec api sh
cd /app/packages/database
npx prisma generate
exit
docker-compose restart api
```

### مشکل: دیتابیس خالی است

```powershell
cd packages\database
npx ts-node prisma/seed.ts
```

### مشکل: Port ها در دسترس نیستند

پورت‌های اشغال شده را پیدا کنید:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
```

و process ها را متوقف کنید یا پورت را در `docker-compose.yml` تغییر دهید.

---

## 📚 مستندات API

بعد از اجرای پروژه، می‌توانید endpoint ها را تست کنید:

### Authentication
- `POST /auth/register` - ثبت‌نام
- `POST /auth/login` - ورود
- `GET /auth/me` - پروفایل من

### Documents
- `GET /documents` - لیست اسناد
- `POST /documents` - ساخت سند جدید
- `GET /documents/:id` - جزئیات سند
- `PATCH /documents/:id` - ویرایش سند
- `DELETE /documents/:id` - حذف سند

### Approval (جدید)
- `POST /documents/:id/request-approval` - درخواست تأیید
- `POST /documents/:id/approve` - تأیید سند
- `POST /documents/:id/reject` - رد سند
- `GET /documents/approvals/pending` - لیست اسناد منتظر تأیید
- `GET /documents/approvals/history` - تاریخچه تأییدات من

### Conversion (جدید)
- `POST /documents/:id/convert` - تبدیل سند به مرحله بعد
- `GET /documents/:id/conversion-chain` - زنجیره تبدیل سند

---

## 🎯 نکات مهم

1. **اولین اجرا**: حتما seed را اجرا کنید تا کاربران تست ایجاد شوند
2. **محدودیت تأیید**: employee فقط تا 10M می‌تواند تأیید کند
3. **زنجیره تبدیل**: temp_proforma → proforma → invoice
4. **فیلدهای مخفی**: قیمت خرید و سود در proforma و invoice نمایش داده نمی‌شوند
5. **تأیید الزامی**: اگر مبلغ سند بیشتر از سطح دسترسی کاربر باشد، نیاز به تأیید دارد

---

## 🔄 بروزرسانی Schema

اگر schema را تغییر دادید:

```powershell
cd packages\database

# 1. Generate Prisma Client
npx prisma generate

# 2. اعمال تغییرات
npx prisma db push

# 3. Restart Docker containers (اگر از Docker استفاده می‌کنید)
docker-compose restart api
```
