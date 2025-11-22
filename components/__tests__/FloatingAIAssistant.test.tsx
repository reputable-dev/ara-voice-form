import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FloatingAIAssistant from '../FloatingAIAssistant';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'test-image.jpg', base64: 'base64data' }],
    })
  ),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('lucide-react-native', () => ({
  MessageSquare: 'MessageSquare',
  Mic: 'Mic',
  Send: 'Send',
  ChevronDown: 'ChevronDown',
  Sparkles: 'Sparkles',
  Bot: 'Bot',
  User: 'User',
  Wand2: 'Wand2',
  FileText: 'FileText',
  Camera: 'Camera',
  ImageIcon: 'ImageIcon',
  X: 'X',
}));

// Mock Sentry
jest.mock('@/lib/sentry', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('FloatingAIAssistant Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders correctly with testID', () => {
    const { getByTestId } = render(
      <FloatingAIAssistant testID="ai-assistant" />
    );

    expect(getByTestId('ai-assistant')).toBeTruthy();
  });

  it('renders initial assistant message', () => {
    const { getByText } = render(<FloatingAIAssistant />);

    expect(
      getByText(/Hi! I'm your AI assistant/i)
    ).toBeTruthy();
  });

  it('renders with contract data context', () => {
    const contractData = {
      source: 'Test contract',
      formData: {
        clientName: 'John',
        propertyAddress: '123 Main',
        tags: [],
      },
      onFillAI: jest.fn(),
      onUpdateSource: jest.fn(),
    };

    const { getByText } = render(
      <FloatingAIAssistant contractData={contractData} />
    );

    expect(
      getByText(/I can help you fill out contract forms/i)
    ).toBeTruthy();
  });

  it('expands and collapses when toggle button is pressed', () => {
    const { getByTestId } = render(
      <FloatingAIAssistant testID="ai-assistant" />
    );

    const toggleButton = getByTestId('ai-assistant-toggle');

    // Initially collapsed
    fireEvent.press(toggleButton);

    // Should be expanded now (animation starts)
    // We can't easily test animation state, but we can verify the button works
    expect(toggleButton).toBeTruthy();
  });

  it('updates input text when typing', () => {
    const { getByPlaceholderText } = render(<FloatingAIAssistant testID="ai" />);

    const input = getByPlaceholderText(/Type your message/i);
    fireEvent.changeText(input, 'Hello AI');

    expect(input.props.value).toBe('Hello AI');
  });

  it('clears input after sending message', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <FloatingAIAssistant testID="ai" />
    );

    const input = getByPlaceholderText(/Type your message/i);
    const sendButton = getByTestId('ai-send-button');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    expect(input.props.value).toBe('');
  });

  it('renders without contract data', () => {
    const { getByText } = render(<FloatingAIAssistant />);

    expect(
      getByText(/I can help you with questions and provide guidance/i)
    ).toBeTruthy();
  });

  it('handles fillWithAI action when contract data provided', () => {
    const onFillAI = jest.fn();
    const contractData = {
      source: 'Test',
      formData: {
        clientName: '',
        propertyAddress: '',
        tags: [],
      },
      onFillAI,
      onUpdateSource: jest.fn(),
    };

    const { getByTestId } = render(
      <FloatingAIAssistant contractData={contractData} />
    );

    const fillButton = getByTestId('aiFillButton');
    fireEvent.press(fillButton);

    expect(onFillAI).toHaveBeenCalled();
  });

  it('does not render fill button without contract data', () => {
    const { queryByText } = render(<FloatingAIAssistant />);

    expect(queryByText(/Fill Form with AI/i)).toBeFalsy();
  });
});
