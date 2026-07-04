// Dynamic Expo config layered on top of app.json. It switches the app's identity
// per environment so the production app and a dev build can both be installed on
// ONE device with fully separate storage (separate on-device expo-sqlite
// databases) — the dev build syncs to the dev backend, prod to prod, no mixing.
//
//   APP_VARIANT=production  → the real app:  "Shareef Money"        / com.shareef.money
//   anything else (incl. unset, the default for `expo run:android`)
//                           → the dev build: "Shareef Money (Dev)"  / com.shareef.money.dev
//
// android/ is gitignored and regenerated from this config, so after changing
// APP_VARIANT regenerate the native project before building:
//
//   # dev build (default) on your device
//   pnpm expo prebuild --clean
//   pnpm expo run:android
//
//   # production build
//   APP_VARIANT=production pnpm expo prebuild --clean      # (PowerShell: $env:APP_VARIANT='production')
//   APP_VARIANT=production pnpm expo run:android --variant release
//
// Each build bakes in EXPO_PUBLIC_API_URL from .env at build time — point the dev
// build at the dev backend and the prod build at the prod backend.
const IS_PROD = process.env.APP_VARIANT === "production";

module.exports = ({ config }) => ({
  ...config,
  name: IS_PROD ? "Shareef Money" : "Shareef Money (Dev)",
  android: {
    ...config.android,
    package: IS_PROD ? "com.shareef.money" : "com.shareef.money.dev",
  },
  extra: {
    ...config.extra,
    eas: {
      ...(config.extra && config.extra.eas),
      projectId: "d550f3d0-099f-404e-a1ff-e33e8bc28e27",
    },
  },
});
