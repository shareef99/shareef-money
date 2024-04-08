"use client";

import { baseApi } from "@/api";
import { Button } from "@/components/ui/button";
import { cookieKeys } from "@/constants/cookies";
import { getCookie } from "cookies-next";
import Link from "next/link";

export default function Page() {
  const token = getCookie(cookieKeys.authToken);

  const fetchUser = async () => {
    try {
      const data = await baseApi
        .get("users/22", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json<{ message: string; users: [] }>();

      console.log(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main>
      Dashboard
      <Link href="/">Home</Link>
      <Button onClick={() => fetchUser()}>Fetch User</Button>
    </main>
  );
}
