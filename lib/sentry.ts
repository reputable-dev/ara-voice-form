import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

/**
 * Initialize Sentry error monitoring
 *
 * Configure this in your .env file:
 * EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
 *
 * Get your DSN from: https://sentry.io/
 */
export const initSentry = () => {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Skip Sentry in development if DSN not configured
  if (!dsn && __DEV__) {
    console.log('[Sentry] Skipping initialization in development (no DSN configured)');
    return;
  }

  // Require DSN in production
  if (!dsn && !__DEV__) {
    console.error('[Sentry] EXPO_PUBLIC_SENTRY_DSN is required in production');
    return;
  }

  Sentry.init({
    dsn,

    // Environment detection
    environment: __DEV__ ? 'development' : 'production',

    // Performance monitoring - sample 100% in dev, 10% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Enable automatic session tracking
    enableAutoSessionTracking: true,

    // Session tracking interval (30 seconds)
    sessionTrackingIntervalMillis: 30000,

    // Attach stack traces to errors
    attachStacktrace: true,

    // Enable native crash reporting
    enableNative: true,

    // Enable automatic breadcrumbs
    enableNativeCrashHandling: true,
    enableNativeNagger: true,

    // Set release version from package.json
    // release: 'expo-app@1.0.0', // Uncomment and update with your versioning

    // Before send hook - filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development mode (optional)
      if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_DEBUG) {
        return null;
      }

      // Filter out sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove API keys from breadcrumbs
            delete breadcrumb.data.apiKey;
            delete breadcrumb.data.token;
            delete breadcrumb.data.authorization;
          }
          return breadcrumb;
        });
      }

      // Filter out sensitive data from request
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      return event;
    },

    // Integrate with React Navigation (if used)
    integrations: [
      new Sentry.ReactNativeTracing({
        // Track screen navigation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),

        // Trace all user interactions
        tracingOrigins: ['localhost', /^\//],

        // Enable automatic performance monitoring
        enableUserInteractionTracing: true,
      }),
    ],
  });

  // Set user context (call this after user logs in)
  // Sentry.setUser({ id: 'user-id', email: 'user@example.com' });

  console.log(`[Sentry] Initialized in ${__DEV__ ? 'development' : 'production'} mode`);
};

/**
 * Capture an exception manually
 * @param error - Error object or string
 * @param context - Additional context
 */
export const captureException = (error: Error | string, context?: Record<string, any>) => {
  if (context) {
    Sentry.captureException(error, { contexts: { custom: context } });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture a message (non-error event)
 * @param message - Message to log
 * @param level - Severity level
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb (navigation trail)
 * @param message - Breadcrumb message
 * @param category - Category (navigation, http, user, etc.)
 * @param data - Additional data
 */
export const addBreadcrumb = (message: string, category: string = 'custom', data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

/**
 * Set user context (call after authentication)
 * @param user - User information (id, email, username)
 */
export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  Sentry.setUser(user);
};

/**
 * Set custom tags for filtering
 * @param tags - Key-value pairs
 */
export const setTags = (tags: Record<string, string>) => {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
};

/**
 * Set extra context data
 * @param extras - Additional context
 */
export const setExtras = (extras: Record<string, any>) => {
  Object.entries(extras).forEach(([key, value]) => {
    Sentry.setExtra(key, value);
  });
};

// Export Sentry for direct access if needed
export { Sentry };
