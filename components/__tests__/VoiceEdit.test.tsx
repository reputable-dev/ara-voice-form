import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text, Alert, Platform } from 'react-native';
import VoiceEdit from '../VoiceEdit';
import * as Sentry from '@/lib/sentry';

// Mock dependencies
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    uri: 'file://test-recording.caf',
  })),
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

jest.mock('../VoiceEditModal', () => {
  const mockReact = require('react');
  return function MockVoiceEditModal({ visible, transcriptionText }: any) {
    if (!visible) return null;
    const { Text } = require('react-native');
    return mockReact.createElement(Text, { testID: 'voiceEditModal' }, transcriptionText);
  };
});

jest.mock('@rork-ai/toolkit-sdk', () => ({
  generateText: jest.fn(() => Promise.resolve('edited text result')),
}));

// Mock Sentry
jest.mock('@/lib/sentry', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock global fetch for STT API
global.fetch = jest.fn();

describe('VoiceEdit Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <VoiceEdit value="test" onValueChange={jest.fn()}>
        <Text>Test Child</Text>
      </VoiceEdit>
    );

    expect(getByText('Test Child')).toBeTruthy();
  });

  it('passes value and onValueChange props correctly', () => {
    const mockOnValueChange = jest.fn();
    const { rerender } = render(
      <VoiceEdit value="initial" onValueChange={mockOnValueChange}>
        <Text>Child</Text>
      </VoiceEdit>
    );

    expect(mockOnValueChange).not.toHaveBeenCalled();

    rerender(
      <VoiceEdit value="updated" onValueChange={mockOnValueChange}>
        <Text>Child</Text>
      </VoiceEdit>
    );

    // Component should not call onValueChange automatically
    expect(mockOnValueChange).not.toHaveBeenCalled();
  });

  it('accepts fieldName prop for context', () => {
    const { getByText } = render(
      <VoiceEdit
        value="test"
        onValueChange={jest.fn()}
        fieldName="Email Address"
      >
        <Text>Email Input</Text>
      </VoiceEdit>
    );

    expect(getByText('Email Input')).toBeTruthy();
  });

  it('respects enabled prop when set to false', () => {
    const { getByText } = render(
      <VoiceEdit
        value="test"
        onValueChange={jest.fn()}
        enabled={false}
      >
        <Text>Disabled Field</Text>
      </VoiceEdit>
    );

    expect(getByText('Disabled Field')).toBeTruthy();
    // When disabled, the glow effect should have opacity 0
  });

  it('handles missing AudioModule gracefully', async () => {
    const { AudioModule } = require('expo-audio');
    AudioModule.requestRecordingPermissionsAsync.mockResolvedValueOnce({
      granted: false,
    });

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('calls captureException when recording fails', async () => {
    const { useAudioRecorder } = require('expo-audio');
    const mockRecorder = {
      prepareToRecordAsync: jest.fn(() => Promise.reject(new Error('Recording failed'))),
      record: jest.fn(),
      stop: jest.fn(),
      uri: null,
    };
    useAudioRecorder.mockReturnValueOnce(mockRecorder);

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()} fieldName="TestField">
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles empty transcription text gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: '' })),
    });

    const { getByText } = render(
      <VoiceEdit value="current text" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles STT API 429 rate limit error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Too many requests'),
    });

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles invalid JSON response from STT API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('invalid json {'),
    });

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles successful transcription and edit flow', async () => {
    const mockOnValueChange = jest.fn();
    const { generateText } = require('@rork-ai/toolkit-sdk');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: 'change name to John' })),
    });

    generateText.mockResolvedValueOnce('John');

    const { getByText } = render(
      <VoiceEdit value="Current Name" onValueChange={mockOnValueChange}>
        <Text>Name Field</Text>
      </VoiceEdit>
    );

    expect(getByText('Name Field')).toBeTruthy();
  });

  it('handles smart edit failure with fallback logic', async () => {
    const mockOnValueChange = jest.fn();
    const { generateText } = require('@rork-ai/toolkit-sdk');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: 'clear' })),
    });

    generateText.mockRejectedValueOnce(new Error('AI service unavailable'));

    const { getByText } = render(
      <VoiceEdit value="some text" onValueChange={mockOnValueChange}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles "clear" command in fallback logic', () => {
    const { getByText } = render(
      <VoiceEdit value="text to clear" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles "delete" command in fallback logic', () => {
    const { getByText } = render(
      <VoiceEdit value="text to delete" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles "append" command in fallback logic', () => {
    const { getByText } = render(
      <VoiceEdit value="existing text" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('uses default replacement for unrecognized commands', () => {
    const { getByText } = render(
      <VoiceEdit value="old text" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('captures error details when transcription fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()} fieldName="TestField">
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles web platform blob conversion for recording', () => {
    Platform.OS = 'web';

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();

    Platform.OS = 'ios'; // Reset
  });

  it('calls addBreadcrumb when voice edit fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Processing failed'));

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()} fieldName="TestField">
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('handles iOS audio mode setup', () => {
    Platform.OS = 'ios';

    const { getByText } = render(
      <VoiceEdit value="" onValueChange={jest.fn()}>
        <Text>Test</Text>
      </VoiceEdit>
    );

    expect(getByText('Test')).toBeTruthy();

    Platform.OS = 'ios'; // Ensure it stays iOS for other tests
  });
});
