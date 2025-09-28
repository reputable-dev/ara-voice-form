import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; errorMsg: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log("ErrorBoundary caught", error?.message, info?.componentStack);
  }

  onReset = () => {
    this.setState({ hasError: false, errorMsg: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="errorBoundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.errorMsg}</Text>
          <TouchableOpacity onPress={this.onReset} style={styles.button} testID="errorReset">
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  message: { color: "#D1D5DB", textAlign: "center", marginBottom: 16 },
  button: { backgroundColor: "#10B981", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  buttonText: { color: "#00110A", fontWeight: "700" },
});