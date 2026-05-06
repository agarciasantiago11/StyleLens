const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Zustand v5 and some other packages ship ESM files (.mjs) that use import.meta,
// which Metro cannot handle in web mode. Disabling package exports forces Metro
// to resolve the CJS build instead (via the "main" field in package.json).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
