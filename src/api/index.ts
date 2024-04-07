import ky from "ky";

/**
 * Base API instance, it is shared between client and server
 */
export const baseApi = ky.extend({
  prefixUrl: process.env.BASE_URL,
});

/**
 * Client API instance, it is used only in client
 */
export const clientApi = ky.extend({
  prefixUrl: process.env.BASE_URL,
  hooks: {
    beforeRequest: [
      async (req) => {
        return req;
      },
    ],
  },
});
