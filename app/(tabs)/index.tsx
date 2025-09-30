import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Mic, MessageSquare, Sparkles, Send, Info, Book } from "lucide-react-native";

type Message = { id: string; role: "assistant" | "user"; text: string; time?: string };

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      role: "assistant",
      text: "Ask ARA is ready. Type or speak your question. Answers include citations to the knowledge base.",
    },
  ]);
  const [isAsking, setIsAsking] = useState<boolean>(false);

  const onClear = useCallback(() => {
    setQuestion("");
  }, []);

  const onAsk = useCallback(async () => {
    if (!question.trim()) return;
    try {
      setIsAsking(true);
      const now = new Date();
      setMessages((prev) => [
        ...prev,
        { id: String(now.getTime()) + "-u", role: "user", text: question, time: now.toLocaleTimeString() },
      ]);
      await new Promise((r) => setTimeout(r, 600));
      const answer =
        "The mobilisation checklist includes site induction, scope confirmation, cleaning chemical register, asset list capture, and SLA sign-off.\nSources: Mobilisation_Checklist.docx, SLA_Register_Q4.xlsx, Client Portal";
      setMessages((prev) => [...prev, { id: String(now.getTime()) + "-a", role: "assistant", text: answer }]);
      setQuestion("");
    } catch (e) {
      console.log("ask error", e);
    } finally {
      setIsAsking(false);
    }
  }, [question]);

  const headerRight = useMemo(
    () => function HeaderRight() {
      return (
        <View style={styles.headerRightContainer}>
          <Book color={Colors.light.subtle} />
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
            title: "Ask ARA",
            headerRight,
          }}
        />
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} 
          testID="assistantScroll"
        >
          <Card style={styles.hero}>
            <Text style={styles.h1}>Ask ARA — Knowledge Assistant</Text>
            <View style={styles.badge}>
              <Sparkles color="#A7F3D0" />
              <Text style={styles.badgeText}>ARA Property Services • Ask questions • Get answers</Text>
            </View>
            <Text style={styles.subtleCenter}>
              A simple way to ask questions and get answers from the Ask ARA knowledge base. Use voice or text.
            </Text>
          </Card>

          <View style={styles.grid}>
            <Card style={styles.left}>
              <View style={styles.headerRow}>
                <View style={styles.headerRowLeft}>
                  <MessageSquare color="#A7F3D0" />
                  <Text style={styles.headerTitle}>Ask a question</Text>
                </View>
                <Text style={styles.caption}>Answers come from the knowledge base</Text>
              </View>
              <TextInput
                testID="assistantInput"
                value={question}
                onChangeText={setQuestion}
                placeholder="Examples:
• What are the chemical handling procedures for Site X?
• Show me the latest cleaning scope for Building B."
                placeholderTextColor="#6B7280"
                multiline
                style={styles.textarea}
              />
              <View style={styles.actionsRow}>
                <View style={styles.actionsLeft}>
                  <TouchableOpacity onPress={onClear} style={styles.btn} testID="clearQuestion">
                    <Text style={styles.btnText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {}} style={styles.btnIcon} testID="voiceBtn">
                    <Mic color="#D1D5DB" size={16} />
                    <Text style={styles.btnText}>Voice</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={onAsk} disabled={isAsking} style={styles.btnPrimary} testID="askBtn">
                  <Send color="#A7F3D0" size={16} />
                  <Text style={styles.btnPrimaryText}>{isAsking ? "Asking..." : "Ask"}</Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card style={styles.right}>
              <View style={styles.headerRow}>
                <View style={styles.headerRowLeft}>
                  <Sparkles color="#A7F3D0" />
                  <Text style={styles.headerTitle}>Answer</Text>
                </View>
                <View style={styles.headerRowRight}>
                  <Info color="#9CA3AF" size={16} />
                  <Text style={styles.caption}>Retrieved from authorised sources</Text>
                </View>
              </View>

              <View style={styles.answersWrap}>
                {messages.map((m) => (
                  <View key={m.id} style={[styles.msg, m.role === "assistant" ? styles.msgAssistant : styles.msgUser]} testID={`msg-${m.id}`}>
                    <Text style={styles.msgRole}>{m.role === "assistant" ? "Ask ARA" : "You"}</Text>
                    <Text style={styles.msgText}>{m.text}</Text>
                    {m.time ? <Text style={styles.msgTime}>{m.time}</Text> : null}
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.caption}>Citations and permissions are shown with each answer.</Text>
                <View style={styles.footerActions}>
                  <TouchableOpacity style={styles.btnSm} testID="clearAnswers">
                    <Text style={styles.btnSmText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSmPrimary} testID="speakBtn">
                    <Mic color="#A7F3D0" size={14} />
                    <Text style={styles.btnSmPrimaryText}>Speak</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>

          <Card>
            <View style={styles.tipRow}>
              <Info color="#9CA3AF" />
              <Text style={styles.tipText}>Keep questions specific. Include version, site, and owner to speed up validation.</Text>
            </View>
          </Card>
        </ScrollView>
      </>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a1a',
  },
  content: { padding: 16, gap: 12 },
  hero: { 
    gap: 10, 
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  h1: { 
    color: "#F3F4F6", 
    fontSize: 22, 
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 999,
  },
  badgeText: { color: "#A7F3D0", fontStyle: "italic", fontSize: 13 },
  subtleCenter: { color: "#D1D5DB", opacity: 0.85, fontSize: 14 },
  grid: { gap: 12 },
  left: { gap: 10 },
  right: { gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: "#E5E7EB", fontSize: 14, fontWeight: "600" },
  caption: { color: "#9CA3AF", fontSize: 12 },
  textarea: {
    minHeight: 160,
    padding: 12,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#E5E7EB",
    fontSize: 14,
    textAlignVertical: "top",
  },
  actionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionsLeft: { flexDirection: "row", gap: 8 },
  btn: {
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnIcon: {
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  btnText: { color: "#D1D5DB", fontSize: 12, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "rgba(16,185,129,0.20)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#A7F3D0", fontSize: 12, fontWeight: "700" },
  answersWrap: { gap: 8 },
  msg: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderRadius: 12,
    padding: 10,
  },
  msgAssistant: {},
  msgUser: { borderColor: "rgba(16,185,129,0.35)" },
  msgRole: { color: "#E5E7EB", fontSize: 13, fontWeight: "600" },
  msgText: { color: "#D1D5DB", marginTop: 4, lineHeight: 20, fontSize: 14 },
  msgTime: { color: "#9CA3AF", marginTop: 6, fontSize: 11 },
  footerRow: { marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btnSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  btnSmText: { color: "#D1D5DB", fontSize: 12 },
  btnSmPrimary: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(16,185,129,0.20)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  btnSmPrimaryText: { color: "#A7F3D0", fontSize: 12, fontWeight: "700" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { color: "#9CA3AF", fontSize: 12, flex: 1 },
  headerRightContainer: { flexDirection: "row", gap: 8, paddingRight: 6 },
  footerActions: { flexDirection: "row", gap: 8 },
});