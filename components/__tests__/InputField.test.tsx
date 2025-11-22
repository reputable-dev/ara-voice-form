import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputField from '../InputField';

// Mock VoiceEdit to test voice change callback
jest.mock('../VoiceEdit', () => {
  return function MockVoiceEdit({ children, onValueChange }: any) {
    // Store the callback for testing
    (MockVoiceEdit as any).lastOnValueChange = onValueChange;
    return children;
  };
});

describe('InputField Component', () => {
  it('renders correctly with label and value', () => {
    const { getByText, getByDisplayValue } = render(
      <InputField
        label="Test Label"
        value="Test Value"
        onChangeText={jest.fn()}
      />
    );

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('Test Value')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <InputField
        label="Name"
        value=""
        onChangeText={mockOnChange}
        testID="name-input"
      />
    );

    const input = getByTestId('name-input');
    fireEvent.changeText(input, 'John Doe');

    expect(mockOnChange).toHaveBeenCalledWith('John Doe');
  });

  it('renders without voice edit when disabled', () => {
    const { getByTestId } = render(
      <InputField
        label="Email"
        value="test@example.com"
        onChangeText={jest.fn()}
        enableVoiceEdit={false}
        testID="email-input"
      />
    );

    expect(getByTestId('email-input')).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <InputField
        label="Custom"
        value=""
        onChangeText={jest.fn()}
        style={customStyle}
        testID="custom-input"
      />
    );

    const input = getByTestId('custom-input');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });

  it('uses placeholder text correctly', () => {
    const { getByPlaceholderText } = render(
      <InputField
        label="Search"
        value=""
        onChangeText={jest.fn()}
        placeholder="Enter search term..."
      />
    );

    expect(getByPlaceholderText('Enter search term...')).toBeTruthy();
  });

  it('calls onChangeText when voice edit triggers change', () => {
    const mockOnChange = jest.fn();
    const MockVoiceEdit = require('../VoiceEdit');

    render(
      <InputField
        label="Address"
        value="123 Main St"
        onChangeText={mockOnChange}
        enableVoiceEdit={true}
      />
    );

    // Trigger the voice change callback
    const onValueChange = (MockVoiceEdit as any).lastOnValueChange;
    onValueChange('456 Oak Ave');

    expect(mockOnChange).toHaveBeenCalledWith('456 Oak Ave');
  });

  it('handles voice edit when onChangeText is undefined', () => {
    const MockVoiceEdit = require('../VoiceEdit');

    // Should not crash when onChangeText is undefined
    const { getByTestId } = render(
      <InputField
        label="Notes"
        value="test"
        testID="notes-input"
      />
    );

    expect(getByTestId('notes-input')).toBeTruthy();

    // Trigger voice change with no onChangeText
    const onValueChange = (MockVoiceEdit as any).lastOnValueChange;
    expect(() => onValueChange('new value')).not.toThrow();
  });
});
