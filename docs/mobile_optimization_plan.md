# Deep Research: App Size & Performance Optimization

Based on a thorough review of the codebase (package.json, app.json, eas.json, src folder), I have identified several key areas where we can significantly improve both the app size and performance for Android and iOS.

## 1. App Size Optimizations (Proposed Changes)

Currently, your Android `.aab` is around 72MB (from the screenshot), which is slightly large for an Expo app. We can reduce this.

### `app.json` Configuration

We need to explicitly enable R8 code shrinking and resource shrinking for Android.

- **Why**: This will strip out unused code from React Native, Expo modules, and your dependencies, and remove unused images/assets.
- **Action**: Add `expo-build-properties` to your `app.json` plugins.

```json
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "shrinkResources": true
    },
    "ios": {
      "useFrameworks": "static"
    }
  }
]
```

### Dependency Audit

- **Action**: Review heavy libraries. For example, `lucide-react-native` imports all SVGs if not configured properly, though standard bundlers usually tree-shake it.

---

## 2. Performance Optimizations (Proposed Changes)

### List Rendering (Crucial)

You are heavily using `FlatList` (in `search.tsx`, `account-detail.tsx`, etc.) and `ScrollView` for lists (in `category-list.tsx`, `contact-list.tsx`, etc.).

- **Why**: `FlatList` and `ScrollView` become massive memory hogs on Android when dealing with long lists (like transactions or contacts).
- **Action**: Replace `FlatList` and `ScrollView` with `@shopify/flash-list`. `FlashList` recycles views and performs 5x-10x faster on lower-end devices.

#### [MODIFY] `package.json`

- Install `@shopify/flash-list`

#### [MODIFY] `src/app/(app)/(screens)/search.tsx` (and other list files)

- Refactor `FlatList` to `FlashList` and provide `estimatedItemSize`.

### Animation Threading

- **Action**: Ensure all complex animations use `react-native-reanimated` instead of `Animated` from `react-native`. Reanimated runs animations on the UI thread, bypassing the slow JS bridge. I see it is installed in `package.json`, but we should ensure it's heavily utilized.

### React Compiler

- **Good News**: You already have `"reactCompiler": true` in your `app.json` experiments! This is fantastic and already doing a lot of heavy lifting to prevent unnecessary re-renders.

### New Architecture (Fabric)

- **Action**: Ensure the React Native New Architecture is enabled. Expo 56 does a good job of this by default, but we can explicitly enforce it in `expo-build-properties` to guarantee TurboModules and Fabric are used for maximum native performance.
