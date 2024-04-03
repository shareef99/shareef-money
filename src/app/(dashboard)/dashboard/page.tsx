import { baseApi } from "@/api";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  const res = await baseApi.get("users", {
    headers: {
      Authorization: `Bearer ${session?.accessToken}`,
    },
  });
  const data = await res.json<{ message: string; users: [] }>();

  console.log(data.message);

  return <main>Dashboard</main>;
}
