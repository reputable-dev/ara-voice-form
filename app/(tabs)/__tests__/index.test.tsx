import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import VoiceFillScreen from '../index';

// Mock dependencies
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children }: any) => children,
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Store callbacks outside the mock function
const mockCallbacks: any = {};

jest.mock('@/components/VoiceRecorder', () => {
  return function MockVoiceRecorder({ onTranscriptionComplete, onRecordingStateChange }: any) {
    // Store callbacks for testing
    mockCallbacks.onTranscriptionComplete = onTranscriptionComplete;
    mockCallbacks.onRecordingStateChange = onRecordingStateChange;
    return null;
  };
});

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Mic: 'Mic',
  MessageSquare: 'MessageSquare',
  Sparkles: 'Sparkles',
  Info: 'Info',
  User: 'User',
}));

// Mock global fetch for Gemini API
global.fetch = jest.fn();

describe('VoiceFillScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with all form fields', () => {
    const { getByText, getByTestId } = render(<VoiceFillScreen />);

    expect(getByText('Contact Information')).toBeTruthy();
    expect(getByTestId('nameInput')).toBeTruthy();
    expect(getByTestId('emailInput')).toBeTruthy();
    expect(getByTestId('phoneInput')).toBeTruthy();
    expect(getByTestId('addressInput')).toBeTruthy();
    expect(getByTestId('occupationInput')).toBeTruthy();
    expect(getByTestId('messageInput')).toBeTruthy();
  });

  it('renders form labels correctly', () => {
    const { getByText } = render(<VoiceFillScreen />);

    expect(getByText('Full Name')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Phone')).toBeTruthy();
    expect(getByText('Address')).toBeTruthy();
    expect(getByText('Occupation')).toBeTruthy();
    expect(getByText('Message')).toBeTruthy();
  });

  it('renders action buttons', () => {
    const { getByTestId, getByText } = render(<VoiceFillScreen />);

    expect(getByTestId('clearForm')).toBeTruthy();
    expect(getByTestId('voiceBtn')).toBeTruthy();
    expect(getByText('Voice Fill')).toBeTruthy();
  });

  it('renders tip card with information', () => {
    const { getByText } = render(<VoiceFillScreen />);

    expect(getByText(/Try saying:/i)).toBeTruthy();
  });

  it('updates name field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const nameInput = getByTestId('nameInput');
    fireEvent.changeText(nameInput, 'John Doe');

    expect(nameInput.props.value).toBe('John Doe');
  });

  it('updates email field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const emailInput = getByTestId('emailInput');
    fireEvent.changeText(emailInput, 'john@example.com');

    expect(emailInput.props.value).toBe('john@example.com');
  });

  it('updates phone field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const phoneInput = getByTestId('phoneInput');
    fireEvent.changeText(phoneInput, '555-1234');

    expect(phoneInput.props.value).toBe('555-1234');
  });

  it('updates address field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const addressInput = getByTestId('addressInput');
    fireEvent.changeText(addressInput, '123 Main St');

    expect(addressInput.props.value).toBe('123 Main St');
  });

  it('updates occupation field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const occupationInput = getByTestId('occupationInput');
    fireEvent.changeText(occupationInput, 'Software Engineer');

    expect(occupationInput.props.value).toBe('Software Engineer');
  });

  it('updates message field when text changes', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const messageInput = getByTestId('messageInput');
    fireEvent.changeText(messageInput, 'Additional information here');

    expect(messageInput.props.value).toBe('Additional information here');
  });

  it('clears all form fields when clear button is pressed', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    // Fill in some data
    fireEvent.changeText(getByTestId('nameInput'), 'John Doe');
    fireEvent.changeText(getByTestId('emailInput'), 'john@example.com');

    // Clear form
    const clearButton = getByTestId('clearForm');
    fireEvent.press(clearButton);

    // All fields should be empty
    expect(getByTestId('nameInput').props.value).toBe('');
    expect(getByTestId('emailInput').props.value).toBe('');
  });

  it('opens voice recorder modal when voice button is pressed', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const voiceButton = getByTestId('voiceBtn');
    fireEvent.press(voiceButton);

    // Modal should be visible (VoiceRecorder component rendered)
  });

  it('handles successful transcription with AI parsing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: '{"name":"John Doe","email":"john@example.com","phone":"555-1234","address":"123 Main St","occupation":"Developer","message":""}'
      }),
    });

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    expect(typeof mockCallbacks.onTranscriptionComplete).toBe('function');

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('My name is John Doe, email john@example.com');
    });

    await waitFor(() => {
      expect(getByTestId('nameInput').props.value).toBe('John Doe');
      expect(getByTestId('emailInput').props.value).toBe('john@example.com');
    }, { timeout: 3000 });
  });

  it('handles transcription with no JSON match', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: 'No JSON here'
      }),
    });

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Some random text');
    });

    await waitFor(() => {
      expect(getByTestId('messageInput').props.value).toBe('Some random text');
    }, { timeout: 3000 });
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Test text');
    });

    await waitFor(() => {
      // Should fallback to putting text in message field
      expect(getByTestId('messageInput').props.value).toBe('Test text');
    }, { timeout: 3000 });
  });

  it('handles missing API key', async () => {
    const originalEnv = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    delete process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Test text');
    });

    await waitFor(() => {
      expect(getByTestId('messageInput').props.value).toBe('Test text');
    }, { timeout: 3000 });

    // Restore env
    if (originalEnv) {
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = originalEnv;
    }
  });

  it('handles API failure response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Test text');
    });

    await waitFor(() => {
      expect(getByTestId('messageInput').props.value).toBe('Test text');
    }, { timeout: 3000 });
  });

  it('displays AI badge when transcription exists', async () => {
    const { getByText, queryByText, getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    // Initially no AI badge
    expect(queryByText('AI Filled')).toBeFalsy();

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Test transcription');
    });

    await waitFor(() => {
      expect(getByText('AI Filled')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('displays transcription card when text exists', async () => {
    const { getByText, queryByText } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    const voiceBtn = getByText('Voice Fill').parent;
    if (voiceBtn) fireEvent.press(voiceBtn);

    // Initially no transcription card
    expect(queryByText('Transcription')).toBeFalsy();

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Sample transcription text');
    });

    await waitFor(() => {
      expect(getByText('Transcription')).toBeTruthy();
      expect(getByText('Sample transcription text')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('clears transcription when clear button is pressed', async () => {
    const { getByTestId, queryByText } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Test text');
    });

    await waitFor(() => {
      expect(queryByText('Test text')).toBeTruthy();
    }, { timeout: 3000 });

    // Clear form
    fireEvent.press(getByTestId('clearForm'));

    await waitFor(() => {
      expect(queryByText('Test text')).toBeFalsy();
    }, { timeout: 3000 });
  });

  it('disables voice button while processing', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          response: '{}'
        }),
      }), 100))
    );

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    // Trigger transcription
    act(() => {
      mockCallbacks.onTranscriptionComplete('Test');
    });

    // Button should show processing state
    await waitFor(() => {
      const voiceBtn = getByTestId('voiceBtn');
      expect(voiceBtn.props.accessibilityState?.disabled).toBe(true);
    }, { timeout: 150 });
  });

  it('calls recording state change callback', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    expect(typeof mockCallbacks.onRecordingStateChange).toBe('function');

    // Simulate recording stopped
    mockCallbacks.onRecordingStateChange(false);
  });

  it('handles parsed data with empty fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        response: '{"name":"","email":"test@example.com","phone":"","address":"","occupation":"","message":""}'
      }),
    });

    const { getByTestId } = render(<VoiceFillScreen />);

    // Open voice recorder modal to trigger callback registration
    fireEvent.press(getByTestId('voiceBtn'));

    
    

    await act(async () => {
      await mockCallbacks.onTranscriptionComplete('Email test@example.com');
    });

    await waitFor(() => {
      expect(getByTestId('nameInput').props.value).toBe('');
      expect(getByTestId('emailInput').props.value).toBe('test@example.com');
    }, { timeout: 3000 });
  });

  it('renders ScrollView with correct testID', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    expect(getByTestId('voiceFillScroll')).toBeTruthy();
  });
});
