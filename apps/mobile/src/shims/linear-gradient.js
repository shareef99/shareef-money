// JS-only stub for `react-native-linear-gradient` / `expo-linear-gradient`.
//
// `react-native-gifted-charts` imports a gradient package at module-load time
// (BarChart -> RenderStackBars -> common/LinearGradient), and throws if neither
// is installed. We don't want the native `expo-linear-gradient` module (it would
// force a native rebuild) and we never enable gradient fills (`showGradient`),
// so this stub satisfies the import and renders a plain View if ever mounted.
// Metro aliases both gradient package names to this file (see metro.config.js).
const React = require("react");
const { View } = require("react-native");

function LinearGradient(props) {
  const rest = Object.assign({}, props);
  delete rest.colors;
  delete rest.start;
  delete rest.end;
  delete rest.locations;
  return React.createElement(View, rest, props && props.children);
}

module.exports = { LinearGradient, default: LinearGradient };
