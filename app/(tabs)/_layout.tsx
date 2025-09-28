import { Tabs } from "expo-router";
import { Bot, FileCog, Home } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tabIconSelected,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: { display: 'none' }, // Hide the default tab bar
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { color: Colors.light.text },
        headerTintColor: Colors.light.tabIconSelected,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => <Bot color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="contract"
        options={{
          title: "Contract",
          tabBarIcon: ({ color }) => <FileCog color={color} />,
        }}
      />
    </Tabs>
  );
}