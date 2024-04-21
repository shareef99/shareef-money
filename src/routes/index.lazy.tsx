import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { axiosClient } from "@/api";

const auth = {
  name: "Nadeem Shareef",
};

export const Route = createLazyFileRoute("/")({ component: Page });

function Page() {
  const fetch = async () => {
    const { data } = await axiosClient.get("/users");
    console.log(data);
  };

  return (
    <main>
      <div className="flex items-start justify-center flex-col">
        <Link to="/transactions">GO to Dashboard</Link>
        <Link to="/auth">GO to Auth</Link>
        <Link to="/">GO to Home</Link>
        {auth ? (
          <div>
            <p>{auth.name}</p>
            <Button
              onClick={() => {
                // authStore?.logout();
                fetch();
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
