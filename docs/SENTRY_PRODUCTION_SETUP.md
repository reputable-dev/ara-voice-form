# Sentry Production Setup Guide

## Current Status ✅

Sentry is **fully configured** in the codebase with:
- ✅ SDK installed (`@sentry/react-native`)
- ✅ Initialization in `app/_layout.tsx`
- ✅ Security filtering (removes auth headers, API keys, cookies)
- ✅ Performance monitoring (10% sampling in production)
- ✅ Automatic breadcrumb tracking
- ✅ React Navigation integration
- ✅ Native crash reporting enabled

## What's Missing: Production DSN

The app requires `EXPO_PUBLIC_SENTRY_DSN` to be set in your **production environment**.

---

## Step-by-Step Production Setup

### 1. Create Sentry Project

**Option A: Using Existing Sentry Account**
```bash
# Go to: https://sentry.io/
1. Log in to your account
2. Click "Projects" → "Create Project"
3. Select "React Native" as the platform
4. Name: "ara-voice-form-production"
5. Copy the DSN (format: https://xxx@xxx.ingest.sentry.io/xxx)
```

**Option B: New Sentry Account**
```bash
1. Sign up at https://sentry.io/signup/
2. Select "React Native" as your platform
3. Follow the wizard to create your project
4. Copy the DSN from the setup page
```

### 2. Set Production Environment Variable

The production DSN must be set based on your deployment platform:

#### **Expo EAS Build** (Recommended for React Native)

Edit `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "https://your_actual_dsn@sentry.ingest.io/123456"
      }
    }
  }
}
```

Or use Expo secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://..."
```

#### **Vercel Deployment** (If deploying web version)

```bash
# Via CLI
vercel env add EXPO_PUBLIC_SENTRY_DSN production

# Or via Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add: EXPO_PUBLIC_SENTRY_DSN
3. Value: https://your_actual_dsn@sentry.ingest.io/123456
4. Environment: Production
```

#### **Other Platforms**

Set the environment variable according to your platform's documentation:
- **Netlify:** Environment variables in site settings
- **AWS Amplify:** Environment variables in app settings
- **Custom server:** Add to `.env.production` (never commit!)

### 3. Configure Release Tracking (Optional but Recommended)

Edit `lib/sentry.ts` (line 53):
```typescript
// Uncomment and update with your app version
release: 'ara-voice-form@1.0.0',
```

Or automate with package.json:
```typescript
import { version } from '../package.json';

Sentry.init({
  // ...
  release: `ara-voice-form@${version}`,
});
```

### 4. Set Up Environments in Sentry

Create separate environments for better tracking:

```bash
# In Sentry dashboard:
Settings → Environments → Add Environment
- development
- staging
- production
```

The code already handles this automatically:
```typescript
environment: __DEV__ ? 'development' : 'production',
```

### 5. Verify Production Setup

#### A. Test Error Reporting

Add a test error in production (remove after testing):
```typescript
// In any component
import { captureException } from '@/lib/sentry';

useEffect(() => {
  if (!__DEV__) {
    captureException(new Error('Sentry production test - DELETE ME'));
  }
}, []);
```

#### B. Check Sentry Dashboard

1. Deploy to production
2. Open the app
3. Go to https://sentry.io/
4. Navigate to your project
5. Check "Issues" tab - you should see the test error

#### C. Verify Breadcrumbs

Navigate through the app, trigger an error, and check that Sentry captured:
- Screen navigation history
- User interactions
- Network requests
- Console logs

### 6. Production Checklist

Before deploying to production, verify:

- [ ] Sentry DSN is set in production environment (NOT in code)
- [ ] DSN is different from development/staging (separate projects)
- [ ] `.env` file is in `.gitignore` (already done ✅)
- [ ] Error filtering is working (sensitive data removed)
- [ ] Performance sampling is configured (10% default)
- [ ] Release version is set for better tracking
- [ ] Alert rules are configured in Sentry dashboard
- [ ] Team members have access to Sentry project

---

## Current Configuration Details

### Security Filtering

The following sensitive data is **automatically removed** before sending to Sentry:

**From breadcrumbs:**
- `apiKey`
- `token`
- `authorization`

**From requests:**
- `authorization` header
- `cookie` header

**Environment:**
- Errors in development are NOT sent to Sentry (unless `EXPO_PUBLIC_SENTRY_DEBUG=true`)

### Performance Monitoring

- **Development:** 100% of transactions traced
- **Production:** 10% of transactions traced (configurable)

### Automatic Tracking

- ✅ Screen navigation (React Navigation)
- ✅ User interactions (touches, swipes)
- ✅ Network requests (breadcrumbs)
- ✅ Console errors and warnings
- ✅ Native crashes (iOS/Android)

---

## Usage Examples

### Capture Custom Errors

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

// Capture an error with context
try {
  await submitForm(data);
} catch (error) {
  captureException(error, {
    formData: { ...data, password: '[REDACTED]' },
    userId: currentUser.id,
  });
}

// Log a message (non-error)
captureMessage('User completed onboarding', 'info');

// Add breadcrumb for debugging
addBreadcrumb('Form validation started', 'user', {
  fieldCount: 5,
  formType: 'contract',
});
```

### Set User Context (After Login)

```typescript
import { setUser } from '@/lib/sentry';

// After successful authentication
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// On logout
setUser(null);
```

### Add Custom Tags

```typescript
import { setTags, setExtras } from '@/lib/sentry';

// Add tags for filtering in Sentry
setTags({
  userRole: 'admin',
  organizationId: 'org-123',
  feature: 'voice-forms',
});

// Add extra context
setExtras({
  lastFormId: formId,
  apiVersion: '2.0',
});
```

---

## Sentry Dashboard Configuration

### Recommended Alert Rules

1. **High Volume Errors**
   - Condition: More than 100 errors in 1 hour
   - Action: Email team@yourdomain.com

2. **New Issues**
   - Condition: New issue appears
   - Action: Slack #alerts channel

3. **Critical Errors**
   - Condition: Error with tag `severity:critical`
   - Action: PagerDuty alert

### Performance Monitoring

Enable these in Sentry dashboard:
- Transaction samples
- Web Vitals (if using web)
- Custom instrumentation for API calls

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check 1:** Verify DSN is set
```bash
# In your production environment, check:
echo $EXPO_PUBLIC_SENTRY_DSN
```

**Check 2:** Check console logs
```
Look for: "[Sentry] Initialized in production mode"
```

**Check 3:** Verify environment
```typescript
// Sentry only sends in production by default
console.log('__DEV__:', __DEV__); // Should be false
```

**Check 4:** Check Sentry dashboard filters
- Environment: production
- Time range: Last 24 hours
- Project: ara-voice-form-production

### Too Many Errors

**Increase beforeSend filtering:**
```typescript
// In lib/sentry.ts
beforeSend(event, hint) {
  // Ignore specific errors
  if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
    return null; // Don't send
  }

  return event;
}
```

**Reduce sample rate:**
```typescript
tracesSampleRate: 0.05, // 5% of transactions
```

### Sensitive Data Leaking

**Add more filters in `beforeSend`:**
```typescript
// Remove specific fields
if (event.contexts?.custom) {
  delete event.contexts.custom.password;
  delete event.contexts.custom.creditCard;
}
```

---

## Cost Optimization

Sentry pricing is based on:
- Number of errors
- Number of transactions (performance monitoring)
- Data retention period

**Free tier limits:**
- 5,000 errors/month
- 10,000 transactions/month
- 30-day retention

**Optimization tips:**
1. Use appropriate sample rates (10% default)
2. Filter out noisy errors in `beforeSend`
3. Use separate projects for dev/staging/prod
4. Archive old issues regularly
5. Consider upgrading if you need more capacity

---

## Security Best Practices

✅ **Already Implemented:**
- DSN loaded from environment (not hardcoded)
- Sensitive headers removed before sending
- API keys filtered from breadcrumbs
- Development errors not sent by default

⚠️ **Additional Recommendations:**
- Rotate Sentry auth tokens periodically
- Limit team member access to need-to-know
- Use Sentry's IP allowlist for API access
- Enable 2FA for Sentry account
- Review error data before sharing externally

---

## Next Steps

1. **Get DSN:** Create Sentry project → Copy DSN
2. **Set env var:** Add to production deployment
3. **Deploy:** Push to production
4. **Verify:** Check Sentry dashboard for errors
5. **Configure alerts:** Set up team notifications
6. **Monitor:** Review issues weekly

**Estimated setup time:** 15-30 minutes

---

**Last updated:** 2025-01-22
**Maintainer:** Development Team
**Sentry version:** @sentry/react-native ^5.x
