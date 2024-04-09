"use client";

import { Button } from "@/components/ui/button";
import useStore from "@/store";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

export default function Page() {
  const auth = useStore(useAuthStore, (state) => state.auth);
  const authStore = useStore(useAuthStore, (state) => state);

  console.log("auth", auth);

  return (
    <main>
      <div className="flex items-start justify-center flex-col">
        <Link href="/dashboard">GO to Dashboard</Link>
        <Link href="/auth">GO to Auth</Link>
        {auth ? (
          <div>
            <p>{auth.name}</p>
            <Button
              onClick={() => {
                authStore?.logout();
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <p>Not Authenticated</p>
        )}
      </div>
    </main>
  );
}
