import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TranscriptViewer, AudioPlayer, Word } from '@/components/elevenlabs';
import Colors from '@/constants/colors';

// Demo transcript data with word timings
const DEMO_TRANSCRIPT: Word[] = [
  { text: 'Welcome', startTime: 0, endTime: 0.5 },
  { text: 'to', startTime: 0.5, endTime: 0.7 },
  { text: 'the', startTime: 0.7, endTime: 0.9 },
  { text: 'transcript', startTime: 0.9, endTime: 1.4 },
  { text: 'viewer', startTime: 1.4, endTime: 1.8 },
  { text: 'demo.', startTime: 1.8, endTime: 2.3 },
  { text: 'This', startTime: 2.5, endTime: 2.8 },
  { text: 'component', startTime: 2.8, endTime: 3.3 },
  { text: 'highlights', startTime: 3.3, endTime: 3.9 },
  { text: 'words', startTime: 3.9, endTime: 4.2 },
  { text: 'as', startTime: 4.2, endTime: 4.4 },
  { text: 'they', startTime: 4.4, endTime: 4.6 },
  { text: 'are', startTime: 4.6, endTime: 4.8 },
  { text: 'spoken', startTime: 4.8, endTime: 5.2 },
  { text: 'in', startTime: 5.2, endTime: 5.3 },
  { text: 'the', startTime: 5.3, endTime: 5.5 },
  { text: 'audio.', startTime: 5.5, endTime: 6.0 },
  { text: 'You', startTime: 6.2, endTime: 6.4 },
  { text: 'can', startTime: 6.4, endTime: 6.6 },
  { text: 'tap', startTime: 6.6, endTime: 6.8 },
  { text: 'any', startTime: 6.8, endTime: 7.0 },
  { text: 'word', startTime: 7.0, endTime: 7.3 },
  { text: 'to', startTime: 7.3, endTime: 7.4 },
  { text: 'seek', startTime: 7.4, endTime: 7.7 },
  { text: 'to', startTime: 7.7, endTime: 7.8 },
  { text: 'that', startTime: 7.8, endTime: 8.0 },
  { text: 'position', startTime: 8.0, endTime: 8.5 },
  { text: 'in', startTime: 8.5, endTime: 8.6 },
  { text: 'the', startTime: 8.6, endTime: 8.8 },
  { text: 'playback.', startTime: 8.8, endTime: 9.5 },
  { text: 'The', startTime: 9.7, endTime: 9.9 },
  { text: 'transcript', startTime: 9.9, endTime: 10.5 },
  { text: 'automatically', startTime: 10.5, endTime: 11.3 },
  { text: 'scrolls', startTime: 11.3, endTime: 11.7 },
  { text: 'to', startTime: 11.7, endTime: 11.8 },
  { text: 'keep', startTime: 11.8, endTime: 12.1 },
  { text: 'the', startTime: 12.1, endTime: 12.2 },
  { text: 'current', startTime: 12.2, endTime: 12.6 },
  { text: 'word', startTime: 12.6, endTime: 12.9 },
  { text: 'visible', startTime: 12.9, endTime: 13.4 },
  { text: 'as', startTime: 13.4, endTime: 13.6 },
  { text: 'you', startTime: 13.6, endTime: 13.7 },
  { text: 'listen.', startTime: 13.7, endTime: 14.3 },
];

export default function TranscriptDemoScreen() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioPosition, setAudioPosition] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Simulate audio playback for demo purposes
  // In a real app, this would come from an actual audio player
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 0.1;
        // Loop back to start after 15 seconds
        return newTime >= 15 ? 0 : newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleWordPress = (word: Word, index: number) => {
    console.log(`Word tapped: "${word.text}" at ${word.startTime}s`);
    // In a real implementation, seek audio to word.startTime
    setCurrentTime(word.startTime);
  };

  const handlePlaybackUpdate = (positionMillis: number, durationMillis: number) => {
    setAudioPosition(positionMillis);
    setAudioDuration(durationMillis);
    setCurrentTime(positionMillis / 1000); // Convert to seconds
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transcript Viewer Demo</Text>
        <Text style={styles.subtitle}>
          Words highlight as they're spoken. Tap any word to seek.
        </Text>
      </View>

      <View style={styles.transcriptContainer}>
        <TranscriptViewer
          words={DEMO_TRANSCRIPT}
          currentTime={currentTime}
          onWordPress={handleWordPress}
          autoScroll={true}
          highlightColor={Colors.light.tint}
          fontSize={18}
          lineHeight={32}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Current time: {currentTime.toFixed(1)}s
        </Text>
        <Text style={styles.infoText}>
          Active word:{' '}
          {DEMO_TRANSCRIPT.find(
            (w) => currentTime >= w.startTime && currentTime < w.endTime
          )?.text || 'None'}
        </Text>
      </View>

      {/* Uncomment to use with real audio
      <AudioPlayer
        audioUri="YOUR_AUDIO_URI_HERE"
        onPlaybackUpdate={handlePlaybackUpdate}
        showControls={true}
      />
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
  },
  transcriptContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
});
