"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Page() {
  const { data: session } = useSession();

  return (
    <main>
      getServerSession Result
      {session ? <div>{session.user?.name}</div> : <div>Not signed in</div>}
      <Link href="/dashboard">GO to Dashboard</Link>
    </main>
  );
}
