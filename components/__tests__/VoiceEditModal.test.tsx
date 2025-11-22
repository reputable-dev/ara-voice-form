import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import VoiceEditModal from '../VoiceEditModal';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

describe('VoiceEditModal Component', () => {
  const defaultProps = {
    visible: true,
    position: { x: 100, y: 200 },
    transcriptionText: '',
    isRecording: false,
    isProcessing: false,
    animatedValue: new Animated.Value(1),
  };

  it('returns null when visible is false', () => {
    const { UNSAFE_root } = render(
      <VoiceEditModal {...defaultProps} visible={false} />
    );

    expect(UNSAFE_root.children.length).toBe(0);
  });

  it('renders when visible is true', () => {
    const { UNSAFE_root } = render(<VoiceEditModal {...defaultProps} />);

    expect(UNSAFE_root.children.length).toBeGreaterThan(0);
  });

  it('displays "Hold to edit" status when not recording and not processing', () => {
    const { getByText } = render(<VoiceEditModal {...defaultProps} />);

    expect(getByText('Hold to edit')).toBeTruthy();
  });

  it('displays "Speak now..." status when recording', () => {
    const { getByText } = render(
      <VoiceEditModal {...defaultProps} isRecording={true} />
    );

    expect(getByText('Speak now...')).toBeTruthy();
  });

  it('displays "Processing..." status when processing', () => {
    const { getByText } = render(
      <VoiceEditModal {...defaultProps} isProcessing={true} />
    );

    expect(getByText('Processing...')).toBeTruthy();
  });

  it('displays transcription text when provided', () => {
    const { getByText } = render(
      <VoiceEditModal
        {...defaultProps}
        transcriptionText="Test transcription"
      />
    );

    expect(getByText('Test transcription')).toBeTruthy();
  });

  it('does not display transcription text when empty', () => {
    const { queryByText } = render(
      <VoiceEditModal {...defaultProps} transcriptionText="" />
    );

    // No transcription text should be visible
    expect(queryByText('')).toBeFalsy();
  });

  it('renders wave container when recording', () => {
    const { UNSAFE_getAllByType } = render(
      <VoiceEditModal {...defaultProps} isRecording={true} />
    );

    // Should have multiple Animated.View components for wave bars (7 total)
    const animatedViews = UNSAFE_getAllByType(Animated.View);
    expect(animatedViews.length).toBeGreaterThan(1);
  });

  it('does not render wave container when not recording', () => {
    const { UNSAFE_queryAllByType } = render(
      <VoiceEditModal {...defaultProps} isRecording={false} />
    );

    // Main container is Animated.View, but no wave bars
    const animatedViews = UNSAFE_queryAllByType(Animated.View);
    // Only the main container, not 7 wave bars
    expect(animatedViews.length).toBeLessThan(7);
  });

  it('positions modal correctly based on position prop', () => {
    const { UNSAFE_getByType } = render(
      <VoiceEditModal {...defaultProps} position={{ x: 150, y: 250 }} />
    );

    const container = UNSAFE_getByType(Animated.View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          top: 250,
          left: 150,
        }),
      ])
    );
  });

  it('applies correct styles to modal container', () => {
    const { UNSAFE_getByType } = render(<VoiceEditModal {...defaultProps} />);

    const container = UNSAFE_getByType(Animated.View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: 'absolute',
          width: 300,
          zIndex: 10000,
        }),
      ])
    );
  });

  it('sets pointerEvents to none', () => {
    const { UNSAFE_getByType } = render(<VoiceEditModal {...defaultProps} />);

    const container = UNSAFE_getByType(Animated.View);
    expect(container.props.pointerEvents).toBe('none');
  });

  it('displays both transcription and status when both present', () => {
    const { getByText } = render(
      <VoiceEditModal
        {...defaultProps}
        transcriptionText="Sample text"
        isRecording={true}
      />
    );

    expect(getByText('Sample text')).toBeTruthy();
    expect(getByText('Speak now...')).toBeTruthy();
  });

  it('handles long transcription text', () => {
    const longText = 'This is a very long transcription text that should be displayed correctly in the modal component';
    const { getByText } = render(
      <VoiceEditModal {...defaultProps} transcriptionText={longText} />
    );

    expect(getByText(longText)).toBeTruthy();
  });

  it('handles special characters in transcription', () => {
    const specialText = 'Test with special chars: @#$%^&*()_+{}:"<>?';
    const { getByText } = render(
      <VoiceEditModal {...defaultProps} transcriptionText={specialText} />
    );

    expect(getByText(specialText)).toBeTruthy();
  });

  it('prioritizes processing status over recording status', () => {
    const { getByText, queryByText } = render(
      <VoiceEditModal
        {...defaultProps}
        isRecording={true}
        isProcessing={true}
      />
    );

    expect(getByText('Processing...')).toBeTruthy();
    expect(queryByText('Speak now...')).toBeFalsy();
  });
});
