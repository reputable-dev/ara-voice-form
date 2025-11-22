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

  it('shows recording state when button is pressed', async () => {
    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    const recordingText = await findByText('Recording... Tap to stop', {}, { timeout: 2000 });
    expect(recordingText).toBeTruthy();
  });

  it('calls onRecordingStateChange when recording starts', async () => {
    const mockStateChange = jest.fn();
    const { getByTestId } = render(
      <VoiceRecorder
        onTranscriptionComplete={jest.fn()}
        onRecordingStateChange={mockStateChange}
      />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockStateChange).toHaveBeenCalledWith(true);
    }, { timeout: 2000 });
  });

  it('calls onTranscriptionComplete with transcribed text', async () => {
    const mockComplete = jest.fn();

    // Mock successful transcription
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ text: 'Hello world' })),
      })
    ) as jest.Mock;

    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={mockComplete} />
    );

    // Start recording
    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    // Wait for recording state
    await findByText('Recording... Tap to stop', {}, { timeout: 2000 });

    // Stop recording (same button, now in recording state)
    fireEvent.press(recordButton);

    // Wait for transcription to complete
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('Hello world');
    }, { timeout: 3000 });
  });

  it('shows processing state after stopping recording', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ text: 'Test' })),
      })
    ) as jest.Mock;

    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    // Start recording
    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText('Recording... Tap to stop', {}, { timeout: 2000 });

    // Stop recording
    fireEvent.press(recordButton);

    // Should show processing state
    const processingText = await findByText('Processing...', {}, { timeout: 2000 });
    expect(processingText).toBeTruthy();
  });

  it('handles empty transcription gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ text: '' })),
      })
    ) as jest.Mock;

    const mockComplete = jest.fn();
    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={mockComplete} />
    );

    // Start and stop recording
    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText('Recording... Tap to stop', {}, { timeout: 2000 });

    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'No Speech Detected',
        'No speech was detected in the recording. Please try again.'
      );
    }, { timeout: 3000 });

    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('handles transcription API error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })
    ) as jest.Mock;

    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    // Start and stop recording
    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText('Recording... Tap to stop', {}, { timeout: 2000 });

    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to transcribe audio. Please try again.'
      );
    }, { timeout: 3000 });
  });

  it('handles invalid JSON response from API', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('Not valid JSON'),
      })
    ) as jest.Mock;

    const { getByTestId, findByText } = render(
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    const recordButton = getByTestId('voiceRecorderButton');
    fireEvent.press(recordButton);

    await findByText('Recording... Tap to stop', {}, { timeout: 2000 });

    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to transcribe audio. Please try again.'
      );
    }, { timeout: 3000 });
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
      <VoiceRecorder onTranscriptionComplete={jest.fn()} />
    );

    const recordButton = getByTestId('voiceRecorderButton');

    // Try to start recording twice
    fireEvent.press(recordButton);
    fireEvent.press(recordButton);

    // Should only have one recording session
    const recordingText = await findByText('Recording... Tap to stop', {}, { timeout: 2000 });
    expect(recordingText).toBeTruthy();
  });
});
