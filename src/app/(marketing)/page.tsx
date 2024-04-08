"use client";

import Link from "next/link";

export default function Page() {
  return (
    <main>
      <Link href="/dashboard">GO to Dashboard</Link>
      <Link href="/auth">GO to Auth</Link>
    </main>
  );
}
