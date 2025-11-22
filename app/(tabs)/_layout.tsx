import { Tabs } from "expo-router";
import { Mic, MessageCircle, FileText, LayoutDashboard, Database, AudioLines } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tabIconSelected,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Voice Fill",
          tabBarIcon: ({ color }) => <Mic color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => <MessageCircle color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} />,
        }}
      />
      <Tabs.Screen
        name="contract"
        options={{
          title: "Contract",
          tabBarIcon: ({ color }) => <FileText color={color} />,
        }}
      />
      <Tabs.Screen
        name="transcript-demo"
        options={{
          title: "Transcript",
          tabBarIcon: ({ color }) => <AudioLines color={color} />,
        }}
      />
      <Tabs.Screen
        name="rag-demo"
        options={{
          title: "RAG",
          tabBarIcon: ({ color }) => <Database color={color} />,
        }}
      />
    </Tabs>
  );
}