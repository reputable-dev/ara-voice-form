"use client";

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import { VoiceButton, LiveWaveform, VoicePicker } from '../heroui-elevenlabs';

/**
 * Voice Demo Screen - Complete demonstration of ElevenLabs UI React Native components
 * 
 * This screen showcases:
 * - VoiceButton with real-time waveform visualization
 * - VoicePicker for voice selection
 * - Integration with ElevenLabs Scribe v2 Realtime
 * - State management for voice recording
 */

export const VoiceDemoScreen = () => {
  // Voice recording state
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing' | 'success' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  
  // Voice selection state
  const [selectedVoice, setSelectedVoice] = useState('rachel');
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  
  // Audio/visual state
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing recording
  const recordingStartTime = useRef<number>(0);
  const recordingInterval = useRef<NodeJS.Timeout>();

  const { sampleVoices } = require('../heroui-elevenlabs');

  // Initialize voice recording
  useEffect(() => {
    // Setup ElevenLabs Scribe v2 Realtime
    return () => {
      // Cleanup on unmount
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  // Handle voice button press
  const handleVoicePress = async () => {
    if (voiceState === 'idle') {
      await startVoiceRecording();
    } else if (voiceState === 'recording') {
      stopVoiceRecording();
    } else if (voiceState === 'error') {
      // Retry on error
      setVoiceState('idle');
      setError(null);
    }
  };

  // Start voice recording with ElevenLabs Scribe v2 Realtime
  const startVoiceRecording = async () => {
    try {
      setVoiceState('recording');
      setTranscript('');
      setPartialTranscript('');
      setRecordingDuration(0);
      recordingStartTime.current = Date.now();

      // Start recording duration timer
      recordingInterval.current = setInterval(() => {
        const duration = (Date.now() - recordingStartTime.current) / 1000;
        setRecordingDuration(duration);
      }, 100);

      // In production, this would connect to ElevenLabs Scribe v2 Realtime
      console.log('Starting voice recording with voice:', selectedVoice);
      
      // Simulate real-time transcription
      simulateRealtimeTranscription();
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setVoiceState('error');
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = async () => {
    try {
      setVoiceState('processing');
      
      // Clear recording timer
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      // Simulate processing time
      setTimeout(() => {
        setVoiceState('success');
        console.log('Final transcript:', transcript);
        
        // Reset to idle after success
        setTimeout(() => {
          setVoiceState('idle');
          setPartialTranscript('');
        }, 2000);
      }, 1000);

      // In production, this would stop ElevenLabs Scribe v2 Realtime
      console.log('Stopping voice recording');
      
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setVoiceState('error');
      setError('Failed to stop recording');
    }
  };

  // Simulate real-time transcription
  const simulateRealtimeTranscription = () => {
    const simulatedTranscripts = [
      "Hello",
      "Hello, I",
      "Hello, I would",
      "Hello, I would like",
      "Hello, I would like to",
      "Hello, I would like to order",
      "Hello, I would like to order a",
      "Hello, I would like to order a coffee",
      "Hello, I would like to order a coffee with",
      "Hello, I would like to order a coffee with milk",
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < simulatedTranscripts.length && voiceState === 'recording') {
        setPartialTranscript(simulatedTranscripts[index]);
        setTranscript(simulatedTranscripts[index]);
        
        // Simulate audio level changes
        setAudioLevel(Math.random() * 0.8 + 0.2);
        
        index++;
      } else {
        clearInterval(interval);
      }
    }, 500);
  };

  // Handle voice selection change
  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    console.log('Selected voice:', voiceId);
  };

  // Handle voice preview
  const handlePreviewVoice = (voiceId: string) => {
    console.log('Previewing voice:', voiceId);
    // In production, this would play a sample with ElevenLabs TTS
  };

  // Format recording duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get selected voice info
  const selectedVoiceInfo = sampleVoices.find((voice: any) => voice.id === selectedVoice);

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold mb-6">Voice Components Demo</Text>

      {/* Voice selection */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">Selected Voice</Text>
        {selectedVoiceInfo && (
          <View className="bg-muted/50 border border-border rounded-lg p-3">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">
                {selectedVoiceInfo.languageCode === 'en' ? '🇺🇸' : '🌐'}
              </Text>
              <View className="flex-1">
                <Text className="font-medium text-foreground">
                  {selectedVoiceInfo.name}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {selectedVoiceInfo.language} • {selectedVoiceInfo.gender} • {selectedVoiceInfo.age}
                </Text>
                {selectedVoiceInfo.description && (
                  <Text className="text-sm text-muted-foreground mt-1">
                    {selectedVoiceInfo.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Voice button */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">Voice Recording</Text>
        
        {/* State indicator */}
        <View className="flex-row items-center gap-2 mb-3">
          <View 
            className={`w-3 h-3 rounded-full ${
              voiceState === 'recording' ? 'bg-primary animate-pulse' :
              voiceState === 'processing' ? 'bg-warning animate-pulse' :
              voiceState === 'success' ? 'bg-success' :
              voiceState === 'error' ? 'bg-danger' :
              'bg-muted'
            }`}
          />
          <Text className="text-sm text-muted-foreground">
            {voiceState === 'idle' && 'Ready to record'}
            {voiceState === 'recording' && `Recording... ${formatDuration(recordingDuration)}`}
            {voiceState === 'processing' && 'Processing...'}
            {voiceState === 'success' && 'Recording complete!'}
            {voiceState === 'error' && 'Recording failed'}
          </Text>
        </View>

        <VoiceButton
          state={voiceState}
          onPress={handleVoicePress}
          label={voiceState === 'idle' ? 'Tap to Record' : ''}
          trailing="⌥Space"
          variant={
            voiceState === 'recording' ? 'primary' :
            voiceState === 'error' ? 'danger' :
            'secondary'
          }
          className="mb-3"
          showWaveform={true}
          waveformComponent={
            <LiveWaveform
              active={voiceState === 'recording'}
              processing={voiceState === 'processing'}
              height={20}
              barCount={15}
              sensitivity={1.5}
              className="w-6"
            />
          }
        />

        {/* Error display */}
        {error && (
          <View className="bg-danger/10 border border-danger/20 rounded-lg p-3 mb-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        )}
      </View>

      {/* Live waveform visualization */}
      {voiceState === 'recording' && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">Live Waveform</Text>
          <View className="bg-muted/30 border border-border rounded-lg p-4">
            <LiveWaveform
              active={true}
              processing={false}
              height={40}
              barCount={24}
              sensitivity={1.8}
              smoothingTimeConstant={0.85}
              fadeEdges={true}
            />
          </View>
        </View>
      )}

      {/* Transcript display */}
      {transcript && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">Transcript</Text>
          <View className="bg-muted/50 border border-border rounded-lg p-3">
            <Text className="text-base text-foreground">
              {voiceState === 'recording' ? (
                <>
                  {partialTranscript}
                  <Text className="animate-pulse">|</Text>
                </>
              ) : (
                transcript
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Voice picker */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-3">Voice Selection</Text>
        <VoicePicker
          voices={sampleVoices}
          selectedVoice={selectedVoice}
          onVoiceSelect={handleVoiceSelect}
          onPreviewVoice={handlePreviewVoice}
          showPreview={true}
          showLanguage={true}
          showCharacteristics={true}
          displayMode="dropdown"
        />
      </View>

      {/* Instructions */}
      <View className="bg-muted/30 rounded-lg p-4">
        <Text className="text-sm font-medium mb-2">Instructions:</Text>
        <View className="space-y-1">
          <Text className="text-xs text-muted-foreground">• Tap the voice button to start recording</Text>
          <Text className="text-xs text-muted-foreground">• Speech appears in real-time during recording</Text>
          <Text className="text-xs text-muted-foreground">• Tap again to stop and process</Text>
          <Text className="text-xs text-muted-foreground">• Select different voices from the dropdown</Text>
          <Text className="text-xs text-muted-foreground">• Click ▶️ to preview voice samples</Text>
        </View>
      </View>
    </View>
  );
};

export default VoiceDemoScreen;