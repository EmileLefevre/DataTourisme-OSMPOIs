import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  handleIndicator: {
    backgroundColor: "#ccc",
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.textSecondary,
  },
  tourBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: COLORS.badgeGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    color: COLORS.badgeGreenDark,
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: COLORS.backgroundTertiary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  address: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  payment: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  update: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 16,
    fontStyle: "italic",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsButton: {
    flex: 1,
    backgroundColor: COLORS.info,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  closeRouteButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "600",
  },
});
