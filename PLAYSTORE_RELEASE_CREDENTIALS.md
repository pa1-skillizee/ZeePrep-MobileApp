# ZeePrep — Google Play Store Release & Keystore Credentials

> **CONFIDENTIAL & SECURE DOCUMENTATION**
> Keep this file and the `.keystore` file backed up in a secure offline drive. Google Play requires this key for all future updates.

---

## 🔑 1. Android Release Keystore Details

| Parameter | Value |
|---|---|
| **Keystore Filename** | `my-release-key.keystore` |
| **Keystore Alias** | `my-key-alias` |
| **Keystore Password** | `Chirag@101` |
| **Key Password** | `Chirag@101` |
| **Key Algorithm** | RSA 2048-bit |
| **Validity** | 10,000 Days |
| **Package Name (Application ID)** | `com.skillizee.zeeprep` |

---

## 📱 2. App Release Information

| Property | Value |
|---|---|
| **App Name** | ZeePrep |
| **Organization** | Skillizee |
| **Target Version** | `1.0.0` |
| **Version Code** | `1` |
| **Target SDK** | Android 14 / 15 (API 34/35) |
| **Release Output Type** | Android App Bundle (`.aab`) |

---

## 🛠️ 3. How to Build the Play Store Bundle (`.aab`)

To compile and package the release bundle for Google Play Console:

```bash
# 1. Navigate to android directory
cd android

# 2. Build signed release bundle
gradlew.bat bundleRelease
```

The generated file will be located at:
📁 `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📋 4. Google Play Console Upload Steps

1. Log in to [Google Play Console](https://play.google.com/console).
2. Select your app: **ZeePrep (`com.skillizee.zeeprep`)**.
3. Go to **Release** > **Production** (or **Internal Testing** / **Closed Testing**).
4. Click **Create new release**.
5. Upload the **`app-release.aab`** file.
6. Enter Release notes: e.g., *"Initial release of ZeePrep Smart Learning & CBT Examination Platform."*
7. Review and rollout!
