import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import ErrorBoundary from "@/components/ErrorBoundary";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Mic, MessageSquare, Sparkles, Info, User } from "lucide-react-native";

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  message: string;
};

export default function VoiceFillScreen() {
  const insets = useSafeAreaInsets();
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    message: "",
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleTranscription = useCallback(async (text: string) => {
    console.log('Transcribed text:', text);
    setTranscribedText(text);
    setShowRecorder(false);
    setIsProcessing(true);

    try {
      const apiKey = 'AIzaSyCC5LnBazvUeGJrg-QDQMB7bp64FV5DMVk';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
      
      const prompt = `Extract structured information from the following text and return it as JSON with these exact fields: name, email, phone, address, occupation, message. If a field is not mentioned, use an empty string. Only return the JSON object, nothing else.\n\nText: ${text}`;
      
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        },
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          setFormData({
            name: parsedData.name || "",
            email: parsedData.email || "",
            phone: parsedData.phone || "",
            address: parsedData.address || "",
            occupation: parsedData.occupation || "",
            message: parsedData.message || text,
          });
        } else {
          setFormData(prev => ({ ...prev, message: text }));
        }
      }
    } catch (error) {
      console.error('Error processing transcription:', error);
      setFormData(prev => ({ ...prev, message: text }));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleClearForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      occupation: "",
      message: "",
    });
    setTranscribedText("");
  }, []);

  const headerRight = useMemo(
    () => function HeaderRight() {
      return (
        <View style={styles.headerRightContainer}>
          <Sparkles color={Colors.light.tint} />
        </View>
      );
    },
    []
  );

  return (
    <ErrorBoundary>
      <>
        <Stack.Screen
          options={{
            title: "Voice Fill",
            headerRight,
          }}
        />
        <View style={styles.backgroundWrapper}>
          <View style={[styles.safeAreaTop, { height: insets.top }]} />
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} 
            testID="voiceFillScroll"
          >

          <Card style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View style={styles.headerRowLeft}>
                    <User color="#A7F3D0" />
                    <Text style={styles.headerTitle}>Contact Information</Text>
                  </View>
                  {transcribedText && (
                    <View style={styles.aiBadge}>
                      <Sparkles color="#A7F3D0" size={14} />
                      <Text style={styles.aiBadgeText}>AI Filled</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="John Doe"
                    placeholderTextColor="#6B7280"
                    testID="nameInput"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="john@example.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="emailInput"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    testID="phoneInput"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholder="123 Main St, City, State"
                    placeholderTextColor="#6B7280"
                    testID="addressInput"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Occupation</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.occupation}
                    onChangeText={(text) => setFormData({ ...formData, occupation: text })}
                    placeholder="Software Engineer"
                    placeholderTextColor="#6B7280"
                    testID="occupationInput"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.message}
                    onChangeText={(text) => setFormData({ ...formData, message: text })}
                    placeholder="Additional information..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    testID="messageInput"
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    onPress={handleClearForm} 
                    style={styles.btn}
                    testID="clearForm"
                  >
                    <Text style={styles.btnText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowRecorder(true)} 
                    style={styles.btnPrimary}
                    disabled={isProcessing}
                    testID="voiceBtn"
                  >
                    <Mic color="#A7F3D0" size={16} />
                    <Text style={styles.btnPrimaryText}>
                      {isProcessing ? 'Processing...' : 'Voice Fill'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>

              {transcribedText && (
                <Card style={styles.transcriptionCard}>
                  <View style={styles.headerRowLeft}>
                    <MessageSquare color="#A7F3D0" />
                    <Text style={styles.headerTitle}>Transcription</Text>
                  </View>
                  <Text style={styles.transcriptionText}>{transcribedText}</Text>
                </Card>
              )}

          <Card>
            <View style={styles.tipRow}>
              <Info color="#9CA3AF" />
              <Text style={styles.tipText}>
                Try saying: "My name is John Doe, email john@example.com, phone 555-1234, I live at 123 Main Street, and I work as a software engineer."
              </Text>
            </View>
          </Card>
          </ScrollView>
        </View>

        <Modal
          visible={showRecorder}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRecorder(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1}
              onPress={() => setShowRecorder(false)}
            />
            <View style={styles.recorderModal}>
              <VoiceRecorder 
                onTranscriptionComplete={handleTranscription}
                onRecordingStateChange={(recording) => {
                  if (!recording && Platform.OS !== 'web') {
                    console.log('Recording stopped');
                  }
                }}
              />
              <TouchableOpacity 
                onPress={() => setShowRecorder(false)} 
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  safeAreaTop: {
    backgroundColor: '#1a1a1a',
  },
  container: { 
    flex: 1,
  },
  content: { padding: 16, gap: 12 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  recorderModal: {
    backgroundColor: "rgba(0,0,0,0.95)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  formCard: {
    gap: 16,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#E5E7EB", fontSize: 16, fontWeight: "600" as const },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.30)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: { color: "#D1FAE5", fontSize: 12, fontWeight: "600" as const },
  formField: {
    gap: 8,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  input: {
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#E5E7EB",
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  btn: {
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: "#D1D5DB", fontSize: 13, fontWeight: "600" as const },
  btnPrimary: {
    backgroundColor: "rgba(16,185,129,0.20)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#A7F3D0", fontSize: 13, fontWeight: "700" as const },
  cancelButton: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(239,68,68,0.20)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 10,
    marginTop: 16,
  },
  cancelButtonText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  transcriptionCard: {
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transcriptionText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: { color: "#9CA3AF", fontSize: 12, flex: 1, lineHeight: 18 },
  headerRightContainer: { flexDirection: "row", gap: 8, paddingRight: 6 },
});