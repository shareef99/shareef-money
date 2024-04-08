"use client";

import { cookieKeys } from "@/constants/cookies";
import { auth } from "@/firebaseConfig";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { ReactNode, useEffect } from "react";

export default function FirebaseRefreshToken({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const authToken = getCookie(cookieKeys.authToken);

        if (token !== authToken) {
          setCookie(cookieKeys.authToken, token);
        }
      } else {
        // Only delete token if user is not available, refresh token will come from firebase, but not id
        deleteCookie(cookieKeys.authToken);
      }
    });
  }, []);

  return <>{children}</>;
}
