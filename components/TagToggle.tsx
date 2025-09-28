import React, { memo } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { Check } from "lucide-react-native";

interface Props {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  testID?: string;
}

function TagToggleComponent({ label, checked, onChange, testID }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      activeOpacity={0.8}
      style={[styles.wrap, checked ? styles.wrapOn : undefined]}
      testID={testID ?? "tagToggle"}
    >
      <View style={[styles.box, checked ? styles.boxOn : undefined]}>
        {checked ? <Check size={14} color="#A7F3D0" /> : null}
      </View>
      <Text style={[styles.text, checked ? styles.textOn : undefined]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default memo(TagToggleComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  wrapOn: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(52,211,153,0.5)",
  },
  box: {
    height: 18,
    width: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  boxOn: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderColor: "rgba(52,211,153,0.6)",
  },
  text: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  textOn: {
    color: Colors.light.text,
  },
});