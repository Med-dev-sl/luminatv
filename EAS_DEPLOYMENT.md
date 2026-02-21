# EAS Deployment Guide - React Native

Deploy your React Native app to iOS and Android stores using Expo Application Services (EAS).

## Prerequisites

- EAS CLI: `npm install -g eas-cli@latest`
- Expo account: Sign up at https://expo.dev (free tier available)
- Apple Developer account (for iOS, $99/year)
- Google Play Developer account (for Android, one-time $25)
- Git repository with your code (already done ✓)

## Step 1: Install and Login to EAS

```bash
# Install EAS CLI
npm install -g eas-cli@latest

# Login to your Expo account
eas login
# Follow the prompts to sign in (or create a new account)

# Verify login
eas whoami
```

## Step 2: Initialize Your Project for EAS

```bash
cd /path/to/luminatv

# Initialize EAS project
eas build:configure

# This creates eas.json (already done ✓)
```

## Step 3: Build for iOS

### 3a. Setup Apple Developer Account

1. Go to https://developer.apple.com
2. Sign in or create an Apple ID
3. Enroll in Apple Developer Program ($99/year)
4. Create an App ID in App Store Connect

### 3b. Build for iOS Internal Testing

```bash
# Internal testing build (easiest, no store submission)
eas build --platform ios --profile preview

# Output: Download the .ipa file for iOS device testing
# Or use with Testflight (test with up to 100 beta testers)
```

### 3c: Build for iOS App Store (Production)

```bash
# Production build for App Store
eas build --platform ios --profile production

# After build completes, configure signing:
# 1. Go to https://expo.dev → Your Project → Credentials
# 2. Create Apple Team ID credential
# 3. Set App Store Connect team

# Then submit to App Store:
eas submit --platform ios --latest
```

---

## Step 4: Build for Android

### 4a. Setup Google Play Account

1. Go to https://play.google.com/console
2. Create a Google Play Developer account ($25 one-time)
3. Create an app in Google Play Console

### 4b. Generate Android Signing Key

```bash
# First time only: Create a signing key
eas build --platform android --profile preview

# EAS will prompt you to:
# 1. Create a new keystore (or provide existing)
# 2. Store credentials securely

# Say YES to "Generate new private signing key"
```

### 4c. Build for Android Internal Testing

```bash
# Internal testing build (fastest)
eas build --platform android --profile preview

# Output: Download the .apk file for immediate testing
# Or use the provided test link (valid for 7 days)
```

### 4d. Build for Android Play Store (Production)

```bash
# Production build for Google Play
eas build --platform android --profile production

# After build completes:
eas submit --platform android --latest
```

---

## Step 5: Set Environment Variables for Production

Before building, configure your backend URL and Sentry DSN:

### Option A: Via Environment Variables

```bash
# Set backend API URL
export EXPO_PUBLIC_API_URL=https://luminatv-backend.onrender.com

# Set Sentry DSN (optional, for error tracking)
export EXPO_PUBLIC_SENTRY_DSN=https://your-key@ingest.sentry.io/your-project-id

# Build
eas build --platform ios --profile production
```

### Option B: Via eas.json

Edit `eas.json`:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://luminatv-backend.onrender.com",
        "EXPO_PUBLIC_SENTRY_DSN": "https://your-key@ingest.sentry.io/your-project-id"
      }
    }
  }
}
```

### Option C: Via Expo Dashboard

1. Go to https://expo.dev → Your Project → Secrets
2. Add environment variables there
3. They'll be automatically injected during builds

---

## Step 6: Submit to App Stores

### iOS App Store Submission

```bash
# Automatic submission (recommended)
eas submit --platform ios --latest

# Follow prompts for Apple ID validation

# Or manual submission to App Store Connect dashboard
# 1. Wait for build to complete
2. Go to https://appstoreconnect.apple.com
3. Create new App version
4. Upload build manually
```

### Android Google Play Submission

```bash
# Automatic submission (easiest)
eas submit --platform android --latest

# Follow prompts to connect Google Play account

# After submission:
# 1. Internal testing track (immediate, testers only)
2. Closed testing track (1-7 days review)
3. Production track (7-14 days review, public release)
```

---

## Step 7: Testing Before Production

### Test iOS Build

```bash
# Build for internal testing
eas build --platform ios --profile preview

# Use Testflight:
# 1. Download .ipa from EAS dashboard
# 2. Go to App Store Connect → TestFlight
# 3. Add testers' Apple IDs
# 4. They download from TestFlight app
```

### Test Android Build

```bash
# Build for internal testing
eas build --platform android --profile preview

# Option A: Direct APK download
# 1. Download APK from EAS dashboard
# 2. Send to testers
# 3. Enable "Install from unknown sources" on their device
# 4. Install .apk file

# Option B: Internal Testing Track
# 1. Submit to Google Play Console
# 2. Internal testing track (immediate access)
# 3. Share link with testers
```

---

## Step 8: Monitor and Update

### View Build Status

```bash
# List all builds
eas build:list

# View specific build details
eas build:view <BUILD_ID>

# Download artifact
eas build:download <BUILD_ID>
```

### Update Your App

```bash
# Make code changes
git add .
git commit -m "Update app version"
git push origin main

# New build (version auto-incremented)
eas build --platform ios,android --profile production
```

### Version Management

Update `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "build": {
      "production": {
        "ios": {
          "buildNumber": "2"
        },
        "android": {
          "versionCode": 2
        }
      }
    }
  }
}
```

---

## Environment Variables Reference

Your app uses these env vars:

```
EXPO_PUBLIC_API_URL          → Backend URL (Django on Render)
EXPO_PUBLIC_SUPABASE_URL     → Supabase (if using auth)
EXPO_PUBLIC_SUPABASE_KEY     → Supabase anon key
EXPO_PUBLIC_SENTRY_DSN       → Error tracking (optional)
```

Set these in:
1. `.env.local` (local dev)
2. `eas.json` (build-time, secure)
3. Expo Dashboard → Secrets (recommended for production)

---

## Troubleshooting

### Build Failed: "Credentials not found"

**Cause**: EAS doesn't have signing credentials for your app

**Solution**:
```bash
# Regenerate credentials
eas credentials

# Select iOS or Android
# Follow prompts to create signing key
```

### Build Timeout

**Cause**: Build queue is slow

**Solution**:
- Wait 5-10 minutes and check status in Expo Dashboard
- Priority queue available with Expo paid plan

### App Crashes on Startup

**Cause**: Backend API URL incorrect or backend not running

**Solution**:
1. Check `EXPO_PUBLIC_API_URL` is set correctly
2. Verify backend is live: `curl https://luminatv-backend.onrender.com/health/`
3. Use test screen to debug API calls

### "Unable to resolve module" Error

**Cause**: Missing dependency

**Solution**:
```bash
# Ensure all dependencies installed locally first
npm install

# Then rebuild
eas build --platform ios,android --profile preview
```

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| EAS Builds (free) | $0 | 30 min/month free, then $0.50/min |
| EAS Priority Builds | $99/mo | Faster builds, recommended for production |
| Apple Developer | $99/year | Required for iOS App Store |
| Google Play | $25 | One-time fee for Android Play Store |
| Expo Dashboard | Free | Basic monitoring and management |

**Recommendation**: Start with free EAS tier, upgrade to priority builds when publishing to App Stores.

---

## Quick Commands Reference

```bash
# Login
eas login

# First time setup
eas build:configure

# Build preview (internal testing)
eas build --platform ios,android --profile preview

# Build production
eas build --platform ios,android --profile production

# Submit to stores
eas submit --platform ios,android --latest

# View build status
eas build:list

# Download build
eas build:download <BUILD_ID>

# Update credentials
eas credentials
```

---

## Next Steps

### Before First Build

1. ✅ Set `EXPO_PUBLIC_API_URL` to your Django backend URL
2. ✅ Test with preview build on your device
3. ✅ Verify test-screen.tsx shows ✅ for all API tests
4. ✅ Sign up for Apple Developer account (iOS)
5. ✅ Sign up for Google Play Developer account (Android)

### For Production Release

1. Update version in `app.json`
2. Build for production: `eas build --platform ios,android --profile production`
3. Submit: `eas submit --platform ios,android --latest`
4. Monitor App Store/Play Store review (7-14 days)
5. Release to production once approved

### Optional Enhancements

- Enable Sentry for crash reporting: Set `EXPO_PUBLIC_SENTRY_DSN`
- Configure push notifications (Firebase Cloud Messaging)
- Add in-app updates (expo-updates)
- Analytics tracking

---

## References

- [EAS Documentation](https://docs.expo.dev/eas/)
- [EAS Build](https://docs.expo.dev/build/)
- [EAS Submit](https://docs.expo.dev/submit/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)
