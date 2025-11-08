"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const areas = [
    { title: "Order Intake", href: "/orders", desc: "Create and manage incoming orders." },
    { title: "Dispatch", href: "/dispatch", desc: "Plan and assign jobs to assets and drivers." },
    { title: "Tracking & Tracing", href: "/tracking", desc: "Real-time location and status for shipments." },
    { title: "Customer Service", href: "/customer-service", desc: "Support tickets, communications and history." },
    { title: "Fleet Management", href: "/fleet", desc: "Manage trucks, drivers and trailers." },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/vercel.svg" alt="logo" width={48} height={48} />
            <div>
              <h1 className="text-2xl font-semibold">Fleet App</h1>
              <p className="text-sm text-zinc-600">Choose a major area to get started</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="main-heading">
          <h2 id="main-heading" className="sr-only">
            Major areas
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group block rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <h3 className="mb-2 text-lg font-medium group-hover:text-black">{a.title}</h3>
                <p className="text-sm text-zinc-600">{a.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-sm text-zinc-500">© {new Date().getFullYear()} Fleet App</footer>
      </main>
    </div>
  );
}
