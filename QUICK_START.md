# 🚀 راهنمای سریع اجرای پروژه

## ⚠️ مشکل Docker Build

فعلا Docker build برای API مشکل داره. برای اجرا از روش زیر استفاده کنید:

---

## 📝 مراحل اجرا (توصیه شده)

### 1. راه‌اندازی دیتابیس و Redis

```powershell
cd C:\Users\Administrator\Desktop\codes\invoice_on_web
docker-compose up -d postgres redis
```

چک کنید که در حال اجرا هستند:
```powershell
docker ps
```

باید `invoice_postgres` و `invoice_redis` را ببینید.

---

### 2. نصب Dependencies (اولین بار)

```powershell
pnpm install
```

---

### 3. Reset و Setup دیتابیس

```powershell
# پاک کردن schema قدیمی
docker exec -it invoice_postgres psql -U invoice_user -d invoice_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# اعمال schema جدید
cd packages\database
npx prisma db push --accept-data-loss

# ایجاد داده‌های تست
npx ts-node prisma/seed.ts
```

خروجی باید باشه:
```
✅ Admin user created: admin
✅ Manager user created: manager
✅ Supervisor user created: supervisor
✅ Employee user created: employee
✅ Regular user created: user
✅ 3 sample customers created
✅ Sample invoice created
✅ Sample temp proforma created
✅ Seeding finished.
```

---

### 4. اجرای Backend API (ترمینال 1)

```powershell
cd C:\Users\Administrator\Desktop\codes\invoice_on_web\apps\api

# تنظیم environment variables
$env:DATABASE_URL="postgresql://invoice_user:secure_password@localhost:5432/invoice_db"
$env:JWT_SECRET="super_secret_jwt_key"
$env:PORT="3001"
$env:CORS_ORIGIN="http://localhost:3000"

# اجرا
pnpm start:dev
```

منتظر بمانید تا ببینید:
```
🚀 Application is running on: http://localhost:3001
```

و این endpointها:
```
✅ /documents/:id/convert
✅ /documents/:id/conversion-chain
✅ /documents/:id/request-approval
✅ /documents/:id/approve
✅ /documents/:id/reject
✅ /documents/approvals/pending
✅ /documents/approvals/history
```

---

### 5. اجرای Frontend (ترمینال 2 - اختیاری)

```powershell
cd C:\Users\Administrator\Desktop\codes\invoice_on_web\apps\web
pnpm dev
```

Frontend روی http://localhost:3000 اجرا می‌شود.

---

## 🧪 تست سریع API

### Login

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$token = $response.access_token
Write-Host "✅ Login موفق! Token: $($token.Substring(0,20))..."
```

### لیست مشتریان

```powershell
$customers = Invoke-RestMethod -Uri "http://localhost:3001/customers" `
  -Headers @{Authorization="Bearer $token"}

$customerId = $customers.data[0].id
Write-Host "✅ Customer ID: $customerId"
```

### ساخت temp_proforma

```powershell
$doc = @{
  documentType = "temp_proforma"
  customerId = $customerId
  issueDate = "2024-11-21"
  discountAmount = 0
  defaultProfitPercentage = 20
  requiresApproval = $true
  items = @(
    @{
      description = "لپ‌تاپ تست"
      quantity = 2
      unitPrice = 45000000
      purchasePrice = 38000000
      profitPercentage = 18.42
    }
  )
} | ConvertTo-Json -Depth 10

$newDoc = Invoke-RestMethod -Uri "http://localhost:3001/documents" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body $doc

Write-Host "✅ سند ساخته شد: $($newDoc.documentNumber)"
Write-Host "   مبلغ نهایی: $($newDoc.finalAmount)"
Write-Host "   وضعیت: $($newDoc.approvalStatus)"
```

---

## 👥 کاربران تست

| Username   | Password      | Role       | محدودیت تأیید |
|------------|---------------|------------|----------------|
| admin      | admin123      | admin      | نامحدود        |
| manager    | manager123    | manager    | 500M تومان     |
| supervisor | supervisor123 | supervisor | 100M تومان     |
| employee   | employee123   | employee   | 10M تومان      |
| user       | user123       | user       | ندارد          |

---

## 🔄 Workflow کامل

### 1. Login با Employee
```powershell
$emp = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"employee","password":"employee123"}'
$empToken = $emp.access_token
```

### 2. ساخت temp_proforma با مبلغ بالا (نیاز به تأیید)
```powershell
# (کد بالا را با $empToken استفاده کنید)
# مبلغ 90M که بیشتر از محدودیت 10M است
```

### 3. Login با Supervisor
```powershell
$sup = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"supervisor","password":"supervisor123"}'
$supToken = $sup.access_token
```

### 4. مشاهده اسناد منتظر تأیید
```powershell
$pending = Invoke-RestMethod -Uri "http://localhost:3001/documents/approvals/pending" `
  -Headers @{Authorization="Bearer $supToken"}
$docId = $pending.data[0].id
```

### 5. تأیید سند
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/documents/$docId/approve" `
  -Method POST `
  -Headers @{Authorization="Bearer $supToken"}
```

### 6. تبدیل به proforma
```powershell
$proforma = Invoke-RestMethod -Uri "http://localhost:3001/documents/$docId/convert" `
  -Method POST `
  -Headers @{Authorization="Bearer $empToken"}
Write-Host "✅ تبدیل شد به: $($proforma.documentNumber)"
```

### 7. تبدیل به invoice
```powershell
$invoice = Invoke-RestMethod -Uri "http://localhost:3001/documents/$($proforma.id)/convert" `
  -Method POST `
  -Headers @{Authorization="Bearer $empToken"}
Write-Host "✅ فاکتور نهایی: $($invoice.documentNumber)"
```

### 8. مشاهده زنجیره تبدیل
```powershell
$chain = Invoke-RestMethod -Uri "http://localhost:3001/documents/$($invoice.id)/conversion-chain" `
  -Headers @{Authorization="Bearer $empToken"}
$chain | ForEach-Object { Write-Host "$($_.documentNumber) ($($_.documentType))" }
```

---

## 🐛 حل مشکلات رایج

### مشکل: دیتابیس خطا می‌دهد
```powershell
# Reset کامل
docker exec -it invoice_postgres psql -U invoice_user -d invoice_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd packages\database
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts
```

### مشکل: Port در دسترس نیست
```powershell
# پیدا کردن process
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
# خاتمه دادن
Stop-Process -Id <PROCESS_ID>
```

### مشکل: Token منقضی شد
```powershell
# دوباره login کنید
$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'
$token = $response.access_token
```

---

## 📚 فایل‌های راهنما

- `HOW_TO_RUN.md` - راهنمای کامل اجرا
- `API_TESTS.md` - نمونه requestهای API
- `QUICK_START.md` - این فایل (شروع سریع)

---

## ✅ Checklist اجرا

- [ ] Docker Desktop در حال اجرا
- [ ] `docker-compose up -d postgres redis`
- [ ] `pnpm install` (اولین بار)
- [ ] Reset دیتابیس
- [ ] `prisma db push`
- [ ] `ts-node prisma/seed.ts`
- [ ] اجرای API: `pnpm start:dev` در `apps/api`
- [ ] تست Login: `POST /auth/login`
- [ ] مشاهده endpoints جدید در لاگ API

---

موفق باشید! 🎉
