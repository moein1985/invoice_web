import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold">سیستم مدیریت فاکتور</h1>
        <p className="text-xl text-muted-foreground">
          Invoice Management System with SIP Phone Integration
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
          >
            ورود به سیستم
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-border rounded-md hover:bg-accent transition"
          >
            داشبورد
          </Link>
        </div>
      </div>
    </main>
  );
}
