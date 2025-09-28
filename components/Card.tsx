import React, { memo } from "react";
import { View, ViewProps, StyleSheet } from "react-native";

function CardComponent({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export default memo(CardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: "rgba(17,17,17,0.9)",
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 14,
  },
});