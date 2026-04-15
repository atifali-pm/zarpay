// Monorepo-aware Metro config for Expo SDK 54. Follows the pattern from
// https://docs.expo.dev/guides/monorepos/: tell Metro to watch the workspace
// root so edits to @zarpay/types refresh, and point nodeModulesPaths at both
// the local and workspace-root node_modules so packages resolve in the right
// order. Wrapped in withNativeWind for className support.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
});
