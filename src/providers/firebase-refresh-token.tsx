import { auth } from "@/firebaseConfig";
import { useAuthUpdateToken, useAuthToken } from "@/store/auth";
import { ReactNode, useEffect } from "react";

export default function FirebaseRefreshToken({
  children,
}: {
  children: ReactNode;
}) {
  const authToken = useAuthToken();
  const updateToken = useAuthUpdateToken();

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User is logged in");
        const token = await user.getIdToken();
        if (token !== authToken) {
          if (updateToken) {
            updateToken(token);
          }
        }
      }
    });
  }, [authToken, updateToken]);

  return <>{children}</>;
}
