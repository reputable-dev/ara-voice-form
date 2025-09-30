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
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
  },
});