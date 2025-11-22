"use client";

import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "@heroui/react";
import { LiveWaveform } from "../audio/LiveWaveform";
import type { VoiceButtonProps } from "../voice/VoiceButton";

export interface ConversationBarProps {
  /**
   * ElevenLabs Agent ID to connect to
   */
  agentId?: string;

  /**
   * Current conversation state
   */
  state?: "idle" | "connecting" | "listening" | "speaking" | "processing";

  /**
   * Current transcript text
   */
  transcript?: string;

  /**
   * Placeholder text for input
   * @default "Type or say something..."
   */
  placeholder?: string;

  /**
   * Callback when voice button is pressed
   */
  onVoicePress?: () => void;

  /**
   * Callback when text is submitted
   */
  onTextSubmit?: (text: string) => void;

  /**
   * Callback when send button is pressed
   */
  onSend?: () => void;

  /**
   * Whether voice is available
   * @default true
   */
  voiceAvailable?: boolean;

  /**
   * Whether text input is enabled
   * @default true
   */
  textEnabled?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Show keyboard shortcut hint
   * @default true
   */
  showKeyboardHint?: boolean;

  /**
   * Microphone permission state
   */
  micPermission?: "granted" | "denied" | "prompt";

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Maximum input text length
   * @default 1000
   */
  maxLength?: number;

  /**
   * Connected to agent
   */
  isConnected?: boolean;
}

export const ConversationBar: React.FC<ConversationBarProps> = ({
  agentId,
  state = "idle",
  transcript = "",
  placeholder = "Type or say something...",
  onVoicePress,
  onTextSubmit,
  onSend,
  voiceAvailable = true,
  textEnabled = true,
  className = "",
  showKeyboardHint = true,
  micPermission = "prompt",
  error,
  maxLength = 1000,
  isConnected = false,
}) => {
  const [inputText, setInputText] = useState(transcript);
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const inputRef = useRef<any>(null);

  // Update input text when transcript changes
  useEffect(() => {
    if (transcript !== inputText) {
      setInputText(transcript);
    }
  }, [transcript, inputText]);

  const handleVoiceState = (): VoiceButtonProps["state"] => {
    if (state === "listening") return "recording";
    if (state === "processing") return "processing";
    if (state === "speaking") return "success";
    if (error) return "error";
    if (state === "connecting") return "processing";
    return "idle";
  };

  const handleSend = () => {
    if (inputText.trim() && onSend) {
      onSend();
      setInputText("");
    }
  };

  const handleTextSubmit = (text: string) => {
    if (text.trim() && onTextSubmit) {
      onTextSubmit(text);
      setInputText("");
    }
  };

  const handleVoiceButtonPress = () => {
    if (micPermission === "denied") {
      console.warn("Microphone permission denied");
      return;
    }
    
    onVoicePress?.();
  };

  // Determine visibility of send button
  const canSend = inputText.trim().length > 0 && state !== "processing";

  // Determine disabled state of voice button
  const isVoiceDisabled = !voiceAvailable || 
    micPermission === "denied" || 
    state === "processing" ||
    state === "connecting";

  return (
    <View className={`bg-background border-border border-t p-4 ${className}`}>
      {/* Error display */}
      {error && (
        <View className="mb-2">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      )}

      {/* Status indicator */}
      {(state === "connecting" || state === "processing") && (
        <View className="mb-2 flex-row items-center gap-2">
          <View className="w-2 h-2 bg-warning rounded-full animate-pulse" />
          <Text className="text-muted-foreground text-sm">
            {state === "connecting" ? "Connecting..." : "Processing..."}
          </Text>
        </View>
      )}

      {/* Voice state indicator */}
      {state === "listening" && (
        <View className="mb-2 flex-row items-center gap-2">
          <View className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <Text className="text-primary text-sm">Listening...</Text>
        </View>
      )}

      {state === "speaking" && (
        <View className="mb-2 flex-row items-center gap-2">
          <View className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <Text className="text-success text-sm">Speaking...</Text>
        </View>
      )}

      <View className="flex-row gap-3 items-end">
        {/* Voice button */}
        {voiceAvailable && (
          <Button
            variant={state === "listening" ? "primary" : "secondary"}
            size="md"
            onPress={handleVoiceButtonPress}
            isDisabled={isVoiceDisabled}
            className="min-w-12"
          >
            <LiveWaveform
              active={state === "listening"}
              processing={state === "processing"}
              height={20}
              barCount={15}
              className="w-6"
            />
          </Button>
        )}

        {/* Text input area */}
        {textEnabled && (
          <View className="flex-1 bg-muted/50 rounded-lg border border-border p-3 min-h-12">
            {state === "listening" && transcript ? (
              <Text className="text-foreground flex-wrap">
                {transcript}
                <Text className="animate-pulse">|</Text>
              </Text>
            ) : (
              <Text 
                className={`text-foreground ${
                  inputText === "" ? "text-muted-foreground" : ""
                }`}
                onPress={() => {
                  // In a real implementation, this would focus a text input
                  setIsTextInputFocused(true);
                }}
              >
                {inputText || placeholder}
              </Text>
            )}
          </View>
        )}

        {/* Send button */}
        <Button
          variant="primary"
          size="md"
          onPress={handleSend}
          isDisabled={!canSend}
          className={`min-w-12 ${!canSend ? "opacity-50" : ""}`}
        >
          <Text className="text-white font-medium">
            {state === "processing" ? "⏳" : "↑"}
          </Text>
        </Button>
      </View>

      {/* Keyboard hint */}
      {showKeyboardHint && textEnabled && state === "idle" && (
        <View className="mt-2">
          <Text className="text-muted-foreground text-xs text-center">
            Press ⌥Space to start voice, or tap to type
          </Text>
        </View>
      )}

      {/* Microphone permission hint */}
      {micPermission === "denied" && (
        <View className="mt-2">
          <Text className="text-warning text-xs text-center">
            Microphone access denied. Please enable in Settings.
          </Text>
        </View>
      )}
    </View>
  );
};

// Simplified conversation bar for basic usage
export interface SimpleConversationBarProps {
  /**
   * Current text input
   */
  value?: string;

  /**
   * Callback when voice recording starts
   */
  onVoiceStart?: () => void;

  /**
   * Callback when voice recording stops with transcript
   */
  onVoiceEnd?: (transcript: string) => void;

  /**
   * Callback when text is submitted
   */
  onTextSubmit?: (text: string) => void;

  /**
   * Whether voice is currently recording
   * @default false
   */
  isRecording?: boolean;

  /**
   * Whether currently processing
   * @default false
   */
  isProcessing?: boolean;

  /**
   * Placeholder text
   * @default "Type or say something..."
   */
  placeholder?: string;
}

export const SimpleConversationBar: React.FC<SimpleConversationBarProps> = ({
  value = "",
  onVoiceStart,
  onVoiceEnd,
  onTextSubmit,
  isRecording = false,
  isProcessing = false,
  placeholder = "Type or say something...",
}) => {
  const [currentText, setCurrentText] = useState(value);
  const [recording, setRecording] = useState(false);

  const handleVoicePress = () => {
    if (!recording) {
      setRecording(true);
      onVoiceStart?.();
    } else {
      setRecording(false);
      // In a real implementation, this would return the recorded transcript
      onVoiceEnd?.("This is a simulated voice transcript");
    }
  };

  const getVoiceState = (): VoiceButtonProps["state"] => {
    if (recording) return "recording";
    if (isProcessing) return "processing";
    return "idle";
  };

  return (
    <View className="bg-background border-border border-t p-4">
      <View className="flex-row gap-3 items-end">
        {/* Voice button */}
        <Button
          variant={recording ? "primary" : "secondary"}
          size="md"
          onPress={handleVoicePress}
          className="min-w-12"
        >
          <LiveWaveform
            active={recording}
            processing={isProcessing}
            height={20}
            barCount={15}
            className="w-6"
          />
        </Button>

        {/* Current text display */}
        <View className="flex-1 bg-muted/50 rounded-lg border border-border p-3 min-h-12">
          {recording || isProcessing ? (
            <View className="flex-row items-center gap-2">
              <Text className="text-muted-foreground text-sm">
                {recording ? "Listening..." : "Processing..."}
              </Text>
              <Text className="animate-pulse">|</Text>
            </View>
          ) : (
            <Text>
              {currentText || placeholder}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        {currentText && !recording && !isProcessing && (
          <Button
            variant="primary"
            size="md"
            onPress={() => {
              onTextSubmit?.(currentText);
              setCurrentText("");
            }}
            className="min-w-12"
          >
            <Text className="text-white font-medium">↑</Text>
          </Button>
        )}
      </View>
    </View>
  );
};

export default ConversationBar;