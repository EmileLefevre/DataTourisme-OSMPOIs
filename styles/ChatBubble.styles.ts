import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const styles = StyleSheet.create({
  chatBubble: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.info,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  chatBubbleText: {
    fontSize: 28,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: COLORS.info,
    borderRadius: 16,
    padding: 12,
    maxWidth: "80%",
  },
  messageText: {
    color: COLORS.background,
    fontSize: 14,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: COLORS.info,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "600",
  },
});
