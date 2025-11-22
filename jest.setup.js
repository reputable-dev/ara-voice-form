// Jest setup file for React Native Testing Library

// Polyfill structuredClone for Expo SDK 54+
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock Expo's import meta registry (required for Expo SDK 54+)
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Mock environment variables
process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-api-key';
process.env.EXPO_PUBLIC_RORK_API_BASE_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  ReactNativeTracing: jest.fn().mockImplementation(() => ({})),
  ReactNavigationInstrumentation: jest.fn().mockImplementation(() => ({})),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock window.dispatchEvent for React test renderer (fixes Animated API errors)
if (typeof window !== 'undefined') {
  window.dispatchEvent = jest.fn();
} else {
  global.window = { dispatchEvent: jest.fn() };
}

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: 'Stack.Screen',
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  useAudioRecorder: () => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn(),
    uri: 'mock://audio-uri',
    status: 'idle',
  }),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() =>
      Promise.resolve({ granted: true })
    ),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'mock://image-uri', base64: 'mock-base64' }],
    })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'mock://image-uri', base64: 'mock-base64' }],
    })
  ),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Mic: 'Mic',
  MessageSquare: 'MessageSquare',
  Sparkles: 'Sparkles',
  Info: 'Info',
  User: 'User',
  Send: 'Send',
  ChevronDown: 'ChevronDown',
  Bot: 'Bot',
  Wand2: 'Wand2',
  FileText: 'FileText',
  Camera: 'Camera',
  ImageIcon: 'ImageIcon',
  X: 'X',
  Check: 'Check',
}));

// Mock @rork-ai/toolkit-sdk using doMock for virtual module
jest.doMock('@rork-ai/toolkit-sdk', () => ({
  generateText: jest.fn((params) =>
    Promise.resolve('AI generated response')
  ),
}), { virtual: true });

// Mock fetch for API calls
global.fetch = jest.fn((url) => {
  if (url.includes('gemini')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: 'AI response text' }],
              },
            },
          ],
        }),
    });
  }

  if (url.includes('stt/transcribe')) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: 'Transcribed text' })),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
});
