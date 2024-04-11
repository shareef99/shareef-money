"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebaseConfig";
import { setCookie } from "cookies-next";
import { cookieKeys } from "@/constants/cookies";
import { api } from "@/api";
import { AuthUser, useAuthStore } from "@/store/auth";
import useStore from "@/store";

export default function Page() {
  const router = useRouter();
  const authStore = useStore(useAuthStore, (state) => state);

  // State
  const [loading, setLoading] = useState<boolean>(false);

  // Functions
  const googleSignInHandler = async () => {
    try {
      setLoading(true);
      const googleAuthProvider = new GoogleAuthProvider();
      const userCredentials = await signInWithPopup(auth, googleAuthProvider);

      if (!userCredentials.user.email) {
        throw new Error("Email not found");
      }

      const token = await userCredentials.user.getIdToken();

      const res = await api
        .post("users/signin", {
          json: {
            name: userCredentials.user.displayName,
            email: userCredentials.user.email,
            token: token,
          },
        })
        .json<{ user: AuthUser }>();
      console.log(res);

      authStore?.login(res.user);
      setCookie(cookieKeys.authToken, token);

      router.push("/");
    } catch (error) {
      console.log(error);

      if (error && typeof error === "object" && "message" in error) {
        const message = error.message as string;
        if (message.includes("auth/unauthorized-domain")) {
          // errorNotification({
          //   content: "Domain is not added to firebase",
          //   toastId: "auth-unauthorized-domain",
          //   isUpdate: false,
          // });
          return;
        }
      } else {
        // errorNotification({
        //   content: "Failed to login. Please try again",
        //   toastId: "google-signin",
        //   isUpdate: false,
        // });
      }
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
          </div>
        </div>
      </section>
    </main>
  );
}
