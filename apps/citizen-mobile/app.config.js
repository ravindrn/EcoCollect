
const appJson = require("./app.json");

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,

  plugins: [
    ...(appJson.expo.plugins ?? []),
    "expo-font",
  ],

  android: {
    ...config.android,
    ...appJson.expo.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ??
      appJson.expo.android.googleServicesFile,
  },
});
