# 🎯 **بافت و زمینه پروژه Invoice Management System**

## 📖 **تاریخچه پروژه**

### پروژه قبلی (invoice)
- **تکنولوژی**: Flutter Web + Node.js (Express) + MySQL
- **مشکلات تجربه شده**:
  - عملکرد ضعیف Flutter Web در مرورگر Chrome
  - خطاهای رندرینگ و assertion errors
  - تبدیل دستی انواع داده (TINYINT→bool, DECIMAL→double)
  - نوشتن کوئری‌های SQL خام و نگهداری سخت
  - عدم type safety در کوئری‌های دیتابیس
  - mapping دستی snake_case ↔ camelCase
  - 15+ خط کد برای هر کوئری ساده

### تصمیم برای پروژه جدید
بعد از بررسی جامع و مقایسه تکنولوژی‌ها، تصمیم گرفته شد پروژه با **TypeScript Full-Stack** از نو نوشته شود.

---

## 🎯 **هدف پروژه جدید**

### سیستم مدیریت فاکتور با قابلیت تماس تلفنی
یک **وب اپلیکیشن خالص** (بدون موبایل) برای:
1. مدیریت مشتریان (Customers)
2. صدور و مدیریت فاکتورها (Invoices/Documents)
3. **تماس تلفنی مستقیم از لیست مشتریان** (Click-to-Call)
4. ثبت و نمایش تاریخچه تماس‌ها
5. مدیریت کاربران و سطوح دسترسی

---

## 🛠️ **استک تکنولوژی انتخاب شده**

### Frontend
- **Next.js 15** (React + TypeScript + App Router)
- **shadcn/ui** + **Tailwind CSS** برای UI
- **TanStack Query** (React Query) برای data fetching
- **Zustand** برای state management
- **SIP.js** برای تماس‌های WebRTC

### Backend
- **NestJS** (Enterprise TypeScript Framework)
- **Prisma ORM** (Type-safe database queries)
- **PostgreSQL 16** (بجای MySQL)
- **JWT** برای Authentication
- **Socket.io** برای Real-time updates

### DevOps
- **pnpm workspaces** (Monorepo structure)
- **Docker + Docker Compose**
- **ESLint + Prettier**
- **Jest** برای Testing

---

## 🗄️ **ساختار دیتابیس (از پروژه قبلی)**

### جداول اصلی که باید Migrate شوند:

#### 1. **users** - کاربران سیستم
```
- id: UUID (Primary Key)
- username: VARCHAR(50) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL (bcrypt)
- full_name: VARCHAR(100) NOT NULL
- role: ENUM('admin', 'manager', 'user') DEFAULT 'user'
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. **customers** - مشتریان
```
- id: UUID (Primary Key)
- code: VARCHAR(20) UNIQUE NOT NULL
- name: VARCHAR(100) NOT NULL
- phone: VARCHAR(20)
- email: VARCHAR(100)
- address: TEXT
- credit_limit: DECIMAL(15,2) DEFAULT 0
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. **documents** - اسناد/فاکتورها
```
- id: UUID (Primary Key)
- document_number: VARCHAR(50) UNIQUE NOT NULL
- document_type: ENUM('invoice', 'quote', 'receipt', 'other')
- customer_id: UUID (Foreign Key → customers)
- issue_date: DATE NOT NULL
- due_date: DATE
- total_amount: DECIMAL(15,2) NOT NULL
- discount_amount: DECIMAL(15,2) DEFAULT 0
- final_amount: DECIMAL(15,2) NOT NULL
- status: ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft'
- approval_status: ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
- created_by: UUID (Foreign Key → users)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. **document_items** - آیتم‌های سند
```
- id: UUID (Primary Key)
- document_id: UUID (Foreign Key → documents)
- description: TEXT NOT NULL
- quantity: DECIMAL(10,2) NOT NULL
- unit_price: DECIMAL(15,2) NOT NULL
- total_price: DECIMAL(15,2) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 5. **call_history** - تاریخچه تماس‌ها (جدول جدید)
```
- id: UUID (Primary Key)
- customer_id: UUID (Foreign Key → customers)
- caller_id: UUID (Foreign Key → users)
- phone_number: VARCHAR(20) NOT NULL
- call_start: TIMESTAMP NOT NULL
- call_end: TIMESTAMP
- call_duration: INTEGER (seconds)
- call_status: ENUM('completed', 'missed', 'rejected', 'busy') NOT NULL
- recording_url: VARCHAR(500)
- notes: TEXT
- created_at: TIMESTAMP
```

---

## ✨ **قابلیت‌های کلیدی (Features)**

### 1. احراز هویت و مجوزها
- Login/Logout با JWT
- Role-based access control (Admin, Manager, User)
- Protected routes

### 2. مدیریت مشتریان
- لیست مشتریان با جستجو و فیلتر
- افزودن/ویرایش/حذف مشتری
- نمایش اطلاعات تماس
- **دکمه تماس مستقیم** کنار هر مشتری

### 3. مدیریت فاکتورها
- صدور فاکتور جدید
- لیست فاکتورها با فیلتر وضعیت
- ویرایش و حذف فاکتور
- تایید/رد فاکتور (برای Manager/Admin)
- محاسبه خودکار مبالغ و تخفیف

### 4. سیستم تماس تلفنی (SIP Phone)
- **Click-to-Call**: کلیک روی شماره تلفن → شروع تماس
- نمایش وضعیت تماس (Ringing, Connected, Ended)
- Timer برای مدت تماس
- ثبت خودکار در تاریخچه تماس‌ها
- امکان ضبط تماس (اختیاری)

### 5. تاریخچه تماس‌ها
- لیست تمام تماس‌های انجام شده
- فیلتر بر اساس مشتری، کاربر، تاریخ
- نمایش مدت تماس
- پخش ضبط تماس (اگر موجود باشد)

### 6. داشبورد
- تعداد مشتریان فعال
- تعداد فاکتورهای امروز/این ماه
- مجموع مبالغ فاکتورها
- تعداد تماس‌های امروز
- نمودارهای آماری

---

## 📁 **ساختار Monorepo مورد نیاز**

```
invoice_on_web/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React Components
│   │   │   ├── lib/           # Utilities
│   │   │   └── hooks/         # Custom Hooks (useSIP)
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── modules/       # Feature modules
│       │   │   ├── auth/
│       │   │   ├── customers/
│       │   │   ├── documents/
│       │   │   ├── users/
│       │   │   └── calls/
│       │   ├── common/        # Shared code
│       │   └── main.ts
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── database/              # Prisma Schema
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── types/                 # Shared TypeScript Types
│   │   └── src/
│   │       ├── user.ts
│   │       ├── customer.ts
│   │       └── document.ts
│   │
│   └── ui/                    # Shared UI Components (optional)
│       └── src/
│
├── docker-compose.yml         # PostgreSQL + Redis + Services
├── pnpm-workspace.yaml
├── package.json               # Root package
├── .gitignore
├── .env.example
└── README.md
```

---

## 🔧 **نیازمندی‌های فنی**

### قابلیت‌های حیاتی:
1. **Type Safety کامل**: از دیتابیس تا UI همه چیز typed باشد
2. **Auto-generation**: Prisma باید types را خودکار تولید کند
3. **Real-time**: Socket.io برای وضعیت تماس‌ها
4. **WebRTC**: SIP.js برای تماس‌های مرورگری
5. **Docker-ready**: کل سیستم در Docker اجرا شود
6. **Linux Compatible**: روی سرور Linux قابل اجرا باشد

### SIP Phone Requirements:
- استفاده از **SIP.js** library
- اتصال به SIP Server (مثلاً Asterisk/FreeSWITCH)
- WebRTC برای audio streaming
- UI ساده برای: Call, Hangup, Mute, Hold
- نمایش caller ID و timer

---

## 🚀 **مراحل پیاده‌سازی**

### Phase 1: Setup & Infrastructure
1. Initialize pnpm workspace
2. Setup Next.js در `apps/web`
3. Setup NestJS در `apps/api`
4. Setup Prisma در `packages/database`
5. Create Docker Compose برای PostgreSQL

### Phase 2: Authentication
1. JWT strategy در NestJS
2. Login/Logout endpoints
3. Protected routes در Next.js
4. User session management

### Phase 3: Core Features
1. Customers CRUD (Backend + Frontend)
2. Documents CRUD
3. Basic Dashboard

### Phase 4: SIP Integration
1. SIP.js setup در Frontend
2. Call History API در Backend
3. Real-time call status با Socket.io
4. UI برای phone dialer

### Phase 5: Polish & Deploy
1. Testing (Jest)
2. Docker optimization
3. Production build
4. Documentation

---

## 📊 **مقایسه با پروژه قبلی**

| ویژگی | پروژه قبلی (Flutter) | پروژه جدید (TypeScript) |
|------|---------------------|------------------------|
| Frontend | Flutter Web | Next.js 15 |
| Backend | Express.js | NestJS |
| Database | MySQL | PostgreSQL |
| ORM | Raw SQL | Prisma |
| Type Safety | Partial | Full Stack |
| Code Lines/Query | 15+ | 3-5 |
| Mobile Support | ✅ | ❌ (فقط Web) |
| SIP Phone | ❌ | ✅ SIP.js |
| Performance | 😐 | ⚡ |
| Maintenance | 😰 | 😊 |

---

## 🎯 **اهداف کیفی**

1. **Developer Experience**: کد تمیز، خوانا، و قابل نگهداری
2. **Type Safety**: هیچ `any` در TypeScript نباشد
3. **Performance**: بارگذاری سریع صفحات
4. **Scalability**: ساختار monorepo برای رشد آینده
5. **Documentation**: کامنت‌گذاری و README برای هر module

---

## ⚠️ **نکات مهم**

### چرا PostgreSQL؟
- عملکرد بهتر در کوئری‌های پیچیده
- پشتیبانی بهتر از JSON و Full-text search
- Prisma با PostgreSQL بهینه‌تر کار می‌کند
- Transaction management قوی‌تر

### چرا Prisma؟
- Auto-generation of TypeScript types
- Migration management
- Type-safe queries
- No manual mapping
- کوئری 15 خطی → 3 خطی

### چرا NestJS؟
- ساختار modular و enterprise-grade
- Dependency Injection built-in
- TypeScript-first
- Testing utilities
- Documentation عالی

### چرا Next.js 15؟
- Server Components برای performance
- App Router برای routing پیشرفته
- API Routes برای BFF pattern (اختیاری)
- SEO-friendly
- Build و Deploy آسان

---

## 📝 **داده‌های موجود در MySQL**

در پروژه قبلی، دیتابیس MySQL با نام `invoice_db` موجود است که شامل:
- ~10-20 user
- ~50-100 customer
- ~200+ document با items

**نیاز به Data Migration Script:**
باید اسکریپتی نوشته شود که داده‌ها را از MySQL به PostgreSQL منتقل کند.

---

## 🔐 **اطلاعات احراز هویت فعلی**

از پروژه قبلی:
- **Admin Username**: admin
- **Admin Password**: admin123
- **Password Hash Algorithm**: bcrypt ($2a$ prefix)

این اطلاعات باید در پروژه جدید حفظ شوند.

---

## 🎨 **UI/UX Requirements**

- **زبان**: فارسی (RTL support)
- **تم**: دارک و لایت مود
- **رسپانسیو**: Desktop-first (موبایل ثانویه)
- **دسترسی**: کیبورد navigation
- **فرم‌ها**: Validation با Zod
- **نوتیفیکیشن**: Toast messages
- **لودینگ**: Skeleton و Spinners

---

## 📦 **Dependencies اصلی**

### Frontend (apps/web)
```json
{
  "next": "^15.0.0",
  "react": "^18.3.0",
  "typescript": "^5.3.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "sip.js": "^0.21.0",
  "tailwindcss": "^3.4.0",
  "zod": "^3.22.0"
}
```

### Backend (apps/api)
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/common": "^10.0.0",
  "@nestjs/jwt": "^10.2.0",
  "@prisma/client": "^5.7.0",
  "socket.io": "^4.6.0",
  "bcrypt": "^5.1.0"
}
```

### Database (packages/database)
```json
{
  "prisma": "^5.7.0",
  "@prisma/client": "^5.7.0"
}
```

---

## 🐳 **Docker Services مورد نیاز**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: invoice_db
      POSTGRES_USER: invoice_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # در آینده می‌توان اضافه کرد:
  # - minio (S3-compatible storage for call recordings)
  # - asterisk (SIP server)
```

---

## 📚 **منابع و مستندات**

- Next.js: https://nextjs.org/docs
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- SIP.js: https://sipjs.com/guides
- shadcn/ui: https://ui.shadcn.com

---

## ✅ **Checklist پیاده‌سازی**

- [x] Initialize monorepo با pnpm
- [x] Setup Next.js frontend
- [x] Setup NestJS backend
- [x] Create Prisma schema
- [x] Docker Compose configuration
- [x] Authentication module
- [x] Customers module
- [x] Documents module
- [x] Call History module
- [x] SIP.js integration
- [x] Dashboard
- [ ] Testing setup
- [ ] Data migration script (Skipped)
- [x] Production Docker build
- [ ] Documentation

## 🐳 **Docker Environment**
- **Services**:
  - `invoice_web`: Next.js Frontend (Port 3000)
  - `invoice_api`: NestJS Backend (Port 3001)
  - `invoice_postgres`: PostgreSQL 16 (Port 5432)
  - `invoice_redis`: Redis 7 (Port 6379)
- **Configuration**:
  - `docker-compose.yml` in root
  - Multi-stage Dockerfiles in `apps/api` and `apps/web`
  - Prisma binaryTargets updated for Alpine Linux (`linux-musl-openssl-3.0.x`)

---

**آخرین بروزرسانی**: 20 نوامبر 2025
**نسخه**: 1.0.0
**وضعیت**: فاز 6 (Dockerization) تکمیل شد. محیط آماده تست و باگ‌گیری است.
