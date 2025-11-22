import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import FloatingAINavbar from "@/components/FloatingAINavbar";
import { trpc, trpcClient } from "@/lib/trpc";
import { initSentry } from "@/lib/sentry";

// Initialize Sentry error monitoring
initSentry();

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  console.log('RootLayoutNav rendering');
  
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
        <Stack.Screen name="modal" options={{ presentation: "transparentModal", headerShown: false }} />
      </Stack>
      <FloatingAINavbar visible={true} />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.gestureHandler}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  gestureHandler: { flex: 1 },
  container: { flex: 1 },
});