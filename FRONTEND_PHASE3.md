# Frontend Updates - Phase 3 ✅

این مستند تغییرات Phase 3 (Frontend) را شرح می‌دهد که شامل پیاده‌سازی UI برای سیستم Approval Workflow است.

## 📁 فایل‌های ایجاد شده

### 1. Types (`types/document.ts`) ✅
تعریف TypeScript types برای:
- `DocumentType`: 6 نوع سند (temp_proforma, proforma, invoice, return_invoice, receipt, other)
- `ApprovalStatus`: 4 وضعیت (pending, approved, rejected, not_required)
- `Document`: Interface کامل با همه فیلدهای approval و profit
- `ConversionChainItem`: برای نمایش زنجیره تبدیل

### 2. Approvals Page (`app/approvals/page.tsx`) ✅
صفحه مدیریت تأییدیه‌ها شامل:
- **Cards آماری**: تعداد pending, approved, rejected
- **دو Tab**: 
  - Pending: لیست اسناد در انتظار تأیید
  - History: تاریخچه تأییدها/ردها
- **عملیات**:
  - Approve button: تأیید سند
  - Reject button با modal: رد سند با دلیل (حداقل 10 کاراکتر)
- **Filtering**: فقط اسناد با مبلغ کمتر از maxApprovalAmount کاربر نمایش داده می‌شوند

### 3. Document Form Updates (`app/documents/page.tsx`) ✅
به‌روزرسانی فرم ایجاد/ویرایش سند:

#### Document Type Selector
```tsx
<Select value={formData.documentType}>
  - temp_proforma (پیش‌فاکتور موقت)
  - proforma (پیش‌فاکتور)
  - invoice (فاکتور)
  - return_invoice (فاکتور برگشتی)
  - receipt (رسید)
  - other (سایر)
</Select>
```

#### Profit Fields (فقط برای temp_proforma و proforma)
هر آیتم شامل:
- `purchasePrice`: قیمت خرید
- `profitPercentage`: درصد سود
- نمایش خودکار مبلغ سود محاسبه شده

#### Additional Fields
- `defaultProfitPercentage`: درصد سود پیش‌فرض (برای همه آیتم‌ها)
- `notes`: یادداشت‌های اضافی
- `attachment`: لینک فایل پیوست

#### Filter Updates
فیلترهای لیست اسناد:
- Document Type: همه 6 نوع
- Approval Status: pending, approved, rejected

### 4. Document Detail Page (`app/documents/[id]/page.tsx`) ✅
صفحه جزئیات کامل سند با:

#### Information Cards
- اطلاعات سند: مشتری، تاریخ، وضعیت تأیید
- اطلاعات تأیید کننده: نام، تاریخ تأیید
- دلیل رد (اگر رد شده باشد)
- یادداشت‌ها

#### Items Display
- لیست کامل آیتم‌ها
- نمایش profit details (برای temp_proforma/proforma)
- جمع کل، تخفیف، مبلغ نهایی
- سود کل (اگر موجود باشد)

#### Conversion Features
**دکمه Convert**:
- شرط نمایش: `canConvert()`
  - برای temp_proforma: فقط اگر approved باشد
  - برای proforma: همیشه
- عملکرد: تبدیل به نوع بعدی (temp_proforma → proforma → invoice)
- بعد از موفقیت: redirect به سند جدید

**Conversion Chain Timeline**:
- نمایش گرافیکی زنجیره تبدیل
- هر مرحله شامل: شماره سند، نوع، مبلغ
- مرحله فعلی با رنگ primary مشخص می‌شود

#### Request Approval Button
- برای اسناد pending که نیاز به تأیید دارند
- ارسال مجدد درخواست تأیید

### 5. Navigation Update (`app/dashboard/page.tsx`) ✅
اضافه شدن لینک "تأییدیه‌ها":
- فقط برای نقش‌های: admin, manager, supervisor
- conditional rendering با بررسی `user.role`

### 6. UI Components (`components/ui/`) ✅
اضافه شدن components جدید:
- `separator.tsx`: جداکننده horizontal/vertical
- `textarea.tsx`: فیلد متن چندخطی
- استفاده از Radix UI primitives

## 🎨 ویژگی‌های UI

### Responsive Design
- Grid layout برای cards (1 col mobile, 3 cols desktop)
- Tables با scroll horizontal در موبایل
- Dialog های full-width در موبایل

### Persian (RTL) Support
- `dir="rtl"` در همه صفحات
- فونت Vazirmatn
- اعداد فارسی با `toLocaleString('fa-IR')`
- تاریخ فارسی با `toLocaleDateString('fa-IR')`

### Color Coding
- Pending: Yellow/Secondary badge
- Approved: Green/Default badge
- Rejected: Red/Destructive badge
- Not Required: Gray/Outline badge

### Loading States
- Skeleton loading برای queries
- Disabled buttons حین mutation
- "در حال بارگذاری..." messages

## 🔄 Integration با Backend

### API Endpoints استفاده شده:
```typescript
// Approvals
GET  /documents/approvals/pending
GET  /documents/approvals/history
POST /documents/:id/approve
POST /documents/:id/reject { reason }

// Conversion
POST /documents/:id/convert
GET  /documents/:id/conversion-chain

// Documents
GET  /documents?documentType=...&approvalStatus=...
GET  /documents/:id
POST /documents { documentType, items, notes, ... }
```

### React Query Integration
- Automatic caching با queryKey
- Optimistic updates
- Invalidation بعد از mutations
- Error handling با axios interceptors

## 📊 User Experience Flow

### Workflow برای Employee:
1. Navigate به Documents → سند جدید
2. انتخاب `temp_proforma` از dropdown
3. افزودن آیتم‌ها با قیمت خرید و درصد سود
4. مشاهده محاسبه خودکار سود
5. Submit → اگر مبلغ > 10M: status = pending
6. View document detail
7. منتظر approval از supervisor/manager

### Workflow برای Supervisor/Manager:
1. Navigate به Approvals
2. مشاهده pending documents (فیلتر شده با approval limit)
3. کلیک Approve یا Reject
4. برای Reject: وارد کردن دلیل (min 10 chars)
5. Submit → document status تغییر می‌کند
6. مشاهده در History tab

### Workflow برای Conversion:
1. Navigate به Document Detail (سند approved شده)
2. کلیک "تبدیل به پیش‌فاکتور"
3. Confirm در modal
4. Redirect به سند جدید proforma
5. مشاهده Conversion Chain (timeline)
6. تکرار برای invoice

## 🧪 نکات تست

### Test Scenarios:
1. **Create temp_proforma با profit fields**
   - Verify: purchasePrice و profitPercentage ذخیره می‌شوند
   - Verify: سود محاسبه شده درست است

2. **Approval workflow**
   - Employee با limit 10M نمی‌تواند 105M را approve کند
   - Supervisor با limit 100M می‌تواند 90M را approve کند
   - Reject نیاز به reason دارد (min 10 chars)

3. **Conversion**
   - temp_proforma pending نمی‌تواند convert شود
   - بعد از approve، convert button ظاهر می‌شود
   - هر conversion شماره جدید می‌گیرد
   - Chain به درستی نمایش داده می‌شود

4. **Filtering**
   - Filter by documentType کار می‌کند
   - Filter by approvalStatus کار می‌کند
   - Pagination درست است

## 🚀 نتیجه

همه features Phase 3 پیاده‌سازی شد:
- ✅ Approvals page با full functionality
- ✅ Document form با document types و profit tracking
- ✅ Document detail با conversion features
- ✅ Conversion chain visualization
- ✅ Complete filtering system
- ✅ RTL و Persian number formatting
- ✅ Responsive design
- ✅ Role-based access control

**مرحله بعدی**: Testing در browser و رفع احتمالی bugs کوچک UI.
