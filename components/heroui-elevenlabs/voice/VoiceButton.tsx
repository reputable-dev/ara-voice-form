"use client";

import React, { useEffect, useState } from "react";
import { Platform, Pressable, View, Text } from "react-native";
import { Button } from "@heroui/react";

// Types for voice button states
export type VoiceButtonState = 
  | "idle" 
  | "recording" 
  | "processing" 
  | "success" 
  | "error";

export interface VoiceButtonProps {
  /**
   * Current state of the voice button
   * @default "idle"
   */
  state?: VoiceButtonState;

  /**
   * Callback when button is pressed
   */
  onPress?: () => void;

  /**
   * Content to display on the left side (label)
   * Can be a string or ReactNode for custom components
   */
  label?: React.ReactNode;

  /**
   * Content to display on the right side (e.g., keyboard shortcut)
   * Can be a string or ReactNode for custom components
   * @example "⌥Space" or <kbd>⌘K</kbd>
   */
  trailing?: React.ReactNode;

  /**
   * Icon to display in the center when idle (for icon size buttons)
   */
  icon?: React.ReactNode;

  /**
   * Custom variant for the button
   * @default "secondary"
   */
  variant?: 
    | "primary" 
    | "secondary" 
    | "tertiary" 
    | "ghost" 
    | "danger";

  /**
   * Size of the button
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Custom className for the button
   */
  className?: string;

  /**
   * Duration in ms to show success/error states
   * @default 1500
   */
  feedbackDuration?: number;

  /**
   * Disable the button
   */
  disabled?: boolean;

  /**
   * Show waveform visualization during recording
   */
  showWaveform?: boolean;

  /**
   * Waveform component (custom implementation)
   */
  waveformComponent?: React.ReactNode;
}

export const VoiceButton = React.forwardRef<any, VoiceButtonProps>(
  (
    {
      state = "idle",
      onPress,
      label,
      trailing,
      icon,
      variant = "secondary",
      size = "md",
      className,
      feedbackDuration = 1500,
      disabled = false,
      showWaveform = true,
      waveformComponent,
      ...props
    },
    ref
  ) => {
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
      if (state === "success" || state === "error") {
        setShowFeedback(true);
        const timeout = setTimeout(
          () => setShowFeedback(false),
          feedbackDuration
        );
        return () => clearTimeout(timeout);
      } else {
        setShowFeedback(false);
      }
    }, [state, feedbackDuration]);

    const handleClick = () => {
      onPress?.();
    };

    const isRecording = state === "recording";
    const isProcessing = state === "processing";
    const isSuccess = state === "success";
    const isError = state === "error";

    const isDisabled = disabled || isProcessing;

    // Determine button content based on state
    const getButtonContent = () => {
      if (isRecording && showWaveform && waveformComponent) {
        return waveformComponent;
      }

      if (isSuccess && showFeedback) {
        return "✓";
      }

      if (isError && showFeedback) {
        return "✕";
      }

      if (isProcessing) {
        return "⏳";
      }

      // Default state - show icon or label
      if (icon) {
        return icon;
      }

      if (label && typeof label === "string") {
        return label;
      }

      return "🎤";
    };

    // Get button variant based on state
    const getButtonVariant = () => {
      if (isError) return "danger";
      if (isSuccess) return "primary"; 
      if (isRecording) return "tertiary";
      return variant;
    };

    return (
      <Button
        ref={ref}
        variant={getButtonVariant()}
        size={size}
        onPress={handleClick}
        isDisabled={isDisabled}
        className={className}
        {...props}
      >
        <View className="flex-row items-center gap-2">
          {/* Label on the left */}
          {label && typeof label !== "string" && size !== "sm" && (
            <View className="flex-shrink-0">
              {label}
            </View>
          )}

          {/* Main content */}
          <Text className="text-center">
            {getButtonContent()}
          </Text>

          {/* Trailing content */}
          {trailing && !isRecording && !isProcessing && size !== "sm" && (
            <View className="flex-shrink-0">
              {typeof trailing === "string" ? (
                <Text className="text-muted-foreground font-mono text-xs font-medium">
                  {trailing}
                </Text>
              ) : (
                trailing
              )}
            </View>
          )}
        </View>
      </Button>
    );
  }
);

VoiceButton.displayName = "VoiceButton";

// Example usage with basic waveform
export interface BasicVoiceButtonProps extends Omit<VoiceButtonProps, 'waveformComponent'> {}

export const BasicVoiceButton: React.FC<BasicVoiceButtonProps> = (props) => {
  const { state } = props;
  
  const BasicWaveform = () => (
    <View className="flex-row gap-0.5 items-center">
      {[...Array(5)].map((_, i) => (
        <View
          key={i}
          className={`w-0.5 rounded-full transition-all duration-150 ${
            state === "recording" 
              ? "bg-primary h-4" 
              : "bg-muted h-2"
          }`}
          style={{
            height: state === "recording" ? 16 + Math.random() * 8 : 8,
          }}
        />
      ))}
    </View>
  );

  return (
    <VoiceButton
      {...props}
      waveformComponent={<BasicWaveform />}
    />
  );
};

// Example usage for different states
export const VoiceButtonExample = () => {
  const [state, setState] = useState<VoiceButtonState>("idle");

  const handlePress = () => {
    if (state === "idle") {
      setState("recording");
      // Simulate recording process
      setTimeout(() => setState("processing"), 2000);
      setTimeout(() => setState("success"), 3000);
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <View className="gap-4 p-4">
      <Text className="text-lg font-bold mb-2">Voice Button Examples</Text>
      
      <BasicVoiceButton
        state={state}
        onPress={handlePress}
        label="Voice Input"
        trailing="⌥Space"
      />

      <VoiceButton
        state="idle"
        onPress={() => console.log("Icon button pressed")}
        icon="🎤"
        size="sm"
        variant=" ghost"
      />

      <VoiceButton
        state="recording"
        onPress={() => {}}
        label="Recording..."
        variant="tertiary"
      />

      <VoiceButton
        state="success"
        onPress={() => {}}
        label="Success!"
        variant="primary"
      />

      <VoiceButton
        state="error"
        onPress={() => {}}
        label="Try again"
        variant="danger"
      />
    </View>
  );
};