import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ModalScreen() {
  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => router.back()}>
      <Pressable style={styles.overlay} onPress={() => router.back()} testID="modalOverlay">
        <View style={styles.modalContent}>
          <Text style={styles.title}>Modal</Text>
          <Text style={styles.description}>This is an example modal. You can edit it in app/modal.tsx.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} testID="closeModal">
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#111111", borderRadius: 16, padding: 20, margin: 20, minWidth: 300, borderWidth: 1, borderColor: "#1F2937" },
  title: { fontSize: 18, fontWeight: "700", color: "#F3F4F6", marginBottom: 8 },
  description: { color: "#9CA3AF", marginBottom: 16 },
  closeButton: { backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.35)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  closeButtonText: { color: "#D1FAE5", fontWeight: "700", textAlign: "center" },
});