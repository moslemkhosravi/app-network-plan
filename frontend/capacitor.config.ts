import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android app configuration.
 *
 * مدل اپ: Online Shell
 * APK فقط یک پوسته‌ی امن Capacitor/WebView است و پنل را از دامنه‌ی اصلی لود می‌کند.
 * بنابراین هر تغییری روی سرور/فرانت‌اند اعمال شود، با بستن و باز کردن اپ دیده می‌شود.
 */
const config: CapacitorConfig = {
  appId: "ir.iritjob.app",
  appName: "Iran Network",
  webDir: "dist/client",
  bundledWebRuntime: false,

  server: {
    url: "https://app.iritjob.ir",
    cleartext: false,
    androidScheme: "https",
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
      overlaysWebView: false,
    },
  },
};

export default config;
