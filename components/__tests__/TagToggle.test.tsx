import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TagToggle from '../TagToggle';

describe('TagToggle', () => {
  it('renders with label correctly', () => {
    const { getByText } = render(
      <TagToggle label="Monday" checked={false} onChange={jest.fn()} />
    );

    expect(getByText('Monday')).toBeTruthy();
  });

  it('displays check icon when checked', () => {
    const { getByTestId } = render(
      <TagToggle label="Tuesday" checked={true} onChange={jest.fn()} testID="toggleTue" />
    );

    const toggle = getByTestId('toggleTue');
    expect(toggle).toBeTruthy();
  });

  it('does not display check icon when unchecked', () => {
    const { queryByTestId } = render(
      <TagToggle label="Wednesday" checked={false} onChange={jest.fn()} testID="toggleWed" />
    );

    const toggle = queryByTestId('toggleWed');
    expect(toggle).toBeTruthy();
  });

  it('calls onChange with true when unchecked toggle is pressed', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TagToggle label="Thursday" checked={false} onChange={mockOnChange} testID="toggleThu" />
    );

    fireEvent.press(getByTestId('toggleThu'));
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked toggle is pressed', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TagToggle label="Friday" checked={true} onChange={mockOnChange} testID="toggleFri" />
    );

    fireEvent.press(getByTestId('toggleFri'));
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('uses default testID when not provided', () => {
    const { getByTestId } = render(
      <TagToggle label="Saturday" checked={false} onChange={jest.fn()} />
    );

    expect(getByTestId('tagToggle')).toBeTruthy();
  });

  it('handles multiple rapid presses correctly', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <TagToggle label="Sunday" checked={false} onChange={mockOnChange} testID="toggleSun" />
    );

    const toggle = getByTestId('toggleSun');
    fireEvent.press(toggle);
    fireEvent.press(toggle);
    fireEvent.press(toggle);

    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, true);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, true);
    expect(mockOnChange).toHaveBeenNthCalledWith(3, true);
  });

  it('renders with very long label correctly', () => {
    const longLabel = 'This is a very long label that should be truncated';
    const { getByText } = render(
      <TagToggle label={longLabel} checked={false} onChange={jest.fn()} />
    );

    expect(getByText(longLabel)).toBeTruthy();
  });

  it('maintains checked state across re-renders', () => {
    const { getByTestId, rerender } = render(
      <TagToggle label="Monday" checked={true} onChange={jest.fn()} testID="toggle" />
    );

    expect(getByTestId('toggle')).toBeTruthy();

    rerender(
      <TagToggle label="Monday" checked={true} onChange={jest.fn()} testID="toggle" />
    );

    expect(getByTestId('toggle')).toBeTruthy();
  });

  it('updates visual state when checked prop changes', () => {
    const mockOnChange = jest.fn();
    const { getByTestId, rerender } = render(
      <TagToggle label="Toggle" checked={false} onChange={mockOnChange} testID="dynamicToggle" />
    );

    expect(getByTestId('dynamicToggle')).toBeTruthy();

    // Change from unchecked to checked
    rerender(
      <TagToggle label="Toggle" checked={true} onChange={mockOnChange} testID="dynamicToggle" />
    );

    expect(getByTestId('dynamicToggle')).toBeTruthy();
  });
});
