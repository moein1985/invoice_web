# 🚀 **نقشه راه پیاده‌سازی - Invoice Management System**

## 📋 **نکات مهم قبل از شروع**

### درخواست‌ها (بدون کد):
این فایل **فقط شامل درخواست‌ها** است. کدها را خودت بنویس با توجه به best practices.

### اولویت‌ها:
1. ✅ Type Safety کامل
2. ✅ استفاده از Prisma برای تمام کوئری‌ها
3. ✅ ساختار Modular و Clean Architecture
4. ✅ Error Handling جامع
5. ✅ Testing برای Critical Parts

---

## 🎯 **Phase 1: Foundation Setup**

### Step 1.1: Initialize Monorepo
**درخواست:**
- Initialize pnpm workspace در root
- Create `pnpm-workspace.yaml`
- Setup root `package.json` با scripts
- Add `.gitignore` مناسب برای Node.js + Next.js + NestJS
- Create `.env.example` با environment variables

**Environment Variables مورد نیاز:**
```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/invoice_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# API
API_PORT=3001
API_BASE_URL=http://localhost:3001

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001

# SIP (optional - برای phase 4)
SIP_SERVER_URL=
SIP_USER=
SIP_PASSWORD=
```

---

### Step 1.2: Setup Next.js Frontend
**درخواست:**
- Create Next.js 15 project در `apps/web`
- Enable App Router
- Setup TypeScript با strict mode
- Configure Tailwind CSS
- Install و configure shadcn/ui
- Setup folder structure:
  ```
  apps/web/src/
  ├── app/              # Pages (App Router)
  ├── components/       # React Components
  │   ├── ui/          # shadcn components
  │   └── features/    # Feature components
  ├── lib/             # Utilities
  ├── hooks/           # Custom Hooks
  └── types/           # TypeScript Types
  ```

**Dependencies:**
- next@^15.0.0
- react@^18.3.0
- typescript@^5.3.0
- tailwindcss@^3.4.0
- @tanstack/react-query@^5.0.0
- zustand@^4.4.0
- zod@^3.22.0
- axios or fetch wrapper

---

### Step 1.3: Setup NestJS Backend
**درخواست:**
- Create NestJS project در `apps/api`
- Enable TypeScript strict mode
- Setup folder structure:
  ```
  apps/api/src/
  ├── modules/
  │   ├── auth/
  │   ├── users/
  │   ├── customers/
  │   ├── documents/
  │   └── calls/
  ├── common/
  │   ├── decorators/
  │   ├── guards/
  │   ├── filters/
  │   └── interceptors/
  ├── config/
  └── main.ts
  ```

**Dependencies:**
- @nestjs/core@^10.0.0
- @nestjs/common@^10.0.0
- @nestjs/jwt@^10.2.0
- @nestjs/passport@^10.0.0
- @nestjs/platform-socket.io@^10.0.0
- bcrypt@^5.1.0
- class-validator@^0.14.0
- class-transformer@^0.5.0

**Configuration:**
- Enable CORS برای frontend
- Global validation pipe
- Global exception filter
- Swagger documentation (optional)

---

### Step 1.4: Setup Prisma Database Package
**درخواست:**
- Create package در `packages/database`
- Initialize Prisma
- Create `schema.prisma` با تمام models (users, customers, documents, document_items, call_history)
- Configure PostgreSQL connection
- Add scripts برای:
  - `prisma generate`
  - `prisma migrate dev`
  - `prisma studio`

**Prisma Schema Requirements:**
- استفاده از UUID برای IDs
- Relations بین جداول
- Indexes مناسب
- Default values
- Timestamps (createdAt, updatedAt)
- Enums برای: role, documentType, documentStatus, approvalStatus, callStatus

**مدل‌های مورد نیاز:**
1. User
2. Customer
3. Document
4. DocumentItem
5. CallHistory

---

### Step 1.5: Docker Compose Setup
**درخواست:**
- Create `docker-compose.yml` در root
- Setup PostgreSQL 16 service
- Setup Redis service (برای sessions/cache)
- Add volumes برای data persistence
- Configure networks
- Add health checks

**Services:**
- postgres (port 5432)
- redis (port 6379)

---

### Step 1.6: Shared Types Package
**درخواست:**
- Create package در `packages/types`
- Export TypeScript interfaces/types برای:
  - User (UserDto, CreateUserDto, UpdateUserDto)
  - Customer (CustomerDto, CreateCustomerDto, UpdateCustomerDto)
  - Document (DocumentDto, CreateDocumentDto, UpdateDocumentDto)
  - DocumentItem
  - CallHistory
  - Auth (LoginDto, TokenDto, AuthResponseDto)

**نکته:** این types باید با Prisma generated types سازگار باشند.

---

## 🔐 **Phase 2: Authentication System**

### Step 2.1: Auth Module در Backend
**درخواست:**
- Create `auth` module در NestJS
- Implement JWT strategy
- Create endpoints:
  - POST `/api/auth/login` - Login با username/password
  - POST `/api/auth/logout` - Logout
  - GET `/api/auth/me` - دریافت user فعلی
  - POST `/api/auth/refresh` - Refresh token (optional)

**Features:**
- Password hashing با bcrypt
- JWT token generation
- JWT validation guard
- Role-based guard (Admin, Manager, User)

---

### Step 2.2: Users Module در Backend
**درخواست:**
- Create `users` module در NestJS
- Implement CRUD endpoints:
  - GET `/api/users` - لیست کاربران (فقط Admin)
  - GET `/api/users/:id` - جزئیات کاربر
  - POST `/api/users` - ایجاد کاربر جدید (فقط Admin)
  - PATCH `/api/users/:id` - ویرایش کاربر
  - DELETE `/api/users/:id` - حذف کاربر (فقط Admin)
  - PATCH `/api/users/:id/toggle-active` - فعال/غیرفعال کردن

**Validation:**
- Username: required, unique, 3-50 chars
- Password: required, min 6 chars (hash شود)
- Full name: required
- Role: required, enum
- Email: optional, valid format

---

### Step 2.3: Auth در Frontend
**درخواست:**
- Create authentication context/store با Zustand
- Implement login page در `/app/login`
- Create protected route wrapper
- Store JWT در localStorage یا cookies
- Auto-redirect به dashboard بعد از login
- Logout functionality
- Token refresh logic (optional)

**UI Components:**
- Login form با validation (Zod)
- Error messages
- Loading states

---

## 📊 **Phase 3: Core Business Logic**

### Step 3.1: Customers Module - Backend
**درخواست:**
- Create `customers` module در NestJS
- Implement CRUD endpoints:
  - GET `/api/customers` - لیست با pagination, search, filter
  - GET `/api/customers/:id` - جزئیات مشتری
  - POST `/api/customers` - ایجاد مشتری
  - PATCH `/api/customers/:id` - ویرایش
  - DELETE `/api/customers/:id` - حذف
  - PATCH `/api/customers/:id/toggle-active` - فعال/غیرفعال

**Features:**
- Search by: name, code, phone, email
- Filter by: isActive
- Sort by: name, code, createdAt
- Pagination: page, limit
- Include document count در response

**Validation:**
- Code: required, unique, 3-20 chars
- Name: required, 2-100 chars
- Phone: optional, valid format
- Email: optional, valid format
- Credit limit: optional, positive number

---

### Step 3.2: Customers Module - Frontend
**درخواست:**
- Create customers pages:
  - `/app/customers` - لیست مشتریان
  - `/app/customers/[id]` - جزئیات مشتری
  - `/app/customers/new` - ایجاد مشتری جدید

**UI Components:**
- Customers table با:
  - Search input
  - Active/Inactive filter
  - Pagination
  - دکمه‌های: Edit, Delete, Call (فعلاً disabled)
- Customer form با validation
- Customer detail view
- Confirmation dialogs

**Data Fetching:**
- استفاده از React Query
- Optimistic updates
- Error handling
- Loading states

---

### Step 3.3: Documents Module - Backend
**درخواست:**
- Create `documents` module در NestJS
- Implement CRUD endpoints:
  - GET `/api/documents` - لیست با filters
  - GET `/api/documents/:id` - جزئیات با items
  - POST `/api/documents` - ایجاد سند با items
  - PATCH `/api/documents/:id` - ویرایش
  - DELETE `/api/documents/:id` - حذف
  - POST `/api/documents/:id/approve` - تایید سند (Manager/Admin)
  - POST `/api/documents/:id/reject` - رد سند (Manager/Admin)

**Features:**
- Auto-generate document number
- محاسبه خودکار: totalAmount = sum(items), finalAmount = totalAmount - discountAmount
- Filter by: customer, date range, type, status, approval status
- Sort by: date, amount, customer
- Include items در response
- Validation برای: dates, amounts, items array

**Business Logic:**
- فقط draft documents قابل ویرایش هستند
- فقط Manager/Admin می‌توانند approve/reject کنند
- پس از approve/reject، status تغییر نمی‌کند

---

### Step 3.4: Documents Module - Frontend
**درخواست:**
- Create documents pages:
  - `/app/documents` - لیست اسناد
  - `/app/documents/[id]` - جزئیات سند
  - `/app/documents/new` - ایجاد سند جدید

**UI Components:**
- Documents table با filters پیشرفته
- Document form با:
  - Customer select
  - Date pickers
  - Items table (add/remove rows)
  - Auto-calculation of amounts
  - Discount input
- Document detail view با:
  - Print button (optional)
  - Approve/Reject buttons (conditional)
  - Status badges

**Data Fetching:**
- React Query با prefetching
- Optimistic updates
- Complex form state management

---

### Step 3.5: Dashboard Page
**درخواست:**
- Create dashboard page در `/app/dashboard` یا `/app`
- نمایش آمار کلیدی:
  - تعداد مشتریان فعال
  - تعداد اسناد این ماه
  - مجموع مبلغ اسناد این ماه
  - تعداد اسناد در انتظار تایید
  - تعداد تماس‌های امروز (phase 4)
  - نمودارها (optional):
    - اسناد به تفکیک نوع
    - روند اسناد در طول زمان

**UI Components:**
- Stat cards
- Charts با Recharts یا Chart.js (optional)
- Recent activities list
- Quick actions

---

## 📞 **Phase 4: SIP Phone Integration**

### Step 4.1: Call History Module - Backend
**درخواست:**
- Create `calls` module در NestJS
- Implement endpoints:
  - GET `/api/calls` - لیست تماس‌ها با filters
  - GET `/api/calls/:id` - جزئیات تماس
  - POST `/api/calls` - ثبت تماس جدید
  - PATCH `/api/calls/:id` - بروزرسانی (مثلاً وقتی تماس تمام شد)

**Features:**
- Filter by: customer, user, date range, status
- Sort by: date, duration
- Include customer و user info در response
- Store recording URL (optional)

---

### Step 4.2: Real-time با Socket.io
**درخواست:**
- Setup Socket.io در NestJS
- Create gateway برای call events:
  - `call:start` - شروع تماس
  - `call:end` - پایان تماس
  - `call:status` - تغییر وضعیت
- Emit events به clients متصل

---

### Step 4.3: SIP.js Integration - Frontend
**درخواست:**
- Install SIP.js
- Create `useSIP` custom hook برای:
  - Initialize SIP UserAgent
  - Register with SIP server
  - Make call
  - Answer call
  - Hangup call
  - Get call status
- Create Phone UI component:
  - Dialer pad (optional)
  - Call button
  - Hangup button
  - Mute/Unmute button
  - Timer
  - Caller ID display

**Integration Points:**
- دکمه Call در customers list
- Click روی phone number → شروع تماس
- نمایش modal/drawer حین تماس
- ثبت خودکار در call history

---

### Step 4.4: Call History - Frontend
**درخواست:**
- Create call history page در `/app/calls`
- نمایش لیست تماس‌ها با:
  - نام مشتری
  - شماره تلفن
  - تاریخ و ساعت
  - مدت تماس
  - وضعیت
  - دکمه پخش ضبط (اگر موجود باشد)
- Filters برای جستجو

---

## 🧪 **Phase 5: Testing & Quality**

### Step 5.1: Backend Testing
**درخواست:**
- Setup Jest برای NestJS
- Write unit tests برای:
  - Auth service
  - Validation pipes
  - Guards
- Write integration tests برای:
  - Auth endpoints
  - Customers CRUD
  - Documents CRUD
- Test coverage > 70%

---

### Step 5.2: Frontend Testing
**درخواست:**
- [x] Setup Jest + React Testing Library
- [x] Write component tests برای:
  - [x] Login form
  - [x] Customer form (Integration test covers this)
  - [ ] Document form
- [x] Write integration tests برای critical flows:
  - [x] Login flow
  - [x] Create customer (List view tested)
  - [ ] Create document

---

## 🐳 **Phase 6: Docker & Deployment**

### Step 6.1: Dockerize Services
**درخواست:**
- [x] Create Dockerfile برای Next.js frontend
- [x] Create Dockerfile برای NestJS backend
- [x] Update docker-compose.yml با frontend و backend services
- [x] Create production-ready configuration
- [x] Setup environment variables properly
- [x] Create `.dockerignore` files

---

### Step 6.2: Documentation
**درخواست:**
- Create comprehensive README.md با:
  - Project overview
  - Architecture diagram (optional)
  - Setup instructions
  - Run commands
  - Environment variables
  - API documentation
  - Troubleshooting
- Add comments در کدها برای قسمت‌های پیچیده
- Create API documentation با Swagger (optional)

---

## 📦 **Phase 7: Data Migration** (Skipped by User)

### Step 7.1: Migration Script
**درخواست:**
- [x] Create Node.js script برای migration از MySQL به PostgreSQL
- [x] Read data از MySQL database (invoice_db) (Skipped)
- [x] Transform data اگر لازم باشد
- [x] Write data به PostgreSQL (Skipped)
- [x] Verify data integrity (Skipped)
- [x] Log migration results (Skipped)

**جداول برای migrate:**
1. users
2. customers
3. documents
4. document_items

**نکته:** Password hashes باید حفظ شوند (bcrypt با $2a$ prefix)

---

## ✅ **Final Checklist**

### Functionality:
- [ ] Login/Logout کار می‌کند
- [ ] CRUD مشتریان کار می‌کند
- [ ] CRUD اسناد با items کار می‌کند
- [ ] Approve/Reject documents کار می‌کند
- [ ] Dashboard نمایش می‌دهد
- [ ] SIP phone تماس برقرار می‌کند
- [ ] Call history ذخیره می‌شود
- [ ] Real-time updates کار می‌کند

### Quality:
- [ ] هیچ TypeScript error نیست
- [ ] Type safety کامل است
- [ ] Error handling جامع است
- [ ] Validation در frontend و backend است
- [ ] Loading states مناسب است
- [ ] Tests نوشته شده‌اند
- [ ] Code documented است

### Deployment:
- [ ] Docker Compose اجرا می‌شود
- [ ] Production builds کار می‌کنند
- [ ] Environment variables مستند هستند
- [ ] README کامل است

---

## 🎯 **اولویت‌بندی نهایی**

1. **Critical (باید حتماً باشد):**
   - Phase 1: Setup
   - Phase 2: Authentication
   - Phase 3: Customers & Documents

2. **High (خیلی مهم):**
   - Phase 4: SIP Phone
   - Phase 6: Docker

3. **Medium (مهم):**
   - Phase 5: Testing
   - Phase 7: Migration

4. **Low (خوب است داشته باشد):**
   - Swagger documentation
   - Advanced charts
   - Call recording playback

---

**نکته نهایی:** در هر مرحله، ابتدا backend را کامل کن، سپس frontend را پیاده‌سازی کن، و در پایان test کن.

**موفق باشی! 🚀**
