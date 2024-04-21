import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { AuthUser, useAuthLogin } from "@/store/auth";
import {
  errorNotification,
  loadingNotification,
  successNotification,
} from "@/helpers/notification";
import { axiosClient } from "@/api";

export const Route = createLazyFileRoute("/auth")({ component: Page });

function Page() {
  const navigate = useNavigate({ from: "/auth" });
  const login = useAuthLogin();

  // State
  const [loading, setLoading] = useState<boolean>(false);

  // Functions
  const googleSignInHandler = async () => {
    try {
      loadingNotification("Signing in...", { id: "auth" });
      setLoading(true);
      const googleAuthProvider = new GoogleAuthProvider();
      const userCredentials = await signInWithPopup(auth, googleAuthProvider);

      console.log(userCredentials);

      if (!userCredentials.user.email) {
        throw new Error("Email not found");
      }

      const token = await userCredentials.user.getIdToken();

      const { data } = await axiosClient.post<{ user: AuthUser }>(
        "users/signin",
        {
          name: userCredentials.user.displayName,
          email: userCredentials.user.email,
          token: token,
        }
      );

      console.log(data);

      console.log(login);
      login({ auth: data.user, token });

      successNotification("Signed in successfully", { id: "auth" });

      navigate({ to: "/transactions" });
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        const message = error.message as string;
        if (message.includes("auth/unauthorized-domain")) {
          errorNotification("Domain is not added to firebase", { id: "auth" });
          return;
        }
      }
      console.log(error);

      errorNotification("Failed to login. Please try again", { id: "auth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-w-screen min-h-screen bg-p-dark-blue bg-cover">
      <section className="container flex h-screen p-0">
        <div
          className={cn(
            "relative mt-auto h-3/4 w-full rounded-t-[2rem] bg-p-white",
            "sm:m-auto sm:h-fit sm:w-4/5 sm:rounded-b-[2rem]",
            "md:w-[70%] lg:w-[60%]"
          )}
        >
          <div className="mt-20 p-4 xs:p-8 sm:mt-0 md:mx-auto md:w-96">
            <button
              className={cn(
                "mx-auto flex w-fit rounded-full bg-p-light-gray p-4",
                loading && "cursor-not-allowed bg-opacity-80"
              )}
              onClick={() => {
                if (loading) return;
                googleSignInHandler();
              }}
              type="button"
            >
              Signin With Google
            </button>
            <button
              onClick={async () => {
                try {
                  loadingNotification("Logging out...", { id: "auth-logout" });
                  await signOut(auth);
                  successNotification("Logged out successfully", {
                    id: "auth-logout",
                  });
                } catch (error) {
                  errorNotification("Failed to logout. Please try again", {
                    id: "auth-logout",
                  });
                }
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
