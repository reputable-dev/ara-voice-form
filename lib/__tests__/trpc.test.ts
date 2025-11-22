import { trpc, trpcClient } from '../trpc';

// Mock @trpc/react-query
jest.mock('@trpc/react-query', () => ({
  createTRPCReact: jest.fn(() => ({
    createClient: jest.fn((config) => config),
  })),
}));

// Mock @trpc/client
jest.mock('@trpc/client', () => ({
  httpLink: jest.fn((config) => config),
}));

describe('trpc', () => {
  const originalEnv = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  afterEach(() => {
    // Restore original env
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL = originalEnv;
  });

  it('creates trpc react instance', () => {
    expect(trpc).toBeDefined();
    expect(typeof trpc.createClient).toBe('function');
  });

  it('creates trpc client with correct configuration', () => {
    expect(trpcClient).toBeDefined();
    expect(trpcClient).toHaveProperty('links');
  });

  it('uses EXPO_PUBLIC_RORK_API_BASE_URL when available', () => {
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL = 'http://localhost:3000';

    // Re-import to trigger getBaseUrl with new env
    jest.resetModules();
    const { trpcClient: newClient } = require('../trpc');

    expect(newClient.links[0].url).toBe('http://localhost:3000/api/trpc');
  });

  it('throws error when EXPO_PUBLIC_RORK_API_BASE_URL is not set', () => {
    delete process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

    jest.resetModules();

    // Importing should throw when getBaseUrl is called
    expect(() => {
      require('../trpc');
    }).toThrow('No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL');
  });

  it('includes superjson transformer in client config', () => {
    expect(trpcClient.links[0]).toHaveProperty('transformer');
  });

  it('configures httpLink with /api/trpc endpoint', () => {
    const link = trpcClient.links[0];
    expect(link.url).toContain('/api/trpc');
  });
});
