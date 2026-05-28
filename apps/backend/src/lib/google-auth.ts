import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../env.js";

type GooglePayload = {
  sub: string;
  email: string;
  name: string;
  picture: string | undefined;
  email_verified: boolean;
};

const googleJWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GooglePayload> {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const { payload } = await jwtVerify(idToken, googleJWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  if (!payload.email || !payload.sub) {
    throw new Error("Invalid Google token: missing email or sub");
  }

  if (!payload.email_verified) {
    throw new Error("Google email not verified");
  }

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    name: (payload.name as string | undefined) ?? (payload.email as string),
    picture: payload.picture as string | undefined,
    email_verified: payload.email_verified as boolean,
  };
}
