# Production Deployment Guide - ARA Voice Form

## ✅ Current Status

**EAS Account**: `aliaslabs` (logged in)
**EAS CLI**: Installed and configured
**Configuration Files**: Ready for deployment

---

## 📋 Pre-Deployment Checklist

### 1. API Keys and Credentials

- [ ] **Google Gemini API Key** (Required)
  - Get from: https://makersuite.google.com/app/apikey
  - Add to `.env`: `EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...`
  - ⚠️ Development only - use backend proxy for production

- [ ] **Sentry DSN** (Recommended for production)
  - Get from: https://sentry.io/
  - Add to `.env`: `EXPO_PUBLIC_SENTRY_DSN=https://...`

- [ ] **Backend API URL**
  - Development: `http://localhost:3000` (already set)
  - Staging: Update to your staging server URL
  - Production: Update to your production server URL

### 2. Apple Developer Account Setup

- [ ] **Enroll in Apple Developer Program** ($99/year)
  - Visit: https://developer.apple.com/programs/

- [ ] **Get Apple Team ID**
  ```bash
  # Find in Apple Developer Console > Membership
  # Format: 10 characters (e.g., ABCD123456)
  ```

- [ ] **Create App in App Store Connect**
  - Visit: https://appstoreconnect.apple.com/
  - Create new app
  - Get App Store Connect App ID (10 digits)

- [ ] **Update eas.json with Apple credentials**
  ```json
  "ios": {
    "appleId": "your-email@example.com",
    "ascAppId": "1234567890",
    "appleTeamId": "ABCD123456"
  }
  ```

### 3. Google Play Developer Account Setup

- [ ] **Enroll in Google Play Console** ($25 one-time)
  - Visit: https://play.google.com/console/signup

- [ ] **Create App in Play Console**
  - Create new app
  - Fill in app details

- [ ] **Generate Service Account Key**
  ```bash
  # 1. Go to Google Cloud Console
  # 2. Create service account
  # 3. Download JSON key file
  # 4. Save as: ./android-service-account.json
  ```

- [ ] **Grant Play Console Access**
  - Add service account email to Play Console
  - Grant "Release Manager" role

### 4. Backend Deployment

- [ ] **Deploy Gemini API Proxy**
  - See: `docs/BACKEND_PROXY_DEPLOYMENT.md`
  - Recommended: Vercel, AWS Lambda, or your existing backend

- [ ] **Set Backend Environment Variables**
  ```bash
  GEMINI_API_KEY=your_actual_gemini_api_key
  PORT=3000
  ```

- [ ] **Update app .env with backend URL**
  ```bash
  EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.com
  ```

- [ ] **Test Backend Proxy**
  ```bash
  curl -X POST https://your-backend.com/api/gemini-proxy \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test", "generationConfig": {}}'
  ```

---

## 🚀 Build and Submit Commands

### Development Build (Local Testing)

**iOS Simulator:**
```bash
eas build --profile development --platform ios
```

**Android Emulator:**
```bash
eas build --profile development --platform android
```

**Install on device:**
```bash
# iOS
eas build:run --profile development --platform ios

# Android
eas build:run --profile development --platform android
```

---

### Preview Build (Internal Testing)

**iOS (TestFlight Beta):**
```bash
# Build
eas build --profile preview --platform ios

# Submit to TestFlight
eas submit --profile preview --platform ios
```

**Android (Internal Testing Track):**
```bash
# Build
eas build --profile preview --platform android

# Submit to Play Console
eas submit --profile preview --platform android
```

---

### Production Build (App Store Release)

**Pre-production checklist:**
- [ ] All tests passing (`npm test`)
- [ ] Backend proxy deployed and tested
- [ ] Environment variables configured
- [ ] Sentry error monitoring enabled
- [ ] App icons and splash screens finalized
- [ ] Privacy policy and terms of service ready

**iOS (App Store):**
```bash
# Build
eas build --profile production --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

**Android (Google Play):**
```bash
# Build
eas build --profile production --platform android

# Submit to Play Console
eas submit --profile production --platform android
```

---

## 🔧 Configuration Updates

### Update eas.json Credentials

1. **Get Apple Developer credentials:**
   ```bash
   # Apple ID: Your developer account email
   # ASC App ID: From App Store Connect > App Information
   # Team ID: From developer.apple.com/account > Membership
   ```

2. **Update eas.json:**
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "developer@yourcompany.com",
         "ascAppId": "1234567890",
         "appleTeamId": "ABCD123456"
       }
     }
   }
   ```

3. **Create Android service account:**
   ```bash
   # Download from Google Cloud Console
   # Save as: android-service-account.json
   ```

---

## 🧪 Testing Strategy

### Development Testing
```bash
# 1. Build for simulator/emulator
eas build --profile development --platform ios

# 2. Install and test
eas build:run --profile development --platform ios

# 3. Test voice transcription
# 4. Test AI form filling
# 5. Verify Sentry error reporting
```

### Preview Testing (Beta)
```bash
# 1. Build and submit to TestFlight
eas build --profile preview --platform ios
eas submit --profile preview --platform ios

# 2. Invite beta testers
# 3. Collect feedback
# 4. Monitor Sentry for crashes
```

### Production Release
```bash
# 1. Final testing on preview build
# 2. Build production version
eas build --profile production --platform ios

# 3. Submit for App Store review
eas submit --profile production --platform ios

# 4. Monitor release metrics
```

---

## 📊 Monitoring and Analytics

### Sentry Error Tracking

**1. Set up Sentry project:**
```bash
# Install Sentry SDK (already installed)
npm install @sentry/react-native

# Get DSN from sentry.io
```

**2. Configure .env:**
```bash
EXPO_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

**3. Monitor errors:**
- Visit: https://sentry.io/organizations/[org]/issues/
- Set up alerts for critical errors
- Review crash reports daily

### API Usage Monitoring

**Track Gemini API usage:**
```typescript
// In backend proxy
console.log('[Gemini] Request:', {
  timestamp: new Date().toISOString(),
  promptLength: prompt.length,
  userId: req.headers['user-id'],
});
```

**Set up rate limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
```

---

## 🔒 Security Best Practices

### Production Security Checklist

- [ ] **API Keys**
  - ✅ Never commit API keys to git
  - ✅ Use environment variables
  - ✅ Rotate keys every 90 days
  - ✅ Use different keys per environment

- [ ] **Backend Security**
  - [ ] HTTPS enabled (SSL certificate)
  - [ ] CORS configured (allow only app domain)
  - [ ] Rate limiting enabled
  - [ ] Request validation implemented
  - [ ] Error messages sanitized (no stack traces)

- [ ] **App Security**
  - [ ] Code obfuscation enabled
  - [ ] SSL pinning considered
  - [ ] Jailbreak/root detection (if needed)
  - [ ] Secure storage for sensitive data

---

## 🚨 Troubleshooting

### Common Build Errors

**Error: "ENETUNREACH" or timeout**
```bash
# Solution: Check internet connection, retry
eas build --profile development --platform ios
```

**Error: "Apple ID authentication failed"**
```bash
# Solution: Update Apple credentials in eas.json
# Verify Apple ID, Team ID, and ASC App ID are correct
```

**Error: "Android service account key not found"**
```bash
# Solution: Download service account JSON from Google Cloud
# Save as: ./android-service-account.json
```

### Build Hanging or Slow

```bash
# Clear EAS cache
eas build:cancel

# Clean local cache
rm -rf node_modules
npm install

# Retry build
eas build --profile development --platform ios --clear-cache
```

---

## 📞 Support Resources

**EAS Documentation:**
- Builds: https://docs.expo.dev/build/introduction/
- Submit: https://docs.expo.dev/submit/introduction/
- Updates: https://docs.expo.dev/eas-update/introduction/

**Platform-Specific:**
- App Store Connect: https://appstoreconnect.apple.com/
- Google Play Console: https://play.google.com/console/
- Expo Forums: https://forums.expo.dev/

**Get Help:**
- Expo Discord: https://chat.expo.dev/
- Stack Overflow: https://stackoverflow.com/questions/tagged/expo

---

## ✅ Ready to Deploy?

### Quick Start (Development Build)

```bash
# 1. Update .env with API keys
nano .env

# 2. Build for iOS simulator
eas build --profile development --platform ios

# 3. Install on simulator
eas build:run --profile development --platform ios

# 4. Test the app
```

### Next Steps

1. Complete pre-deployment checklist above
2. Deploy backend proxy (see BACKEND_PROXY_DEPLOYMENT.md)
3. Run development build and test thoroughly
4. Create preview build for beta testing
5. Submit production build to App Store/Play Store

**Need help?** Check the troubleshooting section or Expo documentation linked above.
