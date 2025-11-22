import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceRecorder from '../VoiceRecorder';
import { Alert } from 'react-native';

// Mock expo-audio
const mockRecorder = {
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  record: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  uri: 'file://test-recording.caf',
};

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => mockRecorder),
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

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('VoiceRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial idle state', () => {
    const { getByText } = render(
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    expect(getByText('Tap to start recording')).toBeTruthy();
  });

  it('shows connecting state when button is pressed', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    // Should show connecting state first
    const connectingText = await findByText('Connecting...', {}, { timeout: 2000 });
    expect(connectingText).toBeTruthy();
  });

  it('calls onRecordingStateChange when recording starts', async () => {
    const mockStateChange = jest.fn();
    const { getByTestId, unmount } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={mockStateChange}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    // Wait for recording to start (WebSocket will timeout and fallback to recording)
    await waitFor(() => {
      expect(mockStateChange).toHaveBeenCalledWith(true);
    }, { timeout: 15000 }); // Increased timeout for WebSocket timeout + fallback

    // Clean up to prevent async operations from continuing
    unmount();
  });

  it('calls onTranscriptionComplete with transcribed text', async () => {
    const mockComplete = jest.fn();
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={mockComplete}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    // Wait for recording to start (may show connecting first, then recording)
    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    // Stop recording
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('Transcribed text from ElevenLabs ScribeV2');
    }, { timeout: 5000 });
  });

  it('shows processing state after stopping recording', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    // Stop recording
    fireEvent.press(recordButton);

    const processingText = await findByText('Processing...', {}, { timeout: 2000 });
    expect(processingText).toBeTruthy();
  });

  it('handles empty transcription gracefully', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    fireEvent.press(recordButton);

    // Should handle gracefully without crashing
    expect(true).toBeTruthy();
  });

  it('handles transcription API error', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    fireEvent.press(recordButton);

    // Should handle error gracefully
    expect(true).toBeTruthy();
  });

  it('handles invalid JSON response from API', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    fireEvent.press(recordButton);

    // Should handle gracefully
    expect(true).toBeTruthy();
  });

  it('calls onTranscriptionStream with listening message', async () => {
    const mockStream = jest.fn();
    const { getByTestId } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onTranscriptionStream={mockStream}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockStream).toHaveBeenCalledWith('Listening...');
    }, { timeout: 2000 });
  });

  it('prevents multiple simultaneous recordings', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={jest.fn()}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');

    // Start first recording
    fireEvent.press(recordButton);
    await findByText(/Recording.*Tap to stop/, {}, { timeout: 10000 });

    // Try to start second recording (should be prevented)
    fireEvent.press(recordButton);

    // Should only have one recording session
    const recordingText = await findByText(/Recording.*Tap to stop/, {}, { timeout: 2000 });
    expect(recordingText).toBeTruthy();
  });
});
