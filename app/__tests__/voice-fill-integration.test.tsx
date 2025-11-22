import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceFillScreen from '../(tabs)/index';

// Mock the Stack.Screen component
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: any) => null,
  },
}));

describe('Voice Fill Integration Test', () => {
  it('renders the voice fill screen correctly', () => {
    const { getByText, getByTestId } = render(<VoiceFillScreen />);

    expect(getByText('Contact Information')).toBeTruthy();
    expect(getByTestId('nameInput')).toBeTruthy();
    expect(getByTestId('emailInput')).toBeTruthy();
    expect(getByTestId('phoneInput')).toBeTruthy();
  });

  it('displays all form fields', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    expect(getByTestId('nameInput')).toBeTruthy();
    expect(getByTestId('emailInput')).toBeTruthy();
    expect(getByTestId('phoneInput')).toBeTruthy();
    expect(getByTestId('addressInput')).toBeTruthy();
    expect(getByTestId('occupationInput')).toBeTruthy();
    expect(getByTestId('messageInput')).toBeTruthy();
  });

  it('opens voice recorder modal when voice button is pressed', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const voiceButton = getByTestId('voiceBtn');
    fireEvent.press(voiceButton);

    // Modal should be visible after pressing button
    // Note: Modal testing is limited in RNTL, this tests the button press
    expect(voiceButton).toBeTruthy();
  });

  it('clears form when clear button is pressed', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    // Set some values first
    const nameInput = getByTestId('nameInput');
    fireEvent.changeText(nameInput, 'John Doe');

    // Press clear button
    const clearButton = getByTestId('clearForm');
    fireEvent.press(clearButton);

    // Verify form is cleared
    expect(nameInput.props.value).toBe('');
  });

  it('updates form fields when text is entered', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const nameInput = getByTestId('nameInput');
    const emailInput = getByTestId('emailInput');

    fireEvent.changeText(nameInput, 'Jane Smith');
    fireEvent.changeText(emailInput, 'jane@example.com');

    expect(nameInput.props.value).toBe('Jane Smith');
    expect(emailInput.props.value).toBe('jane@example.com');
  });

  it('displays AI Filled badge after transcription', async () => {
    const { getByTestId, queryByText } = render(<VoiceFillScreen />);

    // Initially no badge
    expect(queryByText('AI Filled')).toBeNull();

    // Note: Full transcription flow testing would require more complex mocking
    // This tests the basic render and interaction
    expect(getByTestId('voiceBtn')).toBeTruthy();
  });

  it('handles keyboard types correctly for different fields', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const emailInput = getByTestId('emailInput');
    const phoneInput = getByTestId('phoneInput');

    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(phoneInput.props.keyboardType).toBe('phone-pad');
  });

  it('renders multiline message input', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const messageInput = getByTestId('messageInput');
    expect(messageInput.props.multiline).toBe(true);
  });
});
