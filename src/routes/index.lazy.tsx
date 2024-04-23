import { createLazyFileRoute, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useAuth, useAuthLogout } from "@/store/auth";
import { signOut } from "firebase/auth";
import { auth as firebaseAuth } from "@/firebaseConfig";
import { transactionsSchema } from "./_dashboard/transactions/index.lazy";

export const Route = createLazyFileRoute("/")({ component: Page });

function Page() {
  const auth = useAuth();
  const logout = useAuthLogout();

  const router = useRouterState();
  const search = transactionsSchema.parse(router.location.search);

  return (
    <main>
      <div className="flex items-start justify-center flex-col">
        <Link from="/" to="/transactions" search={search}>
          GO to Dashboard
        </Link>
        <Link to="/auth">GO to Auth</Link>
        <Link to="/">GO to Home</Link>
        {auth ? (
          <div>
            <p>{auth.name}</p>
            <Button
              onClick={() => {
                logout();
                signOut(firebaseAuth);
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
