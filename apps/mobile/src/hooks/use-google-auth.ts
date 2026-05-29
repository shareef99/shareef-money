import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useAuth } from "../providers/auth-provider";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { googleLogin, isLoading } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken = response.authentication?.idToken;
    if (idToken) {
      googleLogin(idToken);
    }
  }, [response, googleLogin]);

  return {
    promptGoogleLogin: () => promptAsync(),
    isReady: !!request,
    isLoading,
  };
}
