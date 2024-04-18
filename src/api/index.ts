import ky from "ky";

export const api = ky.extend({
  prefixUrl: process.env.BASE_URL,
  retry: 0,
  headers: {
    "Content-Type": "application/json",
  },
});
