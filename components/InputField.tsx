import React, { memo } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label: string;
  testID?: string;
}

function InputFieldComponent({ label, style, testID, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[styles.input, style]}
        placeholderTextColor="#6B7280"
        testID={testID ?? "inputField"}
      />
    </View>
  );
}

export default memo(InputFieldComponent);

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 10,
    color: "#E5E7EB",
    fontSize: 14,
  },
});