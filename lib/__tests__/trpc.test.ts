// Mock convex/react
jest.mock('convex/react', () => ({
  ConvexProvider: ({ children }: { children: any }) => children,
  ConvexReactClient: jest.fn((url: string) => ({
    url,
  })),
}));

// Mock React.createElement for JSX
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('Convex client', () => {
  const originalEnv = process.env.EXPO_PUBLIC_CONVEX_URL;

  afterEach(() => {
    // Restore original env
    process.env.EXPO_PUBLIC_CONVEX_URL = originalEnv;
  });

  it('creates convex client instance', () => {
    // Set env before importing
    process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    jest.resetModules();
    const { convex } = require('../trpc');
    
    expect(convex).toBeDefined();
    expect(typeof convex).toBe('object');
  });

  it('creates ConvexClientProvider component', () => {
    // Set env before importing
    process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    jest.resetModules();
    const { ConvexClientProvider } = require('../trpc');
    
    expect(ConvexClientProvider).toBeDefined();
    expect(typeof ConvexClientProvider).toBe('function');
  });

  it('uses EXPO_PUBLIC_CONVEX_URL when available', () => {
    process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';

    // Re-import to trigger convex client creation with new env
    jest.resetModules();
    const { convex: newConvex } = require('../trpc');

    expect(newConvex.url).toBe('https://test.convex.cloud');
  });

  it('throws error when EXPO_PUBLIC_CONVEX_URL is not set', () => {
    delete process.env.EXPO_PUBLIC_CONVEX_URL;

    jest.resetModules();

    // Importing should throw when EXPO_PUBLIC_CONVEX_URL is not set
    expect(() => {
      require('../trpc');
    }).toThrow('EXPO_PUBLIC_CONVEX_URL is not set');
  });

  it('ConvexClientProvider can be called without throwing', () => {
    // Set env before importing
    process.env.EXPO_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';
    jest.resetModules();
    const { ConvexClientProvider } = require('../trpc');
    
    const mockChildren = 'Test Content';
    
    // This should not throw
    expect(() => {
      const provider = ConvexClientProvider({ children: mockChildren });
    }).not.toThrow();
  });
});