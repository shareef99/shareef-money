const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");

// react-native-gifted-charts imports a gradient package at load time and throws
// if none is installed. We don't use gradient fills and don't want the native
// expo-linear-gradient (it would force a native rebuild), so alias both gradient
// package names to a JS-only View stub.
const gradientShim = path.resolve(__dirname, "src/shims/linear-gradient.js");
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react-native-linear-gradient" ||
    moduleName === "expo-linear-gradient"
  ) {
    return { type: "sourceFile", filePath: gradientShim };
  }
  const resolver = defaultResolveRequest ?? context.resolveRequest;
  return resolver(context, moduleName, platform);
};

module.exports = withNativewind(config);
