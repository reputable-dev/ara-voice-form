# Comprehensive Deployment Workflow Analysis
## ARA Voice Form - Ask ARA Knowledge Assistant

**Generated:** November 22, 2025
**Project:** Expo React Native Mobile App
**Repository:** https://github.com/danmarauda/rork-ask-ara---knowledge-assistant

---

## Executive Summary

### Current Deployment Status

| Platform | Configuration | Status | Readiness |
|----------|--------------|--------|-----------|
| **EAS (Expo Application Services)** | ❌ Not Configured | Missing | 🔴 Not Ready |
| **GitLab CI/CD** | ❌ Not Configured | Missing | 🔴 Not Ready |
| **GitHub Actions** | ✅ Partial | Active | 🟡 Partially Ready |
| **Vercel** | ❌ Not Configured | Missing | 🔴 Not Ready |

### Key Findings

1. **No EAS Configuration**: Missing `eas.json` - cannot build or deploy mobile apps to app stores
2. **No GitLab CI/CD**: Despite having a GitLab remote, no `.gitlab-ci.yml` exists
3. **Basic GitHub Actions**: Only CI/CD for testing and quality checks, no deployment automation
4. **Environment Variables**: Good `.env.example` template exists, but no deployment environment configs
5. **Security Posture**: Strong PR checks for secrets, but no automated deployment security scanning

---

## 1. EAS (Expo Application Services) Analysis

### Current Status: ❌ NOT CONFIGURED

**Critical Missing Configuration:** `eas.json`

### What's Missing

```json
// REQUIRED: /Users/alias/Documents/ARA/ara-voice-form/eas.json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "https://staging-api.yourdomain.com",
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN_STAGING"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "https://api.yourdomain.com",
        "EXPO_PUBLIC_GEMINI_API_KEY": "$GEMINI_API_KEY_PROD",
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN_PROD"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### Build Profile Recommendations

#### Development Profile
**Purpose:** Local testing and development builds

- **Use Case:** Testing on physical devices during development
- **Distribution:** Internal only
- **Features:**
  - Development client enabled
  - Fast refresh and debugging tools
  - iOS Simulator support
  - Local environment variables

**Build Command:**
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Preview Profile
**Purpose:** Staging/QA testing before production

- **Use Case:** Pre-release testing, client reviews, beta testing
- **Distribution:** Internal distribution (TestFlight, Firebase App Distribution)
- **Features:**
  - Production-like configuration
  - Staging API endpoints
  - Separate Sentry DSN for staging errors
  - Code signing for distribution

**Build Command:**
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

#### Production Profile
**Purpose:** App Store and Google Play releases

- **Use Case:** Public releases to app stores
- **Distribution:** App Store / Google Play
- **Features:**
  - Full optimization and minification
  - Production API endpoints
  - Production error monitoring
  - Release code signing
  - Automatic version bumping

**Build Command:**
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit Configuration

#### iOS Submit Requirements

**Prerequisites:**
1. **Apple Developer Account** ($99/year)
   - Enrollment URL: https://developer.apple.com/programs/enroll/
2. **App Store Connect App ID**
   - Create at: https://appstoreconnect.apple.com/
3. **Bundle Identifier:** `app.rork.ask-ara-knowledge-assistant`
4. **Certificates & Provisioning Profiles**
   - EAS handles automatically with Apple ID authentication

**Required Information:**
```bash
# Store these in EAS Secrets (encrypted)
APPLE_ID=your-email@example.com
APPLE_TEAM_ID=XXXXXXXXXX
ASC_APP_ID=1234567890  # From App Store Connect
```

**Submit Command:**
```bash
eas submit --platform ios --profile production
```

#### Android Submit Requirements

**Prerequisites:**
1. **Google Play Console Account** ($25 one-time fee)
   - Create at: https://play.google.com/console/signup
2. **Package Name:** `app.rork.ask-ara-knowledge-assistant`
3. **Service Account Key** for API access
   - Create at: Google Cloud Console → IAM & Admin → Service Accounts
4. **App Signing Key**
   - Google Play App Signing (recommended) or manual keystore

**Required Information:**
```bash
# Create Google Service Account JSON
# Store path in eas.json or upload to EAS Secrets
SERVICE_ACCOUNT_KEY_PATH=./secrets/google-service-account.json
```

**Submit Command:**
```bash
eas submit --platform android --profile production
```

### EAS Update Configuration

**Purpose:** Over-the-air updates for JavaScript/React Native code without app store review

```json
// Add to eas.json
{
  "update": {
    "development": {
      "channel": "development"
    },
    "preview": {
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

**Publish Updates:**
```bash
# Publish to production channel
eas update --branch production --message "Fixed critical bug"

# Automatic updates for specific builds
eas update:configure
```

### Credentials Management

**EAS handles credentials securely:**

1. **iOS Certificates**
   - Distribution Certificate
   - Push Notification Certificate
   - Provisioning Profiles

2. **Android Keystore**
   - Upload Keystore (for Google Play App Signing)
   - Service Account Key

**Credentials Commands:**
```bash
# View current credentials
eas credentials

# Sync credentials with Apple/Google
eas credentials:sync
```

### Environment Variables & Secrets

**Store sensitive values in EAS Secrets (encrypted at rest):**

```bash
# Set secrets for builds
eas secret:create --name GEMINI_API_KEY_PROD --value "your-key-here" --type string
eas secret:create --name SENTRY_DSN_PROD --value "your-dsn-here" --type string

# List secrets
eas secret:list

# Delete secrets
eas secret:delete --name GEMINI_API_KEY_PROD
```

### Recommended EAS Workflow

```bash
# 1. Initial setup
eas login
eas build:configure

# 2. Development builds (test on device)
eas build --profile development --platform ios --local  # Build locally
eas build --profile development --platform all  # Build on EAS cloud

# 3. Preview builds (staging/QA)
eas build --profile preview --platform all
eas submit --platform ios --profile preview --latest  # TestFlight

# 4. Production builds
eas build --profile production --platform all

# 5. Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production

# 6. Monitor build status
eas build:list
eas build:view <build-id>
```

### Cost Considerations

| Tier | Price | Builds/Month | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 30 builds | Basic features, community support |
| **Developer** | $29/month | Unlimited | Priority builds, 2 seats, email support |
| **Team** | $99/month | Unlimited | 5 seats, faster builds, webhooks |
| **Enterprise** | Custom | Unlimited | Custom SLA, dedicated support |

**Recommendations:**
- Start with **Free tier** for initial development and testing
- Upgrade to **Developer tier** ($29/month) once ready for production releases
- Consider **Team tier** if building frequently or collaborating

### Security Best Practices

1. **Never commit credentials to git**
   - Use EAS Secrets for sensitive values
   - Keep `.env` files in `.gitignore` (already done ✅)

2. **Use different API keys per environment**
   - Development: Separate test API keys
   - Preview: Staging API keys
   - Production: Production API keys

3. **Enable two-factor authentication**
   - Apple ID: Required for App Store Connect
   - Google Account: Required for Play Console
   - EAS Account: Highly recommended

4. **Rotate credentials regularly**
   - Service account keys: Every 90 days
   - API keys: After any suspected compromise
   - Certificates: Before expiration

5. **Monitor build logs for secrets**
   - EAS automatically redacts secrets in logs
   - Verify no hardcoded keys in source

---

## 2. GitLab CI/CD Analysis

### Current Status: ❌ NOT CONFIGURED

**Critical Missing Configuration:** `.gitlab-ci.yml`

### GitLab Remote Detected

```
gitlab	git@gitlab.com:aliaslabs/ara-voice-form.git (fetch)
gitlab	git@gitlab.com:aliaslabs/ara-voice-form.git (push)
```

**Issue:** GitLab remote exists but no CI/CD pipeline configured

### Recommended GitLab CI/CD Pipeline

```yaml
# SUGGESTED: /Users/alias/Documents/ARA/ara-voice-form/.gitlab-ci.yml

image: node:20-buster

stages:
  - install
  - test
  - build
  - deploy

variables:
  BUN_VERSION: "1.3.0"
  EXPO_CLI_VERSION: "latest"

# Cache dependencies
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - ~/.bun/

before_script:
  # Install Bun
  - curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
  - export PATH="$HOME/.bun/bin:$PATH"
  - bun --version

# Install dependencies
install:
  stage: install
  script:
    - bun install --frozen-lockfile
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour
  only:
    - branches
    - merge_requests

# Lint and type check
lint:
  stage: test
  dependencies:
    - install
  script:
    - bun run lint
    - bun x tsc --noEmit
  only:
    - branches
    - merge_requests

# Run tests
test:
  stage: test
  dependencies:
    - install
  script:
    - bun run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 7 days
  only:
    - branches
    - merge_requests

# Security audit
security:
  stage: test
  dependencies:
    - install
  script:
    - bun audit
    - bun outdated
  allow_failure: true
  only:
    - branches
    - merge_requests

# Secret scanning
secret-scan:
  stage: test
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog filesystem . --only-verified --fail
  allow_failure: true
  only:
    - merge_requests

# Build preview (EAS)
build:preview:
  stage: build
  dependencies:
    - install
  script:
    - bun install -g @expo/eas-cli
    - eas login --non-interactive
    - eas build --profile preview --platform all --non-interactive
  only:
    - develop
    - merge_requests
  when: manual
  environment:
    name: preview
    url: https://expo.dev/accounts/$EXPO_ACCOUNT/projects/$EXPO_PROJECT

# Build production (EAS)
build:production:
  stage: build
  dependencies:
    - install
  script:
    - bun install -g @expo/eas-cli
    - eas login --non-interactive
    - eas build --profile production --platform all --non-interactive
  only:
    - main
  when: manual
  environment:
    name: production
    url: https://expo.dev/accounts/$EXPO_ACCOUNT/projects/$EXPO_PROJECT

# Deploy to TestFlight (iOS Preview)
deploy:testflight:
  stage: deploy
  dependencies:
    - build:preview
  script:
    - bun install -g @expo/eas-cli
    - eas submit --platform ios --profile preview --latest --non-interactive
  only:
    - develop
  when: manual
  environment:
    name: testflight-preview
    url: https://testflight.apple.com

# Deploy to App Store (iOS Production)
deploy:appstore:
  stage: deploy
  dependencies:
    - build:production
  script:
    - bun install -g @expo/eas-cli
    - eas submit --platform ios --profile production --latest --non-interactive
  only:
    - main
  when: manual
  environment:
    name: appstore-production
    url: https://appstoreconnect.apple.com

# Deploy to Google Play (Android Production)
deploy:googleplay:
  stage: deploy
  dependencies:
    - build:production
  script:
    - bun install -g @expo/eas-cli
    - eas submit --platform android --profile production --latest --non-interactive
  only:
    - main
  when: manual
  environment:
    name: googleplay-production
    url: https://play.google.com/console
```

### GitLab CI/CD Variables (Required)

Configure these in GitLab Settings → CI/CD → Variables:

| Variable | Type | Protected | Masked | Value |
|----------|------|-----------|--------|-------|
| `EXPO_TOKEN` | Variable | ✅ | ✅ | Your EAS token from `eas login` |
| `EXPO_ACCOUNT` | Variable | ❌ | ❌ | Your Expo account name |
| `EXPO_PROJECT` | Variable | ❌ | ❌ | `ask-ara-knowledge-assistant` |
| `GEMINI_API_KEY_PROD` | Variable | ✅ | ✅ | Production Gemini API key |
| `GEMINI_API_KEY_STAGING` | Variable | ✅ | ✅ | Staging Gemini API key |
| `SENTRY_DSN_PROD` | Variable | ✅ | ✅ | Production Sentry DSN |
| `SENTRY_DSN_STAGING` | Variable | ✅ | ✅ | Staging Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Variable | ✅ | ✅ | Sentry auth token for source maps |

### GitLab Pipeline Features

**Advantages over GitHub Actions:**

1. **Built-in Docker Registry**
   - Store build artifacts and custom images
   - No external registry needed

2. **Unlimited CI/CD Minutes (Self-hosted runners)**
   - Free unlimited builds on your own infrastructure
   - No monthly minute limits

3. **Advanced Merge Request Approvals**
   - Code review enforcement
   - Security scan approval gates

4. **Protected Environments**
   - Manual approval for production deployments
   - Environment-specific secrets

5. **Container Scanning & Dependency Scanning**
   - Built-in security scanners
   - Auto-remediation suggestions

### Recommended Branch Strategy

```
main (production)
  ├── develop (staging)
  │   ├── feature/voice-editing
  │   ├── feature/ai-context
  │   └── fix/audio-permissions
  └── hotfix/critical-bug
```

**Pipeline Behavior:**
- **Feature branches → develop:** Run tests, lint, security scans
- **Develop:** Deploy to preview/staging (manual approval)
- **Main:** Deploy to production (manual approval + security scan)

---

## 3. GitHub Actions Analysis

### Current Status: ✅ PARTIAL (CI Only, No Deployment)

**Existing Workflows:**

1. **`.github/workflows/ci.yml`** - Continuous Integration
2. **`.github/workflows/pr-checks.yml`** - Pull Request Quality Gates

### Current CI Workflow Analysis

#### Strengths ✅

1. **Comprehensive Testing**
   - Lint, type check, and unit tests
   - Coverage reporting to Codecov
   - Security audit with `bun audit`

2. **PR Quality Gates**
   - Secret detection (Google API keys)
   - Environment variable verification
   - Test coverage reporting
   - Dependency review

3. **Modern Tooling**
   - Bun for fast installs (5.6x faster than npm)
   - TypeScript strict mode
   - Automated coverage comments on PRs

#### Weaknesses ❌

1. **No Deployment Automation**
   - No EAS build triggers
   - No app store submission workflow
   - No staging/production environments

2. **Limited Error Handling**
   - `continue-on-error: true` on lint and security audit
   - May hide critical issues

3. **No Performance Monitoring**
   - No bundle size tracking over time
   - No performance regression tests

4. **Missing Release Automation**
   - No semantic versioning
   - No changelog generation
   - No automated release notes

### Recommended GitHub Actions Enhancements

```yaml
# SUGGESTED: /Users/alias/Documents/ARA/ara-voice-form/.github/workflows/deploy-preview.yml

name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

jobs:
  build-preview:
    name: Build Preview on EAS
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'deploy-preview')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build preview app
        run: |
          eas build --profile preview --platform all --non-interactive --no-wait
        env:
          EXPO_PUBLIC_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY_STAGING }}
          EXPO_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN_STAGING }}

      - name: Comment PR with build link
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview build started! Check status at https://expo.dev/accounts/${{ secrets.EXPO_ACCOUNT }}/projects/ask-ara-knowledge-assistant/builds'
            })
```

```yaml
# SUGGESTED: /Users/alias/Documents/ARA/ara-voice-form/.github/workflows/deploy-production.yml

name: Deploy Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Trivy security scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/react

  build-production:
    name: Build Production
    runs-on: ubuntu-latest
    needs: security-scan

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests
        run: bun run test:ci

      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build production apps
        run: |
          eas build --profile production --platform ios --non-interactive
          eas build --profile production --platform android --non-interactive
        env:
          EXPO_PUBLIC_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY_PROD }}
          EXPO_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN_PROD }}

      - name: Upload source maps to Sentry
        run: |
          bunx @sentry/cli releases files ${{ github.sha }} upload-sourcemaps ./dist --rewrite
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ask-ara-knowledge-assistant

  submit-ios:
    name: Submit to App Store
    runs-on: ubuntu-latest
    needs: build-production
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production-ios
      url: https://appstoreconnect.apple.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to App Store
        run: eas submit --platform ios --profile production --latest --non-interactive

  submit-android:
    name: Submit to Google Play
    runs-on: ubuntu-latest
    needs: build-production
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production-android
      url: https://play.google.com/console

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to Google Play
        run: eas submit --platform android --profile production --latest --non-interactive

  create-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [submit-ios, submit-android]
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4.3.1
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
```

### Required GitHub Secrets

Configure in Repository Settings → Secrets and variables → Actions:

| Secret Name | Value | Usage |
|-------------|-------|-------|
| `EXPO_TOKEN` | EAS authentication token | Build and submit apps |
| `EXPO_ACCOUNT` | Expo account name | Identify project |
| `GEMINI_API_KEY_PROD` | Production Gemini API key | App functionality |
| `GEMINI_API_KEY_STAGING` | Staging Gemini API key | Preview builds |
| `SENTRY_DSN_PROD` | Production Sentry DSN | Error monitoring |
| `SENTRY_DSN_STAGING` | Staging Sentry DSN | Preview error monitoring |
| `SENTRY_AUTH_TOKEN` | Sentry authentication token | Upload source maps |
| `SENTRY_ORG` | Sentry organization slug | Source map uploads |

### GitHub Environments

Create protected environments in Settings → Environments:

1. **production-ios**
   - Required reviewers: 1+ team members
   - Deployment branch: `main` only
   - Environment secrets: iOS-specific values

2. **production-android**
   - Required reviewers: 1+ team members
   - Deployment branch: `main` only
   - Environment secrets: Android-specific values

3. **preview**
   - Auto-deploy on PR with label
   - No reviewers required
   - Staging environment variables

---

## 4. Vercel Deployment Analysis

### Current Status: ❌ NOT CONFIGURED

**Note:** This is primarily a **native mobile app** built with Expo/React Native. Vercel deployment is **optional** and only relevant if:

1. You want to deploy a **web version** of the app
2. You need a **marketing/landing page**
3. You want to host **documentation**

### Mobile App + Web Deployment Strategy

**Recommended Approach:**

- **Primary:** Deploy mobile apps via EAS to App Store and Google Play
- **Secondary (Optional):** Deploy web version to Vercel for browser access

### Web Deployment Configuration

```json
// OPTIONAL: /Users/alias/Documents/ARA/ara-voice-form/vercel.json
{
  "buildCommand": "bun run build:web",
  "devCommand": "bun run start-web",
  "outputDirectory": "dist",
  "framework": "react",
  "installCommand": "bun install",
  "regions": ["iad1"],
  "env": {
    "EXPO_PUBLIC_RORK_API_BASE_URL": "@rork-api-base-url",
    "EXPO_PUBLIC_GEMINI_API_KEY": "@gemini-api-key",
    "EXPO_PUBLIC_SENTRY_DSN": "@sentry-dsn"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Vercel Environment Variables

**Production:**
- `EXPO_PUBLIC_RORK_API_BASE_URL` → Production API URL
- `EXPO_PUBLIC_GEMINI_API_KEY` → Production Gemini key
- `EXPO_PUBLIC_SENTRY_DSN` → Production Sentry DSN

**Preview (Staging):**
- `EXPO_PUBLIC_RORK_API_BASE_URL` → Staging API URL
- `EXPO_PUBLIC_GEMINI_API_KEY` → Staging Gemini key
- `EXPO_PUBLIC_SENTRY_DSN` → Staging Sentry DSN

### Web Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "build:web": "bunx expo export:web",
    "preview:web": "bunx serve dist -p 3000"
  }
}
```

### Vercel Git Integration

**Automatic Deployments:**

1. Connect repository to Vercel
2. Configure build settings:
   - **Framework Preset:** Other
   - **Build Command:** `bun run build:web`
   - **Output Directory:** `dist`
   - **Install Command:** `bun install`

3. Branch deployments:
   - **main → Production** (yourdomain.com)
   - **develop → Preview** (develop.yourdomain.vercel.app)
   - **feature/* → Preview** (feature-branch.yourdomain.vercel.app)

### Web vs Native Feature Parity

**Features Available on Web:**
- ✅ Basic UI and navigation
- ✅ Voice input (Web Audio API)
- ✅ Text editing
- ✅ API calls (tRPC)
- ✅ State management (Zustand)

**Features NOT Available on Web:**
- ❌ Native camera access (limited browser API)
- ❌ Background audio processing
- ❌ Push notifications (requires service worker)
- ❌ Native gestures and haptics
- ❌ App Store features (in-app purchases, etc.)

**Recommendation:** If web version has significantly reduced functionality, consider creating a separate marketing website instead of deploying the full app to Vercel.

---

## 5. General Deployment Best Practices

### Environment Variable Management

#### Current Implementation ✅

**Strengths:**
- `.env.example` with clear documentation
- `.env` properly gitignored
- `EXPO_PUBLIC_*` prefix for client-safe variables
- Security notes included

**Improvements Needed:**

1. **Add Environment Validation**

```typescript
// SUGGESTED: /Users/alias/Documents/ARA/ara-voice-form/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_RORK_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_GEMINI_API_KEY: z.string().min(20),
  EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// Validate at runtime
export const env = envSchema.parse({
  EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

// Usage: import { env } from '@/config/env'
// Throws error at startup if env vars are invalid
```

2. **Environment-Specific Configs**

```bash
# Development
.env.development

# Staging/Preview
.env.staging

# Production
.env.production

# Local overrides (gitignored)
.env.local
```

### Secret Handling ✅

**Current Security Measures:**

1. **PR Secret Detection** (`.github/workflows/pr-checks.yml`)
   - Detects `.env` files in commits
   - Scans for Google API key patterns
   - Checks for hardcoded secrets in source

2. **Gitignore Configuration**
   - `.env` files ignored
   - Keystore files ignored (`.jks`, `.p8`, `.p12`, `.key`)
   - Certificate files ignored (`.pem`)

**Additional Recommendations:**

1. **Pre-commit Hooks**

```bash
# Install pre-commit hook for secret detection
bun add -D @commitlint/cli @commitlint/config-conventional husky

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "grep -r 'AIza' . --exclude-dir=node_modules && exit 1 || exit 0"
    }
  }
}
```

2. **Git-secrets or Talisman**

```bash
# Install git-secrets (macOS)
brew install git-secrets

# Setup for repository
cd /Users/alias/Documents/ARA/ara-voice-form
git secrets --install
git secrets --register-aws
git secrets --add 'AIza[0-9A-Za-z-_]{35}'
```

### Build Artifact Management

**Current Status:** No artifact management configured

**Recommendations:**

1. **EAS Build Artifacts**
   - Stored automatically on EAS servers
   - 30-day retention for Free tier
   - Download via `eas build:download`

2. **GitHub Actions Artifacts**

```yaml
# Add to GitHub workflow
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: app-build-${{ github.sha }}
    path: |
      *.apk
      *.aab
      *.ipa
    retention-days: 30
```

3. **Artifact Versioning**

```bash
# Semantic versioning in app.json
{
  "expo": {
    "version": "1.0.0",  # User-facing version
    "ios": {
      "buildNumber": "1"  # Auto-increment in CI
    },
    "android": {
      "versionCode": 1  # Auto-increment in CI
    }
  }
}
```

**Auto-increment Script:**

```typescript
// scripts/bump-version.ts
import appJson from './app.json';
import fs from 'fs';

const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber);
const newBuildNumber = currentBuildNumber + 1;

appJson.expo.ios.buildNumber = newBuildNumber.toString();
appJson.expo.android.versionCode = newBuildNumber;

fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2));
console.log(`Bumped build number to ${newBuildNumber}`);
```

### Deployment Validation

**Current Testing:** Unit tests with Jest

**Recommended End-to-End Testing:**

1. **Detox (React Native E2E)**

```bash
bun add -D detox jest-circus

# .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/AskARA.app',
      build: 'xcodebuild -workspace ios/AskARA.xcworkspace -scheme AskARA -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro'
      }
    }
  },
  configurations: {
    'ios.debug': {
      device: 'simulator',
      app: 'ios.debug'
    }
  }
};
```

2. **Maestro (Mobile UI Testing)**

```yaml
# e2e/voice-input.yaml
appId: app.rork.ask-ara-knowledge-assistant
---
- launchApp
- tapOn: "Voice Input"
- assertVisible: "Recording..."
- tapOn: "Stop Recording"
- assertVisible: "Processing..."
- assertVisible: "Transcript"
```

```bash
# Run Maestro tests
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro test e2e/voice-input.yaml
```

3. **Smoke Tests in CI/CD**

```yaml
# Add to GitHub Actions
- name: Run smoke tests
  run: |
    bun add -D playwright
    bunx playwright test --project=mobile
  env:
    EXPO_PUBLIC_RORK_API_BASE_URL: https://staging-api.yourdomain.com
```

### Rollback Strategies

**EAS Update Rollback:**

```bash
# Publish update to channel
eas update --branch production --message "v1.2.0"

# If issues detected, rollback to previous version
eas update --branch production --message "Rollback to v1.1.0" --group=<previous-update-group-id>

# Alternative: Change channel to point to old update
eas channel:rollout production --update-group=<previous-update-group-id>
```

**App Store Rollback:**

1. **iOS (App Store Connect):**
   - Remove current version from sale
   - Re-submit previous version
   - Typically takes 24-48 hours for review

2. **Android (Google Play):**
   - Halt rollout at current percentage
   - Roll back to previous release in Google Play Console
   - Changes take effect within hours

**Emergency Hotfix Process:**

```bash
# 1. Create hotfix branch from production tag
git checkout -b hotfix/critical-bug v1.0.0

# 2. Fix and test
git commit -m "Fix critical authentication bug"

# 3. Build and deploy immediately
eas build --profile production --platform all
eas submit --platform all --profile production

# 4. Merge back to main and develop
git checkout main
git merge hotfix/critical-bug
git push origin main

git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

### Monitoring and Observability

**Current Setup:** Sentry configured in `.env.example`

**Enhancements:**

1. **Error Tracking (Sentry)**

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 10000,
  attachStacktrace: true,
  beforeSend(event) {
    // Filter out development errors
    if (__DEV__) return null;
    return event;
  },
});
```

2. **Performance Monitoring**

```typescript
// Add to critical user flows
import * as Sentry from '@sentry/react-native';

export function VoiceInput() {
  const transaction = Sentry.startTransaction({
    name: 'voice-input',
    op: 'user-interaction',
  });

  const handleVoiceInput = async () => {
    const span = transaction.startChild({ op: 'voice-processing' });
    try {
      await processVoiceInput();
    } finally {
      span.finish();
    }
  };

  useEffect(() => {
    return () => transaction.finish();
  }, []);
}
```

3. **Analytics (Expo Analytics + Amplitude)**

```bash
bun add @amplitude/analytics-react-native

# app/_layout.tsx
import { init } from '@amplitude/analytics-react-native';

init('your-amplitude-api-key', undefined, {
  trackingOptions: {
    ipAddress: false,  # Privacy-first
  },
});
```

4. **Crash Reporting Dashboard**

Set up alerts in Sentry:
- **Critical:** Production crashes affecting >1% of users
- **High:** Production errors with >100 events/hour
- **Medium:** Preview/staging errors for testing

---

## 6. Platform-Specific Deployment Guides

### iOS App Store Deployment

#### Prerequisites Checklist

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect app created
- [ ] Bundle ID registered: `app.rork.ask-ara-knowledge-assistant`
- [ ] App icons (1024x1024 and various sizes)
- [ ] Screenshots (6.7", 6.5", 5.5" iPhone)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App description and keywords
- [ ] Age rating completed

#### Step-by-Step Process

**1. Configure App Store Connect**

```bash
# Login to App Store Connect
open https://appstoreconnect.apple.com/

# Create new app
# - Platform: iOS
# - Name: Ask ARA — Knowledge Assistant
# - Primary Language: English
# - Bundle ID: app.rork.ask-ara-knowledge-assistant
# - SKU: ask-ara-v1
```

**2. Prepare App Metadata**

- **Category:** Productivity (Primary), Education (Secondary)
- **Keywords:** voice assistant, AI, knowledge, productivity, voice recognition
- **Description:** (From app.json name and features)
- **Privacy Policy:** Required for apps using microphone/camera
- **Support URL:** Link to documentation or support site

**3. Build with EAS**

```bash
# Build production iOS app
eas build --profile production --platform ios

# Check build status
eas build:list --limit 1

# Download .ipa if needed
eas build:download <build-id>
```

**4. Submit to App Store**

```bash
# Submit via EAS (recommended)
eas submit --platform ios --profile production

# Or manually upload via Xcode/Transporter
# Download Transporter from Mac App Store
# Upload .ipa file
```

**5. App Review Preparation**

**Required Info:**
- **Demo account** (if login required)
- **Review notes** explaining voice/camera permissions
- **Test video** demonstrating core features

**Common Rejection Reasons:**
- Missing permission usage descriptions ✅ (Already in app.json)
- Privacy policy not accessible
- Crashes on launch
- Incomplete features

**Estimated Timeline:**
- Initial review: 24-48 hours
- Resubmission after rejection: 24 hours
- Updates: 24-48 hours

#### iOS-Specific Configuration

**app.json Checklist:**

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,  # ✅ Already set
      "bundleIdentifier": "app.rork.ask-ara-knowledge-assistant",  # ✅
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "...",  # ✅
        "NSCameraUsageDescription": "...",  # ✅
        "NSMicrophoneUsageDescription": "...",  # ✅
        "UIBackgroundModes": ["audio"],  # ✅

        # RECOMMENDED ADDITIONS:
        "ITSAppUsesNonExemptEncryption": false,  # Export compliance
        "NSLocationWhenInUseUsageDescription": "Optional location feature",
        "CFBundleAllowMixedLocalizations": true,
        "UIUserInterfaceStyle": "Automatic"  # Dark mode support
      }
    }
  }
}
```

**Privacy Manifest (privacy.plist):**

Required for iOS 17+:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeAudioData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeProductPersonalization</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Android Google Play Deployment

#### Prerequisites Checklist

- [ ] Google Play Console account ($25 one-time)
- [ ] App created in Play Console
- [ ] Package name: `app.rork.ask-ara-knowledge-assistant`
- [ ] App icons (512x512 and adaptive icons)
- [ ] Screenshots (Phone, 7" tablet, 10" tablet)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] App description (4000 chars max)
- [ ] Content rating questionnaire completed

#### Step-by-Step Process

**1. Configure Google Play Console**

```bash
# Login to Play Console
open https://play.google.com/console/

# Create new app
# - App name: Ask ARA — Knowledge Assistant
# - Default language: English (United States)
# - App or Game: App
# - Free or Paid: Free
# - Package name: app.rork.ask-ara-knowledge-assistant
```

**2. Complete Store Listing**

- **App category:** Productivity
- **Tags:** Voice Assistant, AI, Productivity
- **Short description:** (500 chars)
- **Full description:** (4000 chars)
- **Graphics:**
  - App icon: 512x512 PNG
  - Feature graphic: 1024x500 JPG/PNG
  - Screenshots: Min 2, max 8 per device type

**3. Set Up App Signing**

**Option A: Google Play App Signing (Recommended)**

```bash
# EAS handles this automatically
eas build --profile production --platform android

# Google manages the upload key
# You keep the app signing key
```

**Option B: Manual Keystore**

```bash
# Generate keystore
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Store in EAS Secrets
eas secret:create --name ANDROID_KEYSTORE --value "$(cat my-release-key.keystore | base64)" --type file
```

**4. Build with EAS**

```bash
# Build production Android app
eas build --profile production --platform android

# Generates .aab (Android App Bundle)
# Recommended format for Google Play
```

**5. Submit to Google Play**

```bash
# Submit via EAS
eas submit --platform android --profile production

# Or manually upload .aab to Play Console
# → Release → Production → Create new release
```

**6. Content Rating**

Required questionnaire:
- Violence: None
- Sexual content: None
- Profanity: None
- Controlled substances: None
- Interactive elements: Users interact, shares location

**Estimated Rating:** Everyone / PEGI 3

**7. Release Tracks**

| Track | Purpose | Percentage |
|-------|---------|------------|
| **Internal Testing** | Team testing | Instant updates |
| **Closed Testing** | Beta testers | Manual enrollment |
| **Open Testing** | Public beta | Opt-in |
| **Production** | Public release | Gradual rollout (10% → 100%) |

**Recommended Rollout:**

```
Internal → Closed (100 users, 1 week) → Open (1000 users, 1 week) → Production (staged)
```

#### Android-Specific Configuration

**app.json Checklist:**

```json
{
  "expo": {
    "android": {
      "package": "app.rork.ask-ara-knowledge-assistant",  # ✅
      "versionCode": 1,  # Auto-increment in CI
      "permissions": [  # ✅ Already set
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO"
      ],

      # RECOMMENDED ADDITIONS:
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",  # ✅
        "backgroundColor": "#ffffff"  # ✅
      },
      "playStoreUrl": "https://play.google.com/store/apps/details?id=app.rork.ask-ara-knowledge-assistant",
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"  # If using maps
      }
    }
  }
}
```

### Web Deployment (Optional)

**If deploying web version:**

1. **Build for Web**

```bash
bunx expo export:web
```

2. **Deploy to Vercel**

```bash
# Connect GitHub repo to Vercel
# or manual deployment
bunx vercel --prod
```

3. **Deploy to Netlify**

```bash
bun add -D netlify-cli
bunx netlify deploy --prod --dir=dist
```

4. **Deploy to EAS Hosting**

```bash
eas hosting:configure
eas hosting:deploy
```

---

## 7. Deployment Checklist

### Pre-Deployment

#### Code Quality
- [ ] All tests passing (`bun run test:ci`)
- [ ] No linting errors (`bun run lint`)
- [ ] TypeScript type check passing (`bun x tsc --noEmit`)
- [ ] Security audit clean (`bun audit`)
- [ ] Test coverage >60%

#### Configuration
- [ ] `eas.json` created and configured
- [ ] Environment variables set in EAS Secrets
- [ ] `app.json` version bumped
- [ ] Build numbers incremented (iOS/Android)
- [ ] Privacy policy URL updated
- [ ] Support URL verified

#### Assets
- [ ] App icons generated (all sizes)
- [ ] Splash screens generated
- [ ] Screenshots captured (all device sizes)
- [ ] Feature graphic created (Android)
- [ ] Promo video recorded (optional)

#### Accounts & Access
- [ ] Apple Developer Account active
- [ ] Google Play Console account active
- [ ] App Store Connect app created
- [ ] Google Play Console app created
- [ ] EAS account configured
- [ ] Team members invited

### Deployment Process

#### iOS Deployment
- [ ] Build production iOS app (`eas build --profile production --platform ios`)
- [ ] Verify build succeeded (`eas build:list`)
- [ ] Submit to App Store (`eas submit --platform ios`)
- [ ] Upload screenshots to App Store Connect
- [ ] Complete app metadata
- [ ] Submit for review
- [ ] Monitor review status

#### Android Deployment
- [ ] Build production Android app (`eas build --profile production --platform android`)
- [ ] Verify build succeeded (`eas build:list`)
- [ ] Submit to Google Play (`eas submit --platform android`)
- [ ] Upload screenshots to Play Console
- [ ] Complete store listing
- [ ] Complete content rating
- [ ] Submit for review
- [ ] Configure gradual rollout

### Post-Deployment

#### Monitoring
- [ ] Sentry error monitoring active
- [ ] Crash reports reviewed
- [ ] Performance metrics tracked
- [ ] User feedback monitored

#### Release Management
- [ ] GitHub release created with changelog
- [ ] Version tagged in git (`git tag v1.0.0`)
- [ ] Release notes published
- [ ] Marketing announcement sent

#### Rollback Plan
- [ ] Previous version backup verified
- [ ] Rollback procedure documented
- [ ] Emergency contact list updated
- [ ] Incident response plan ready

---

## 8. Cost Analysis

### EAS (Expo Application Services)

| Tier | Monthly Cost | Builds | Features |
|------|-------------|--------|----------|
| **Free** | $0 | 30 builds/month | Basic features, community support |
| **Developer** | $29 | Unlimited | Priority builds, 2 seats, email support |
| **Team** | $99 | Unlimited | 5 seats, faster builds, webhooks |
| **Enterprise** | Custom | Unlimited | Custom SLA, dedicated support |

**Estimated Monthly Cost:** $29-99 (Developer or Team tier)

### App Store Fees

| Platform | Annual Fee | Revenue Share |
|----------|------------|---------------|
| **Apple** | $99/year | 15-30% of sales |
| **Google** | $25 one-time | 15-30% of sales |

**Estimated Annual Cost:** $124 (first year), $99/year (subsequent)

### CI/CD Costs

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **GitHub Actions** | 2,000 min/month | $4/month per 1,000 min |
| **GitLab CI/CD** | 400 min/month | $19/user/month (Premium) |
| **Vercel** | 100 GB bandwidth | $20/month (Pro) |

**Estimated Monthly Cost:** $0-20 (GitHub Actions free tier likely sufficient)

### Monitoring & Analytics

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Sentry** | 5,000 events/month | $26/month (Team) |
| **Amplitude** | 10M events/month | $49/month (Growth) |
| **Vercel Analytics** | Unlimited (basic) | $10/month (advanced) |

**Estimated Monthly Cost:** $0-85 (Free tiers may be sufficient initially)

### Total Estimated Costs

**Initial Setup:**
- Apple Developer: $99
- Google Play: $25
- **Total:** $124

**Monthly (Minimal):**
- EAS Developer: $29
- Sentry/Analytics: $0 (free tier)
- CI/CD: $0 (free tier)
- **Total:** $29/month

**Monthly (Production Scale):**
- EAS Team: $99
- Sentry Team: $26
- Amplitude Growth: $49
- Vercel Pro: $20
- **Total:** $194/month

**Annual Estimate:**
- **Year 1:** $124 setup + ($29-194 × 12) = $472-2,452
- **Year 2+:** $99 + ($29-194 × 12) = $447-2,427

---

## 9. Risk Assessment

### Critical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **No EAS configuration** | 🔴 Cannot deploy apps | 100% | Create `eas.json` immediately |
| **Missing app store accounts** | 🔴 Cannot publish | 100% | Register accounts ($124) |
| **No deployment automation** | 🟡 Manual releases error-prone | High | Implement GitHub Actions deployment |
| **Secrets in source code** | 🔴 API key compromise | Low | Continue PR secret checks ✅ |
| **No rollback strategy** | 🟡 Prolonged outages | Medium | Document EAS Update rollback |

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **No automated testing** | 🟡 Bugs in production | Medium | Add E2E tests (Detox/Maestro) |
| **Single deployment platform** | 🟡 Vendor lock-in | Medium | Document multi-platform strategy |
| **No performance monitoring** | 🟡 Undetected issues | Medium | Implement Sentry performance tracking |
| **Manual version bumping** | 🟡 Version conflicts | Medium | Automate version increments in CI |

### Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **GitLab CI/CD unused** | 🟢 Redundant remote | Low | Remove or configure GitLab CI |
| **Web deployment unclear** | 🟢 Wasted effort | Low | Clarify mobile-first strategy |
| **Vercel not configured** | 🟢 Missing feature | Low | Optional: Configure for web version |

---

## 10. Immediate Action Items

### Priority 1 (Required for ANY Deployment) 🔴

1. **Create EAS Configuration**
   ```bash
   cd /Users/alias/Documents/ARA/ara-voice-form
   eas build:configure
   ```
   - Creates `eas.json` with build profiles
   - Configures iOS/Android credentials

2. **Register Apple Developer Account**
   - Cost: $99/year
   - URL: https://developer.apple.com/programs/enroll/
   - Required for iOS deployment

3. **Register Google Play Console**
   - Cost: $25 one-time
   - URL: https://play.google.com/console/signup
   - Required for Android deployment

4. **Configure Environment Variables**
   ```bash
   # Set production secrets in EAS
   eas secret:create --name GEMINI_API_KEY_PROD --value "your-key"
   eas secret:create --name SENTRY_DSN_PROD --value "your-dsn"
   ```

### Priority 2 (Recommended Before First Release) 🟡

5. **Add GitHub Actions Deployment Workflows**
   - Copy suggested workflows from Section 3
   - Configure GitHub Secrets
   - Set up protected environments

6. **Create App Store Connect App**
   - Login to App Store Connect
   - Create new app with bundle ID: `app.rork.ask-ara-knowledge-assistant`
   - Upload screenshots and metadata

7. **Create Google Play Console App**
   - Login to Play Console
   - Create new app with package: `app.rork.ask-ara-knowledge-assistant`
   - Complete content rating

8. **Add Automated Testing**
   ```bash
   bun add -D detox jest-circus
   # Configure E2E tests
   ```

### Priority 3 (Nice to Have) 🟢

9. **Configure GitLab CI/CD or Remove Remote**
   ```bash
   # Option A: Configure GitLab CI
   # Create .gitlab-ci.yml from Section 2

   # Option B: Remove unused remote
   git remote remove gitlab
   ```

10. **Implement Performance Monitoring**
    - Configure Sentry performance tracking
    - Add Amplitude analytics
    - Set up error alerting

11. **Document Deployment Process**
    - Create deployment runbook
    - Document rollback procedures
    - Train team members

---

## 11. Step-by-Step Setup Guide

### Complete First-Time Deployment Setup

**Estimated Time:** 2-4 hours

#### Step 1: EAS Configuration (15 min)

```bash
# 1. Login to EAS
eas login

# 2. Initialize EAS project
cd /Users/alias/Documents/ARA/ara-voice-form
eas build:configure

# 3. Create eas.json (if not auto-created)
# Copy configuration from Section 1 of this report

# 4. Verify configuration
eas config --profile production
```

#### Step 2: Environment Variables (10 min)

```bash
# 1. Create .env files from template
cp .env.example .env

# 2. Fill in actual values in .env (DO NOT COMMIT)
# Edit with your editor

# 3. Set production secrets in EAS
eas secret:create --name GEMINI_API_KEY_PROD --value "your-production-key"
eas secret:create --name SENTRY_DSN_PROD --value "your-production-dsn"

# 4. Set staging secrets
eas secret:create --name GEMINI_API_KEY_STAGING --value "your-staging-key"
eas secret:create --name SENTRY_DSN_STAGING --value "your-staging-dsn"

# 5. Verify secrets
eas secret:list
```

#### Step 3: Apple Developer Setup (30 min)

```bash
# 1. Register Apple Developer Account
open https://developer.apple.com/programs/enroll/
# Cost: $99/year
# Wait for approval (usually instant to 24 hours)

# 2. Create App Store Connect app
open https://appstoreconnect.apple.com/

# Click "+" → New App
# - Platform: iOS
# - Name: Ask ARA — Knowledge Assistant
# - Primary Language: English (U.S.)
# - Bundle ID: Select or create app.rork.ask-ara-knowledge-assistant
# - SKU: ask-ara-v1
# - User Access: Full Access

# 3. Generate required credentials (EAS handles automatically)
eas credentials

# 4. Store Apple ID in EAS Secrets
eas secret:create --name APPLE_ID --value "your-apple-id@example.com"
```

#### Step 4: Google Play Setup (30 min)

```bash
# 1. Register Google Play Console
open https://play.google.com/console/signup
# Cost: $25 one-time

# 2. Create app in Play Console
# Click "Create app"
# - App name: Ask ARA — Knowledge Assistant
# - Default language: English (United States)
# - App or game: App
# - Free or paid: Free
# - Declarations: Accept all

# 3. Set up app signing
# Enable Google Play App Signing
# Upload certificate (EAS generates automatically)

# 4. Create service account for API access
open https://console.cloud.google.com/iam-admin/serviceaccounts
# Create service account → Download JSON key
# Store in EAS Secrets:
eas secret:create --name GOOGLE_SERVICE_ACCOUNT_KEY --value "$(cat service-account.json)" --type string
```

#### Step 5: GitHub Configuration (20 min)

```bash
# 1. Add GitHub Secrets
# Navigate to repository on GitHub
# Settings → Secrets and variables → Actions → New repository secret

# Add the following secrets:
EXPO_TOKEN=<from eas login>
GEMINI_API_KEY_PROD=<production key>
GEMINI_API_KEY_STAGING=<staging key>
SENTRY_DSN_PROD=<production DSN>
SENTRY_DSN_STAGING=<staging DSN>
SENTRY_AUTH_TOKEN=<sentry auth token>

# 2. Create GitHub workflows
# Copy workflows from Section 3 to .github/workflows/

# 3. Set up protected environments
# Settings → Environments → New environment
# Create: production-ios, production-android, preview
# Add environment-specific secrets

# 4. Test workflow
git add .github/workflows/
git commit -m "Add deployment workflows"
git push origin main
```

#### Step 6: First Test Build (30 min)

```bash
# 1. Build preview for testing
eas build --profile preview --platform ios --non-interactive

# 2. Monitor build progress
eas build:list

# 3. When build completes, download and test
eas build:download <build-id>

# 4. Install on simulator/device
# For iOS: Drag .ipa to simulator
# For Android: adb install app.apk

# 5. Verify app launches and core features work
```

#### Step 7: Production Build (20 min)

```bash
# 1. Ensure all tests pass
bun run test:ci
bun run lint
bun x tsc --noEmit

# 2. Update version in app.json
# Bump version: 1.0.0 → 1.1.0
# Increment buildNumber/versionCode

# 3. Build production apps
eas build --profile production --platform all --non-interactive

# 4. Monitor build status
watch -n 10 eas build:list --limit 1

# Wait for builds to complete (typically 10-20 minutes)
```

#### Step 8: App Store Submission (30 min)

```bash
# iOS SUBMISSION
# 1. Complete App Store Connect metadata
open https://appstoreconnect.apple.com/
# - Upload screenshots (iPhone 6.7", 6.5", 5.5")
# - Add description (from app.json)
# - Set keywords: voice assistant, AI, knowledge, productivity
# - Privacy policy URL
# - Support URL
# - Age rating: 4+ (no objectionable content)

# 2. Submit via EAS
eas submit --platform ios --profile production --latest

# 3. Monitor submission
# App Store Connect → My Apps → Ask ARA
# Status will change to "Waiting for Review"

# ANDROID SUBMISSION
# 1. Complete Play Console store listing
open https://play.google.com/console/
# - Upload screenshots (phone, tablet)
# - Feature graphic (1024x500)
# - Description
# - Content rating (complete questionnaire)

# 2. Submit via EAS
eas submit --platform android --profile production --latest

# 3. Monitor submission
# Play Console → Ask ARA → Production track
```

#### Step 9: Monitoring Setup (15 min)

```bash
# 1. Verify Sentry integration
# Check Sentry dashboard for events

# 2. Set up Sentry alerts
# Sentry → Alerts → New Alert Rule
# - Alert on: New Issue
# - Environment: production
# - Notify: Email/Slack

# 3. Configure analytics (optional)
bun add @amplitude/analytics-react-native
# Add initialization code to app/_layout.tsx

# 4. Create monitoring dashboard
# Sentry → Dashboards → Create Dashboard
# Add widgets: Error rate, User sessions, Performance
```

#### Step 10: Documentation (10 min)

```bash
# 1. Update README.md with deployment info
# Add links to:
# - App Store listing (once approved)
# - Google Play listing (once approved)
# - Privacy policy
# - Support documentation

# 2. Create deployment runbook
# Document:
# - How to create new release
# - How to rollback
# - Emergency contacts

# 3. Commit and push
git add README.md docs/
git commit -m "Add deployment documentation"
git push origin main
```

---

## 12. Troubleshooting Common Issues

### EAS Build Failures

**Error: "eas.json not found"**

```bash
# Solution:
eas build:configure
```

**Error: "Expo token not set"**

```bash
# Solution:
eas login
# Or set in CI:
export EXPO_TOKEN=<your-token>
```

**Error: "Build failed with exit code 1"**

```bash
# Solution: Check build logs
eas build:view <build-id>

# Common causes:
# 1. Missing dependencies
bun install

# 2. TypeScript errors
bun x tsc --noEmit

# 3. iOS certificate issues
eas credentials

# 4. Android keystore issues
eas credentials --platform android
```

### App Store Rejection

**Common Reasons:**

1. **Missing Privacy Policy**
   - Solution: Add privacy policy URL to App Store Connect

2. **Incomplete Permission Descriptions**
   - Solution: Verify all `NSUsageDescription` keys in app.json

3. **Crash on Launch**
   - Solution: Test on physical device before submission

4. **Missing Features**
   - Solution: Ensure all advertised features work

5. **Guideline 2.1 - Performance**
   - Solution: Remove placeholder content, ensure app is complete

### Google Play Rejection

**Common Reasons:**

1. **Insufficient Screenshots**
   - Solution: Upload minimum 2 screenshots per device type

2. **Privacy Policy Missing**
   - Solution: Add privacy policy URL to store listing

3. **Content Rating Incomplete**
   - Solution: Complete content rating questionnaire

4. **Target API Level Too Low**
   - Solution: Update `android.compileSdkVersion` in app.json

### Deployment Automation Failures

**GitHub Actions Timeout**

```bash
# Solution: Increase timeout
jobs:
  build:
    timeout-minutes: 60  # Default is 360
```

**GitLab CI/CD Runner Out of Space**

```bash
# Solution: Clean up cache
gitlab-runner cache-clean
```

**Vercel Build Failure**

```bash
# Solution: Check build logs
vercel logs <deployment-url>

# Common fix: Update build command
"buildCommand": "bun run build:web"
```

---

## 13. Best Practices Summary

### Security

1. ✅ **Never commit secrets** - Use EAS Secrets, GitHub Secrets, environment variables
2. ✅ **Scan for secrets in PRs** - Already implemented in PR checks
3. ✅ **Use different API keys per environment** - Separate dev/staging/prod
4. ✅ **Enable 2FA** - On Apple ID, Google Account, EAS, GitHub
5. ✅ **Rotate credentials regularly** - Every 90 days

### Testing

1. 📋 **Write E2E tests** - Use Detox or Maestro
2. 📋 **Run tests in CI** - Already have unit tests ✅
3. 📋 **Test on physical devices** - Before submission
4. 📋 **Smoke test after deployment** - Verify core features
5. 📋 **Monitor error rates** - Sentry alerts configured

### Versioning

1. 📋 **Use semantic versioning** - MAJOR.MINOR.PATCH
2. 📋 **Auto-increment build numbers** - In CI/CD
3. 📋 **Tag releases in git** - `git tag v1.0.0`
4. 📋 **Generate changelogs** - From git commits
5. 📋 **Document breaking changes** - In release notes

### Deployment

1. 📋 **Deploy to staging first** - Test in preview environment
2. 📋 **Gradual rollout** - 10% → 50% → 100%
3. 📋 **Monitor after deployment** - Watch error rates
4. 📋 **Have rollback plan** - Document procedure
5. 📋 **Communicate releases** - Release notes, team notification

### Monitoring

1. 📋 **Track errors** - Sentry configured ✅
2. 📋 **Monitor performance** - Add performance tracking
3. 📋 **Analyze user behavior** - Amplitude or Mixpanel
4. 📋 **Set up alerts** - For critical errors
5. 📋 **Review metrics weekly** - Crash-free rate, performance

---

## 14. Resources & Documentation

### Official Documentation

- **Expo:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **React Native:** https://reactnative.dev/docs/getting-started
- **App Store Connect:** https://developer.apple.com/app-store-connect/
- **Google Play Console:** https://play.google.com/console/about/

### Deployment Guides

- **iOS Deployment:** https://docs.expo.dev/submit/ios/
- **Android Deployment:** https://docs.expo.dev/submit/android/
- **Web Deployment:** https://docs.expo.dev/distribution/publishing-websites/
- **EAS Update:** https://docs.expo.dev/eas-update/introduction/

### CI/CD Documentation

- **GitHub Actions:** https://docs.github.com/en/actions
- **GitLab CI/CD:** https://docs.gitlab.com/ee/ci/
- **Expo GitHub Action:** https://github.com/expo/expo-github-action

### Monitoring & Analytics

- **Sentry React Native:** https://docs.sentry.io/platforms/react-native/
- **Amplitude:** https://www.docs.developers.amplitude.com/
- **Expo Analytics:** https://docs.expo.dev/guides/using-analytics/

### Testing

- **Detox:** https://wix.github.io/Detox/
- **Maestro:** https://maestro.mobile.dev/
- **Jest:** https://jestjs.io/docs/getting-started

---

## 15. Contact & Support

### Account Contacts

- **Apple Developer Support:** https://developer.apple.com/contact/
- **Google Play Support:** https://support.google.com/googleplay/android-developer/
- **Expo Support:** https://expo.dev/contact

### Emergency Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| **Production Outage** | Team Lead | <15 min |
| **Security Incident** | Security Team | <30 min |
| **App Store Rejection** | iOS Lead | <2 hours |
| **Critical Bug** | On-call Engineer | <1 hour |

### Escalation Path

1. **Developer** → Issue detected
2. **Team Lead** → Triage and assign
3. **Engineering Manager** → Resource allocation
4. **CTO** → External communication

---

## 16. Conclusion

### Current State

This Expo React Native app has:
- ✅ Strong foundation with modern tech stack
- ✅ Comprehensive CI/CD for testing and quality
- ✅ Good security practices (secret scanning)
- ❌ **No deployment configuration** (critical blocker)
- ❌ Missing app store accounts
- ❌ No automated release process

### Required Actions for First Deployment

**Minimum Viable Deployment (1-2 days):**

1. Create `eas.json` configuration
2. Register Apple Developer + Google Play accounts
3. Configure EAS secrets
4. Run first test build
5. Submit to app stores

**Production-Ready Deployment (1 week):**

1. All minimum actions above
2. Add GitHub Actions deployment workflows
3. Set up monitoring (Sentry)
4. Create app store assets (screenshots, descriptions)
5. Document deployment procedures

### Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Setup** | 1 day | Accounts, EAS config, secrets |
| **First Build** | 0.5 day | Test builds working |
| **Store Preparation** | 1-2 days | Assets, metadata, compliance |
| **Submission** | 1-2 days | Apps submitted to stores |
| **Review Wait** | 1-3 days | Apple/Google review |
| **Launch** | 0.5 day | Release to public |
| **Total** | **5-9 days** | App live on stores |

### Success Metrics

**Deployment Goals:**

- ⚡ **Build time:** <20 minutes per platform
- 🎯 **Test coverage:** >60%
- 🛡️ **Security scans:** 100% passing
- 📱 **Crash-free rate:** >99.5%
- ⏱️ **App startup time:** <2 seconds
- 📊 **Error rate:** <1% of sessions

**Operational Goals:**

- 🚀 **Release frequency:** Weekly
- 🔄 **Deployment automation:** 100%
- 📉 **Manual steps:** <5 per release
- ⚙️ **Rollback time:** <30 minutes

---

**Report Generated:** November 22, 2025
**Last Updated:** November 22, 2025
**Next Review:** Before first production release

---

## Appendix A: Complete eas.json

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "https://staging-api.yourdomain.com",
        "EXPO_PUBLIC_GEMINI_API_KEY": "$GEMINI_API_KEY_STAGING",
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN_STAGING"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "https://api.yourdomain.com",
        "EXPO_PUBLIC_GEMINI_API_KEY": "$GEMINI_API_KEY_PROD",
        "EXPO_PUBLIC_SENTRY_DSN": "$SENTRY_DSN_PROD"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "$APPLE_ID",
        "ascAppId": "$ASC_APP_ID",
        "appleTeamId": "$APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-service-account.json",
        "track": "production",
        "releaseStatus": "completed"
      }
    }
  }
}
```

## Appendix B: Complete GitHub Workflow Examples

See Section 3 for full workflow YAML files.

## Appendix C: Complete GitLab CI Configuration

See Section 2 for full `.gitlab-ci.yml` file.

---

**End of Report**
