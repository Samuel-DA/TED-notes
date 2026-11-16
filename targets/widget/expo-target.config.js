/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "TedSpaceWidget",
  displayName: "TED Space",
  deploymentTarget: "17.0",
  colors: {
    $widgetBackground: { light: "#FFF5F8", dark: "#1A1020" },
    $accent: "#E0567A",
    gradientStart: "#E0567A",
    gradientEnd: "#6B3488",
  },
  entitlements: {
    "com.apple.security.application-groups": config.ios.entitlements["com.apple.security.application-groups"],
  },
});
