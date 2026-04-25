import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-serif">404</h1>
        <p className="mt-4 text-ink/60">That report doesn't exist or has expired.</p>
        <Link href="/intake" className="mt-6 inline-block underline">
          Run a new audit
        </Link>
      </div>
    </main>
  );
}
