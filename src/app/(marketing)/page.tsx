"use client";

import { clientApi } from "@/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

export default function Page() {
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUsers = async () => {
      // const res = await fetch("http://localhost:9000/api/v1/users", {
      //   headers: {
      //     Authorization: "Bearer DYNAMIC TOKEN HERE",
      //   },
      // });
      // const data = await res.json();

      // console.log(data);

      const res = await clientApi.get("users");
      const data = await res.json();
      console.log(data);
    };

    fetchUsers();

    if (session) {
      console.log(session);
    }

    // const request = await fetch("http://localhost:9000/api/v1/users");
    //
    // const data = await request.json();

    // console.log(data);
  }, [session]);

  return (
    <main>
      getServerSession Result
      {session ? <div>{session.user?.name}</div> : <div>Not signed in</div>}
      {/* {data?.users?.map((user: any) => (
        <div key={user.ID}>
          {user.ID} - {user.name}
        </div>
      ))} */}
      <Link href="/dashboard">GO to Dashboard</Link>
    </main>
  );
}
