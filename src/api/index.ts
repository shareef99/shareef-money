import ky from "ky";
import { getSession } from "next-auth/react";

/**
 * Base API instance, it is shared between client and server
 */
export const baseApi = ky.extend({
  prefixUrl: process.env.BASE_URL,
});

/**
 * Client API instance, it is used only in client
 */
export const clientApi = baseApi.extend({
  hooks: {
    beforeRequest: [
      async (req) => {
        const session = await getSession();
        if (session) {
          req.headers.set("Authorization", `Bearer ${session.accessToken}`);
        }
        return req;
      },
    ],
  },
});
