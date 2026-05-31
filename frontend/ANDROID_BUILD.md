# ساخت APK اندروید برای Irannetwork

این نسخه از اپ اندروید به صورت **Online Shell** تنظیم شده است.
یعنی APK خودش فقط پوسته‌ی Capacitor/WebView است و پنل اصلی را از این آدرس باز می‌کند:

```text
https://app.iritjob.ir
```

بنابراین بعد از نصب APK، اگر فرانت‌اند یا بک‌اند را روی سرور آپدیت کنید، کاربر کافی است اپ را کامل ببندد و دوباره باز کند تا نسخه‌ی جدید پنل از سرور لود شود.

## چه چیزهایی بدون APK جدید آپدیت می‌شوند؟

- صفحات و فرم‌های جدید
- تغییرات UI
- حذف یا اضافه شدن بخش‌ها
- تغییرات API و دیتابیس
- دسترسی کاربران
- اتاق‌ها، رک‌ها، دستگاه‌ها، پورت‌ها و سیستم‌ها

## چه چیزهایی APK جدید می‌خواهند؟

- تغییر آیکن اپ
- تغییر نام اپ
- تغییر `appId`
- اضافه شدن permission اندروید
- قابلیت‌های native مثل دوربین، GPS، NFC، Push Notification
- تغییرات AndroidManifest یا تنظیمات Capacitor

## ساخت APK با GitHub Actions

فایل workflow آماده است:

```text
.github/workflows/android-build.yml
```

روش استفاده:

1. پروژه را روی GitHub push کنید.
2. وارد تب **Actions** شوید.
3. workflow با نام **Build Android APK** را اجرا کنید.
4. بعد از پایان build، APK از بخش **Artifacts** قابل دانلود است.

مسیر خروجی داخل workflow:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## ساخت APK روی سیستم خودتان

نیازمندی‌ها:

- Node.js 20+
- JDK 21
- Android Studio / Android SDK

دستورات:

```bash
cd frontend
npm install
npm run build
npx cap add android   # فقط بار اول، اگر پوشه android وجود ندارد
npx cap sync android
cd android
./gradlew assembleDebug
```

برای باز کردن پروژه در Android Studio:

```bash
cd frontend
npm run cap:open
```

## تنظیم دامنه

دامنه‌ی فعلی اپ در فایل زیر تنظیم شده:

```text
frontend/capacitor.config.ts
```

مقدار فعلی:

```ts
server: {
  url: "https://app.iritjob.ir",
  cleartext: false,
  androidScheme: "https"
}
```

اگر دامنه تغییر کرد، فقط همین مقدار را عوض کنید و APK جدید بسازید.

## نکته مهم درباره API

چون اپ پنل را از `https://app.iritjob.ir` باز می‌کند، درخواست‌های API داخل فرانت‌اند هم طبق تنظیمات خود سورس و سرور شما اجرا می‌شوند. اگر API روی پورت جدا مثل `8000` است، مطمئن شوید:

- از داخل سرور قابل دسترسی است.
- CORS برای دامنه `https://app.iritjob.ir` مجاز است.
- اگر API با `http://app.iritjob.ir:8000` صدا زده می‌شود، در اندروید `allowMixedContent` فعلاً روشن گذاشته شده تا WebView درخواست‌ها را بلاک نکند.

برای نسخه نهایی حرفه‌ای‌تر، بهتر است API را هم پشت HTTPS ببرید، مثلاً:

```text
https://app.iritjob.ir/api
```
